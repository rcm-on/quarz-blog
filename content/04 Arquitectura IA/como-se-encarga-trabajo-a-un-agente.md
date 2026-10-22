---
title: "Cómo se le encarga trabajo a un agente"
date: 2026-07-31
draft: true
tags:
  - ia
  - arquitectura
  - agentes
  - orquestación
  - harness
  - método
description: "Doce arreglos escritos por agentes en una tarde. La plantilla completa del encargo, bloque por bloque, y la regla que más rindió."
---

*Segunda parte de una serie de cuatro: [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|doce fallos en mi propia herramienta]] · **el método** · [[04 Arquitectura IA/un-solo-corpus-te-engana|una sola base de prueba te engaña]] · [[04 Arquitectura IA/cambiar-el-instrumento-de-medida|cambiar el instrumento]].*

En el [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|post anterior]] conté los doce defectos que encontramos en mi motor de lineage y qué capa de verificación cazó cada uno. Falta la otra mitad: **los doce arreglos no los escribí yo**. Los escribieron agentes trabajando en paralelo, y yo casi no toqué código.

La diferencia entre que eso funcione o sea un desastre está casi entera en **cómo se escribe el encargo**. Este post es esa plantilla, entera, con la razón medida de cada bloque.

---

## Seis reglas, por orden de importancia

**1. Dar el fallo reproducido, no el síntoma.** No *"el `WHERE` de las CTE no se captura"*, sino cinco líneas de SQL con el resultado actual al lado y la ruta del fichero donde ya está escrita la reproducción. El agente empieza a diagnosticar en el minuto uno en vez de en el treinta.

**2. Pedir que refute la hipótesis.** Es lo más valioso que descubrí. A un agente le di mi teoría sobre la causa de un fallo. La **descartó con evidencia** —montó un caso que la contradecía— y encontró la causa real, que era distinta y afectaba a más sitios de los que yo creía. Si le hubiera dicho "arregla esto", habría parcheado el síntoma que le describí y el fallo real seguiría ahí.

Por eso el encargo lleva siempre una frase explícita: *"si la hipótesis resulta falsa, dilo: una hipótesis refutada con datos vale tanto como un arreglo"*.

**3. Exigir el número, no el adjetivo.** Cada encargo incluye la línea base —nodos, aristas, pruebas— y pide las cifras después, con el control de no-regresión nombrado. *"Funciona bien"* no es un informe. *"WideWorldImporters sigue en 1.593/4.382"* sí.

**4. Pedir que declaren lo que dejan fuera.** *"Cualquier cosa que decidas NO arreglar, y por qué."* Un límite declarado es una decisión de ingeniería; un límite silencioso es una trampa para el siguiente que lo toque. De ahí salieron varios de los huecos que documentamos sin arreglar.

**5. Pasarles las trampas conocidas.** Que un `Select-Object -First` mata el proceso aguas arriba en PowerShell y trunca artefactos sin avisar. Que dos opciones de `sqlcmd` son incompatibles. Que las rutas largas rompen la compilación. Cada trampa que documentas una vez es media hora que no pierde el siguiente agente. **Y son las mismas trampas en las que caí yo primero.**

**6. Prohibir explícitamente lo que no deben tocar.** El árbol de trabajo principal no compilaba; sin esa advertencia, cada agente habría perdido su primera media hora peleando con errores ajenos.

---

## La plantilla, entera

Después de una docena de encargos, los que salieron bien tenían todos la misma estructura. La escribo completa porque es lo más reutilizable de la tarde:

```markdown
## El fallo (reproducido, no descrito)
   La reproducción mínima, con el resultado actual al lado, y la ruta del fichero
   donde ya está escrito. Nada de "los WHERE de las CTE no se capturan":
   cinco líneas de SQL y la salida real.

## Diagnóstico previo (si lo hay) — y permiso de refutarlo
   "Otro agente apunta a X. VERIFÍCALO, no lo des por bueno. Si resulta
   falso, dilo: una hipótesis refutada con datos vale tanto como un arreglo."

## Alcance y decisiones que TÚ debes tomar
   Lo que hay que decidir, con las alternativas y su coste, pidiendo que
   razone la elección. No decidas por él lo que él verá mejor.

## Reglas duras
   - Worktree y rama propios: `git worktree add -b fix/x C:\temp\fix-x <base>`
   - Dónde NO trabajar y por qué (el árbol principal no compila)
   - No tocar otras ramas. No hacer push.
   - "Hoy hay 182 pruebas en verde y no puede caer ninguna."

## Pruebas obligatorias
   Enumeradas. Y la exigencia clave: que FALLEN ANTES y pasen después.
   Una prueba que no falla antes no prueba nada.
   Incluir siempre una de CONTROL: lo que NO debe cambiar.

## Medición
   La línea base numérica exacta, con las rutas del banco de pruebas.
   Qué cifra es el control de no-regresión y qué significa si se mueve.

## Trampas del entorno
   Las que ya te costaron media hora. Literalmente copiadas.

## Reporta
   Causa raíz real · ficheros tocados · qué cifras se mueven y por qué ·
   qué decides NO arreglar y por qué · tu valoración honesta de si esto
   debe entrar en producción. "No lo vendas: si mete más ruido que señal,
   dilo con números."
```

