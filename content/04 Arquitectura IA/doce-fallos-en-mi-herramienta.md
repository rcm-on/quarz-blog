---
title: "Doce fallos en mi propia herramienta"
date: 2026-07-30
draft: false
tags:
  - ia
  - arquitectura
  - agentes
  - evaluación
  - calidad
  - data-lineage
description: "Un motor con 136 pruebas en verde y cero errores de parseo escondía doce defectos. Lo que faltaba no era cantidad de pruebas: eran tipos."
banner: "/static/banners/doce-fallos-capas.jpg"
socialImage: "/static/social/doce-fallos-linkedin.jpg"
---

*Primera parte de una serie de cuatro sobre el método: el caso, [[04 Arquitectura IA/como-se-encarga-trabajo-a-un-agente|cómo se le encarga trabajo a un agente]], [[04 Arquitectura IA/un-solo-corpus-te-engana|por qué una sola base de prueba te engaña]] y [[04 Arquitectura IA/cambiar-el-instrumento-de-medida|cuándo hay que cambiar el instrumento de medida]].*

En julio de 2026, mi motor de análisis de T-SQL tenía 136 pruebas unitarias en verde, cero errores de parseo sobre una base de datos real y un grafo internamente coherente. En una tarde encontramos **doce defectos**. Cuatro de ellos hacían que la herramienta respondiera *"no hay riesgo"* cuando sí lo había.

No los encontró escribir más pruebas. Los encontró entender que **cada capa de verificación caza un tipo de fallo distinto**, y que yo solo estaba usando dos.

---

## El síntoma que abrió la caja

Empezó con algo aburrido: tres documentos describían la misma ejecución con tres cifras distintas, y la captura de pantalla que ilustraba el artículo pertenecía a una cuarta.

La primera pregunta —*¿por qué esta ejecución dice 47 objetos y esta otra 64?*— tenía una respuesta que no esperaba: **no eran dos ejecuciones. Eran dos escalas de conteo.** La base de datos tiene 47 objetos en su catálogo y **cero triggers**. El grafo tiene 64 porque el análisis descubre 17 triggers que un procedimiento crea en tiempo de ejecución, montando el `CREATE TRIGGER` como texto y lanzándolo con `EXECUTE`.

Esa resta —47 + 17 = 64— era el producto entero, escrita en la documentación como si fuera una errata.

Pero la segunda pregunta fue la que abrió la caja: *¿y por qué el artefacto en disco dice 1.593 nodos si el código dice 1.529?* Porque el artefacto se había generado con código sin commitear. Llevaba semanas derivando y **ninguna prueba lo detectaba**, porque ninguna prueba miraba eso.

## Congelar antes de arreglar

El primer instinto fue arreglar. Fue el instinto equivocado.

Sin una línea base, cualquier arreglo mueve las cifras y no sabes cuál lo hizo. Así que primero congelamos: una ejecución canónica con las salidas de consola literales, los artefactos y las capturas, todo commiteado. **Nada estimado; lo que no salía de esa ejecución, se retiraba.**

Ese orden —**congelar → arreglar → recongelar**— parece burocracia hasta que ves lo que permite: durante cinco cambios de motor consecutivos, la base de referencia **no se movió ni un nodo**. Cuando al sexto por fin se movió, sabíamos exactamente cuál lo había hecho y por qué.

---

## No son nueve maneras de hacer lo mismo

Acabamos con nueve capas. Lo interesante no es la lista: es que **encontraron cosas distintas**, y ninguna podía sustituir a otra.

| Capa | Encuentra | Ejemplo real |
|---|---|---|
| Unitarias | regresión | 136 en verde, y doce defectos debajo |
| Reproducir a mano | fallos de tubería | `INSERT…UNION` perdía las 2 lecturas |
| **Contraste con el catálogo** | **ausencias masivas** | 98/98 y 90/90 claves ajenas |
| Invariantes | incoherencia | 0 violaciones en 5.281 pasos |
| **Traza a mano** | **ausencias puntuales** | 1 arista donde debía haber 8 |
| **Gate con base de referencia** | **duplicación** | una lectura emitida 3 veces |
| Determinismo | indeterminismo | 3 ejecuciones, hash idéntico |
| Coherencia de formatos | divergencia | los tres formatos dan la misma cifra |
| e2e | contrato roto con el consumidor | 0 errores de JS |

