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
description: "Cómo se descubren los fallos que tus pruebas en verde no ven: nueve tipos de verificación, la pregunta que hace cada uno, y el punto ciego que deja."
banner: "/static/banners/doce-fallos-capas.jpg"
socialImage: "/static/social/doce-fallos-linkedin.jpg"
---

*Primera parte de una serie de cuatro sobre el método: el caso, cómo se le encarga trabajo a un agente, por qué una sola base de prueba te engaña y cuándo hay que cambiar el instrumento de medida.*

En julio de 2026, mi motor de análisis de T-SQL tenía 136 pruebas unitarias en verde, cero errores de parseo sobre una base de datos real y un grafo internamente coherente. En una tarde encontramos **doce defectos**: cuatro graves, cinco medios y tres bajos.

El peor hacía que la herramienta respondiera *"no hay riesgo"* cuando sí lo había. Preguntada por quién escribe en una tabla concreta, devolvía **cero escritores. Había tres.**

No los encontró escribir más pruebas. Los encontró **cambiar el tipo de pregunta**.

---

## Cómo empieza un descubrimiento: por algo que no encaja

Empezó con algo aburrido: tres documentos describían la misma ejecución con tres cifras distintas, y la captura de pantalla que ilustraba el artículo pertenecía a una cuarta.

La primera pregunta —*¿por qué esta ejecución dice 47 objetos y esta otra 64?*— tenía una respuesta que no esperaba: **no eran dos ejecuciones. Eran dos escalas de conteo.** La base de datos tiene 47 objetos en su catálogo y **cero triggers**. El grafo tiene 64 porque el análisis descubre 17 triggers que un procedimiento crea en tiempo de ejecución, montando el `CREATE TRIGGER` como texto y lanzándolo con `EXECUTE`.

Esa resta —47 + 17 = 64— era el producto entero, escrita en la documentación como si fuera una errata.

Pero la segunda pregunta fue la que abrió la caja: *¿y por qué el artefacto en disco dice 1.593 nodos si el código dice 1.529?* Porque el artefacto se había generado con código sin commitear. Llevaba semanas derivando y **ninguna prueba lo detectaba**, porque ninguna prueba miraba eso.

Ahí está el patrón, y es el único que sirve: **un descubrimiento no empieza con un fallo, empieza con una incoherencia que nadie vigilaba.**

## Congelar antes de buscar

El primer instinto fue arreglar. Fue el instinto equivocado.

Sin una línea base, cualquier arreglo mueve las cifras y no sabes cuál lo hizo. Así que primero congelamos: una ejecución canónica con las salidas de consola literales, los artefactos y las capturas, todo commiteado. **Nada estimado; lo que no salía de esa ejecución, se retiraba.**

Ese orden —**congelar → arreglar → recongelar**— parece burocracia hasta que ves lo que permite: durante cinco cambios de motor consecutivos, la base de referencia **no se movió ni un nodo**. Cuando al sexto por fin se movió, sabíamos exactamente cuál lo había hecho y por qué.

---

## Nueve tipos de verificación, nueve preguntas distintas

Aquí está el cambio de mentalidad, y es todo el post. Una capa de verificación no es un nivel de rigor: **es una pregunta**. Y una pregunta solo puede descubrir la clase de fallo que es capaz de formular.

| Tipo | La pregunta que hace | La clase de fallo que descubre |
|---|---|---|
| Unitarias | ¿sigue funcionando lo que funcionaba? | regresión |
| Reproducir a mano | ¿qué hace de verdad con cinco líneas delante? | fallos de tubería |
| **Contraste con el catálogo** | **¿me estoy dejando algo?** | **ausencias masivas** |
| Invariantes | ¿es coherente consigo mismo? | incoherencia |
| **Traza sentencia a sentencia** | **¿dice esto lo que dice el código?** | **ausencias puntuales** |
| **Gate con base de referencia** | **¿ha cambiado algo que no debía cambiar?** | **duplicación** |
| Determinismo | ¿la misma entrada da el mismo resultado? | indeterminismo |
| Coherencia de formatos | ¿todas las salidas cuentan lo mismo? | divergencia |
| e2e | ¿el consumidor puede usarlo? | contrato roto |

Lee la columna del medio entera y verás por qué doce defectos convivían con 136 pruebas en verde: **las unitarias solo saben preguntar una de las nueve cosas**. Nadie escribe un test para algo que no sabe que falta.

Las tres en negrita son las preguntas que yo no estaba haciendo. Son justo las que escondían los defectos graves. Las cuento una a una, porque el valor está en entender qué descubre cada una **y qué deja pasar**.