Cada bloque está ahí por una razón medida:

| Bloque | Qué ahorra | Qué evita |
|---|---|---|
| Repro con ruta | la fase de diagnóstico entera | que reproduzca mal el fallo |
| Línea base numérica | que mida el "antes" | que no detecte lo que rompió |
| Control nombrado | — | el efecto colateral silencioso |
| Permiso de refutar | — | **parchear el síntoma que le describiste** |
| Trampas | ~30 min por agente | que caiga donde caíste tú |
| Prohibiciones | ~30 min por agente | que pelee con errores ajenos |
| "Falla antes" | — | la prueba decorativa |
| "No lo vendas" | — | el informe complaciente |

Ese último bloque dio el resultado que menos esperaba: un agente **recomendó no llevar a producción su propio trabajo**, con los números que lo justificaban. Un prototipo que recuperaba un 21% de los casos en una base de prueba y **cero** en otra. Sin esa frase habría recibido un informe entusiasta y lo habría integrado.

---

## La regla que más rendimiento dio

De las ocho filas de esa tabla, una rinde más que las otras siete juntas, y merece enunciarse aparte:

> [!important] Nunca entregues una hipótesis sin permiso explícito de destruirla, ni sin el control que revelaría que es falsa.
> Y un control válido es **el que solo puede fallar**: si no hay un resultado concreto que lo tumbe, no es un control, es decoración.

La razón es la asimetría que conté al final del [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|post anterior]]: **el resultado que te da la razón es el que hay que verificar dos veces.** Un agente al que le describes tu teoría y le pides que arregle "eso" tiene todos los incentivos estructurales para encontrártela confirmada. No miente: busca donde le has dicho que busque, y encuentra algo que encaja.

Un agente al que le das la teoría *y* la instrucción de destruirla hace un trabajo distinto. En esta tarde eso salió dos veces bien y una vez espectacularmente bien: la corazonada de que dos defectos compartían causa raíz era falsa, eran independientes, y el agente lo demostró con un caso que yo no había construido.

---

## El marco no es el encargo: es lo que se acumula

Lo que de verdad multiplica la productividad no es escribir mejor un encargo. Es que **tres de esos bloques son capital reutilizable** que crece solo:

- **La línea base** se regenera con un comando y sirve para todos los encargos siguientes.
- **Las trampas** son un fichero que solo crece. Cada media hora que pierdes una vez, no la pierde nadie más.
- **Los controles de no-regresión** ya están escritos: la suite de pruebas y el banco de pruebas congelado.

El primer encargo del día costó escribirlo. El octavo era copiar la plantilla y cambiar cuatro párrafos. **Y la calidad del octavo fue mejor**, porque llevaba dentro todo lo aprendido en los siete anteriores.

Ese es el marco. No una herramienta ni un prompt: **un conjunto de activos —base congelada, controles, trampas documentadas, criterio de terminado— que hacen que el siguiente encargo sea más barato y más seguro que el anterior.** Sin ellos, cada tarea con un agente empieza de cero y su calidad depende de la suerte.

---

## Orquestar sin perder la trazabilidad

Tres reglas mecánicas, todas aprendidas rompiéndolas:

**Un árbol de trabajo y una rama por arreglo.** No por elegancia: tres compilaciones sobre el mismo directorio se pisan el binario. Me pasó, con dos agentes bloqueándose el ejecutable. Y ramas separadas significan que cada cambio es un diff aislado que puedo aceptar, rechazar o revertir por separado.

**Integrar de uno en uno, en orden de riesgo creciente.** Primero el que **no debe** mover ninguna cifra — si la mueve, tocó lo que no debía y me entero en el acto. El que sí las mueve, el último y solo.

**Después de cada integración, la suite completa y las cuatro ejecuciones.** Suena excesivo hasta que el sexto cambio mueve la base y sabes en treinta segundos cuál fue.