Esa tabla es todo el post. Si te llevas una sola cosa, que sea la columna del medio: **no son nueve maneras de hacer lo mismo con más o menos rigor. Son nueve preguntas distintas**. Las tres en negrita son las que yo no me estaba haciendo, y son justo las que escondían los defectos graves.

### Contraste con el catálogo — falsos negativos

Contrastar el grafo contra el catálogo del propio SQL Server: `sys.foreign_keys`, `sys.sql_expression_dependencies`.

**98 de 98 claves ajenas. 90 de 90 en la segunda base. Cero ausencias, cero relaciones inventadas.**

Esta es la capa que casi nadie publica, porque casi nadie la pasaría. Y es la única que responde a *"¿me estoy dejando algo?"* con un número en vez de con una opinión.

### La traza sentencia a sentencia — ausencias

Poner el código fuente y los pasos extraídos **uno al lado del otro**, línea a línea, y leerlos.

Es la capa más manual y la que encontró el fallo más caro. Este procedimiento:

```sql
INSERT Warehouse.VehicleTemperatures (VehicleRegistration, ChillerSensorNumber, ...)
SELECT VehicleRegistration, ChillerSensorNumber, ...
FROM OPENJSON(@FullSensorDataArray, N'$.Recordings')
WITH ( VehicleRegistration nvarchar(40) N'$.properties.rego', ... );
```

tenía **una sola arista de datos** en el grafo: la escritura. Escribía siete columnas y no se sabía de dónde salía ninguna. Toda referencia a una función con valor de tabla —`OPENJSON`, los DMV del sistema, y también las funciones de usuario— desaparecía sin dejar rastro.

Y pasaba todos los invariantes con nota: sus ocho pasos estaban bien ordenados, bien anidados y bien gobernados.

> [!important] Los invariantes detectan incoherencias. No detectan ausencias.
> Un grafo puede estar perfectamente bien formado y describir otra cosa.

### El gate con base de referencia — duplicaciones

Una base de prueba con los resultados esperados fijados a mano.

Esta capa cazó algo que **ninguna otra vigilaba**: mi propio arreglo de filtros en CTEs emitía pasos que volvían a declarar una lectura que ya existía. `READS_FROM` pasaba de 1 a 3 para la misma tabla. Ninguna capa vigilaba que una arista se emitiera **de más** — solo esa, porque alguien había fijado ahí un número exacto.

Y al arreglarlo, el mismo gate cazó el segundo error: la lectura correcta aparecía en `#step2` en vez de `#step0`, porque los identificadores de paso son posicionales y emitir pasos antes de tiempo **renumeraba todo lo demás en silencio**.

### Y la más barata de todas

Cinco líneas de SQL, pasadas por el binario real, mirando la base de datos resultante:

```sql
INSERT INTO Destino SELECT x FROM Fuente1;                          -- Fuente1 ✓
INSERT INTO Destino SELECT x FROM Fuente2 UNION ALL SELECT y FROM Fuente3;  -- ✗ las DOS
SELECT x FROM Fuente4 UNION ALL SELECT y FROM Fuente5;              -- ambas ✓
```

Un `UNION` suelto funciona. Un `INSERT` con `UNION` **pierde todas las lecturas de la sentencia**. Cero errores de parseo: falla en silencio.

Y el arreglo ya estaba escrito **en el mismo fichero, cuarenta líneas más arriba**: alguien encontró exactamente este defecto en el `SELECT` y lo corrigió ahí. Nadie lo replicó en el `INSERT`.

> [!warning] Una coincidencia incómoda, porque hay que contarla
> El artefacto derivado que abrió esta historia tenía **1.593 nodos y 4.282 aristas**. Después de los doce arreglos, la ejecución buena da **1.593 nodos y 4.382 aristas**. Mismo número de nodos por pura casualidad, grafo distinto. Lo escribo porque durante media hora creí que había vuelto al punto de partida, y porque un número que coincide es exactamente el tipo de dato que hay que mirar dos veces.

---

## El falso positivo, que es peor que el falso negativo

Once de los doce defectos eran **falsos negativos**: el grafo callaba.