### ¿Me estoy dejando algo? — contraste con el catálogo

Contrastar el grafo contra el catálogo del propio SQL Server: `sys.foreign_keys`, `sys.sql_expression_dependencies`.

**98 de 98 claves ajenas. 90 de 90 en la segunda base. Cero ausencias, cero relaciones inventadas.**

Es la capa que casi nadie publica, porque casi nadie la pasaría. Y es la única que responde a esa pregunta con un número en vez de con una opinión.

**Su punto ciego:** no existe si trabajas sin base de datos. Contra ficheros `.sql` sueltos no hay catálogo contra el que comparar, y la pregunta deja de poder formularse.

### ¿Dice esto lo que dice el código? — la traza sentencia a sentencia

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

**Su punto ciego:** no escala. Leer a mano encuentra lo que ninguna otra capa ve, y solo donde te da tiempo a mirar.

### ¿Ha cambiado algo que no debía? — el gate con base de referencia

Una base de prueba con los resultados esperados fijados a mano.

Esta capa descubrió algo que **ninguna otra vigilaba**: mi propio arreglo de filtros en CTEs emitía pasos que volvían a declarar una lectura que ya existía. `READS_FROM` pasaba de 1 a 3 para la misma tabla. Ninguna capa vigilaba que una arista se emitiera **de más** — solo esa, porque alguien había fijado ahí un número exacto.

Y al arreglarlo, el mismo gate cazó el segundo error: la lectura correcta aparecía en `#step2` en vez de `#step0`, porque los identificadores de paso son posicionales y emitir pasos antes de tiempo **renumeraba todo lo demás en silencio**.

**Su punto ciego:** solo vigila lo que alguien se molestó en fijar. Fuera de esos números, no mira.

### Y la pregunta más barata de todas

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

Casi todos los defectos eran **falsos negativos**: el grafo callaba.

Uno era justo lo contrario. `RAISERROR` se clasificaba como *lanzar un error* sin mirar la severidad. En T-SQL, severidad ≤ 10 **no lanza nada**: es el idioma estándar para escribir progreso al cliente. Resultado: el camino de terminación **normal** de un procedimiento se describía como cuatro errores consecutivos.

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

**Más pruebas no es más cobertura.** Doce defectos convivían con 136 en verde. Lo que faltaba no era cantidad: eran **tipos** de pregunta. Y ninguno sustituye a otro — los invariantes no ven ausencias, la traza no ve duplicaciones, y el contraste con el catálogo no existe si trabajas sin base de datos.

Por eso la lista de nueve no es una checklist de calidad. Es otra cosa: **una colección de puntos ciegos que no se solapan.** Añadir un décimo tipo que falle igual que uno de los nueve no aporta nada. Añadir uno que falle **distinto** puede darte un defecto grave.

**Lo que hace productiva a la IA no es la velocidad.** Un agente escribe un arreglo en minutos; eso ya lo sabíamos. Lo que cambia el resultado es que **la verificación sea más barata que el error**. Cuando comprobar una hipótesis cuesta dos minutos, dejas de defender corazonadas y empiezas a descartarlas — seis veces en una tarde. Sin ese ciclo, lo único que aceleras es la producción de código que nadie ha verificado, y eso no es productividad: es deuda a mayor velocidad.

**Y publica los fallos.** Que la validación encontrara doce defectos en mi propia herramienta dice más de su fiabilidad que cualquier tabla en verde. Una herramienta que nunca ha fallado es una herramienta que nadie ha medido.

---

## Aplícalo

Si trabajas con un agente de código sobre tu propio proyecto, pégale esto:

```text
Con mi permiso, clasifica mis comprobaciones automáticas por la PREGUNTA
que cada una es capaz de hacer, no por cuántas son: regresión, ausencias
masivas, ausencias puntuales, duplicación, incoherencia, indeterminismo,
divergencia entre formatos y contrato con el consumidor. Dime qué
preguntas no hace ninguna de mis comprobaciones: ese es el hueco donde
viven los defectos que mis pruebas en verde no ven. Para cada hueco,
propón la comprobación más barata que lo cerraría. No ejecutes cambios
todavía y no inventes resultados: si necesitas correr algo, dime el
comando y espera a que yo lo lance.
```

---

*El motor del que hablo es open source: [github.com/rcm-on/tsql-lineage-toolkit](https://github.com/rcm-on/tsql-lineage-toolkit). Los doce están documentados uno a uno en `docs/corpus-multibase.md`, con su severidad, su causa, la rama que lo arregló y cómo se verificó. Los arreglos no los escribí yo, los escribieron agentes; cómo se les encarga es el siguiente post de la serie.*