Y una consideración de coste que no es menor, y que desarrollo en [[04 Arquitectura IA/orquestar-un-equipo-de-modelos|orquestar un equipo de modelos]]: los modelos caros planifican, deciden y verifican; los baratos ejecutan lo mecánico. Un arreglo acotado, con el fallo reproducido y la línea base dada, es trabajo perfectamente delegable a un modelo más barato — los doce arreglos de esa tarde los escribieron modelos intermedios. Lo que **no** se delega es decidir si el arreglo entra.

---

## Los errores se reparan solos si el ciclo es corto

Lo más interesante de la tarde no fue que los agentes arreglaran cosas. Fue **cuántas veces se corrigieron entre ellos, y a mí**.

**Un agente me corrigió un dato publicado.** Yo había afirmado que los ficheros de entrada no llevaban marca de codificación. Había comprobado uno de los dos caminos que la generan. El agente comprobó los dos y me lo dijo con los bytes delante.

**Un gate rechazó el arreglo de otro agente.** El de filtros en CTE pasaba sus propias pruebas nuevas y rompía una base de prueba de referencia que llevaba meses ahí. Dos veces seguidas: primero por duplicar una lectura, después por renumerar los identificadores de paso. Ninguna de las dos las habría detectado yo leyendo el diff.

**Y sus propias pruebas los delataron.** Una prueba escrita para verificar que la recursión no cuelga el análisis falló por sintaxis —el atributo de tiempo límite exige un test asíncrono—. Trivial, pero es la prueba haciendo su trabajo: si no se ejecuta, no protege.

Esto es lo que quiero decir con **auto-reparación**: no es que el sistema se arregle mágicamente. Es que **hay suficientes puntos de control independientes como para que un error tenga que superarlos todos para llegar a producción**. Y cada uno mira en una dirección distinta.

El coste de esa red es real: doce arreglos costaron el doble en verificación que en código. La alternativa era publicar una herramienta que responde *"nadie escribe en esta tabla"* teniendo tres escritores.

---

## Dónde queda el humano

Repasando la tarde, casi no escribí código. Los agentes escribieron los doce arreglos y la mayoría de las pruebas.

Lo que sí hice, y no era delegable:

**Definir qué cuenta como correcto.** Que un `WHERE` sea una regla de negocio pero no gobierne el flujograma. Que un `RAISERROR` de severidad 10 sea una impresión y no un error. Que ante una severidad variable haya que **fallar cerrado**. Que una función de tabla sea un salto opaco para el lineage de columna pero visible para el de objeto. Ninguna de esas decisiones la puede tomar quien no conoce el dominio, y todas cambian lo que la herramienta afirma.

**Definir cómo se sabría.** Elegir la fuente de verdad. Decidir que el control de no-regresión es una base congelada. Diseñar la prueba que **falla antes y pasa después**, y saber que si no falla antes no prueba nada.

**Decidir el orden.** Congelar antes de arreglar. Integrar por riesgo creciente. Aparcar el modelado de tablas temporales porque es una decisión de producto, no un `switch`.

**Y desconfiar del resultado que me daba la razón.** Seis veces.

Esto es lo que separa supervisar de revisar. Revisar es leer el diff y decir que sí. Supervisar es haber definido, **antes**, el criterio con el que ese diff se acepta o se rechaza — y montar el sistema que aplica ese criterio sin ti.

Cuando ese sistema existe, el trabajo se invierte: dejas de escribir la solución y pasas a **especificar el objetivo y la forma de comprobar que se ha alcanzado**. Es la parte del oficio que no se automatiza, porque delegarla es delegar el objetivo mismo.

---

## Aplícalo

Si vas a encargarle un arreglo a un agente de código, pégale esto:

```text
Antes de nada, pídeme permiso y los datos reales que falten (el
fallo reproducido, la línea base, el control de no-regresión):
no los inventes. Con mi visto bueno, escribe el encargo con la
plantilla de este post: el fallo reproducido con ruta de fichero,
mi hipótesis con permiso explícito de refutarla, las decisiones
que debo tomar yo, las reglas duras (worktree propio, qué no
tocar), las pruebas que fallen antes de arreglar, la medición con
cifras reales y las trampas del entorno. Cierra pidiendo causa
raíz, qué decides no arreglar, y tu valoración honesta de si
esto debe entrar en producción.
```

---

**Sigue en la serie:** [[04 Arquitectura IA/un-solo-corpus-te-engana|una sola base de prueba te engaña]] — por qué uno de los doce defectos era estructuralmente imposible de encontrar con la base de datos que llevaba meses usando.