Uno era distinto. `RAISERROR` se clasificaba como *lanzar un error* sin mirar la severidad. En T-SQL, severidad ≤ 10 **no lanza nada**: es el idioma estándar para escribir progreso al cliente. Resultado: el camino de terminación **normal** de un procedimiento se describía como cuatro errores consecutivos.

**1.012 casos.**

Un falso negativo te deja sin información. Un falso positivo te da información incorrecta **con la misma confianza que la correcta**, y destruye la propiedad que hace útil a la herramienta: que cuando afirma algo, es cierto.

Es la misma razón por la que el motor se niega a adivinar el destino de un `EXEC` dinámico cuando el nombre de la base viene en un parámetro. Prefiere decir "no lo sé" y contarlo. Un "no lo sé" contabilizado es información; un destino inventado es una mentira con formato de dato.

---

## La parte que no sale bien en la foto

**Seis hipótesis mías resultaron falsas, y las descartó la medición, no mi criterio.**

Afirmé que la entrada no llevaba marca de codificación: había comprobado uno de los dos caminos. Di por buena una corazonada de que dos defectos compartían causa raíz: eran independientes.

Y al montar una prueba, un comando mal escrito dejó un fichero vacío; el resultado *confirmó* lo que yo esperaba encontrar. Si me hubiera quedado ahí, habría reportado un fallo inexistente. Solo lo detecté porque ejecuté después el control con entrada idéntica.

Hay un patrón, y no es agradable: **el resultado que confirma lo que esperabas es el que hay que verificar dos veces.**

Incluso mi propia verificación se dejó engañar. Para comprobar que no faltaban objetos, extraje las declaraciones del código fuente con expresiones regulares. Me reportó una tabla ausente llamada `if`. La había leído de dentro de un comentario: `/* Create table if it doesn't exist */`.

Es exactamente el error que esta herramienta existe para evitar —confundir texto con código— cometido por mí, verificando, en la misma tarde en la que medimos que un `grep` ve 52 condicionales donde solo hay 18.

---

## Qué me llevo

**Más pruebas no es más cobertura.** Doce defectos convivían con 136 pruebas en verde. Lo que faltaba no era cantidad: eran **tipos** de verificación. Y ninguna capa sustituye a otra: los invariantes no ven ausencias, la traza no ve duplicaciones, y el contraste con el catálogo no existe si trabajas sin base de datos.

**Lo que hace productiva a la IA no es la velocidad.** Un agente escribe un arreglo en minutos; eso ya lo sabíamos, y no es lo que cambia el resultado. Lo que lo cambia es que **la verificación sea más barata que el error**. Cuando comprobar una hipótesis cuesta dos minutos, dejas de defender corazonadas y empiezas a descartarlas — seis veces en una tarde. Sin ese ciclo, lo único que aceleras es la producción de código que nadie ha verificado, y eso no es productividad: es deuda a mayor velocidad.

**Publica los fallos.** Que la validación encontrara doce defectos en mi propia herramienta dice más de su fiabilidad que cualquier tabla en verde. Una herramienta que nunca ha fallado es una herramienta que nadie ha medido.

---

## Aplícalo

Si trabajas con un agente de código sobre tu propio proyecto, pégale esto:

```text
Con mi permiso, clasifica mis comprobaciones automáticas por el TIPO de
fallo que cada una puede cazar, no por cuántas son: regresión, ausencias
masivas, ausencias puntuales, duplicación, incoherencia, indeterminismo,
divergencia entre formatos y contrato con el consumidor. Dime qué tipos
no tengo cubiertos por ninguna comprobación: ese es el hueco donde viven
los defectos que mis pruebas en verde no ven. Para cada hueco, propón la
comprobación más barata que lo cerraría. No ejecutes cambios todavía y
no inventes resultados: si necesitas correr algo, dime el comando y
espera a que yo lo lance.
```

---

*El motor del que hablo es open source: [github.com/rcm-on/tsql-lineage-toolkit](https://github.com/rcm-on/tsql-lineage-toolkit). Los doce defectos, con su reproducción y las cifras antes y después, están documentados en el propio repositorio. Los arreglos no los escribí yo, los escribieron agentes — y la plantilla de encargo que usé va entera en [[04 Arquitectura IA/como-se-encarga-trabajo-a-un-agente|el siguiente post]].*
