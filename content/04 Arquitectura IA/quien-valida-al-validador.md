---
title: "Quién valida al validador"
date: 2026-08-09
draft: true
tags:
  - ia
  - arquitectura
  - agentes
  - orquestación
  - evaluación
  - método
description: "Cinco mecanismos para validar la validación de un sistema de agentes, y por qué el árbitro final no puede ser un LLM."
---

*Continúa la serie: [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|doce fallos en mi propia herramienta]] · [[04 Arquitectura IA/como-se-encarga-trabajo-a-un-agente|cómo se le encarga trabajo a un agente]] · [[04 Arquitectura IA/un-solo-corpus-te-engana|una sola base de prueba te engaña]] · [[04 Arquitectura IA/cambiar-el-instrumento-de-medida|cambiar el instrumento]].*

Orquestar un equipo de modelos multiplica dos cosas a la vez: lo que se produce y lo que hay que creerse. La primera es la que se ve en las demos. La segunda es la que decide si el experimento sirve para algo.

Y hay una pregunta que casi nadie se hace cuando monta capas de verificación alrededor de sus agentes: **¿quién comprueba el comprobador?** Porque una medición rota no da error. Da verde.

---

## El cero culpable

Empiezo por la regla más pequeña y la que más veces me ha salvado.

**Un resultado vacío es un instrumento roto hasta que se demuestre lo contrario.**

`0 errores`. `0 diferencias`. `Ninguna incidencia encontrada`. Todos ellos tienen dos explicaciones posibles —que no haya nada, o que no estés mirando— y la interfaz es idéntica en los dos casos. La diferencia con un fallo normal es que el fallo te interrumpe y el cero te felicita.

Esto se agrava con agentes por un motivo estadístico simple: un agente produce muchos más resultados por hora de los que tú puedes auditar, y **el sesgo de confirmación escala con el volumen**. El resultado que te da la razón hay que verificarlo dos veces; el que te la quita ya viene con su propia alarma.

> [!important] La asimetría de la confirmación
> Un resultado que contradice tu hipótesis se investiga solo: duele, y el dolor es la señal. Un resultado que la confirma se archiva sin mirar. Por eso el sesgo no se corrige con más atención, sino con mecanismos que hagan ruido cuando todo va bien.

---

## El control negativo: sabotear la fuente de verdad a propósito

El trinquete más grande de mi motor de lineage compara lo que extrae contra el catálogo de SQL Server: las dependencias a nivel de columna que declara en sus vistas de sistema, congeladas sobre una base de prueba de 739 módulos.

Ese gate mide recall y precisión. Y a su lado vive un segundo test que no mide el motor: **mide la medición**.

```text
Measurement_IsSensitive_ControlThatMustCollapse
```

Lo que hace es sabotear el catálogo a conciencia —renombra todas las columnas a nombres que no existen— y **exige que el recall se desplome por debajo del 0,1%**. Si con un catálogo saboteado la comparación sigue dando cifras razonables, la comparación estaba rota: una clave mal formada, una normalización que iguala todo, un conjunto vacío comparándose con otro conjunto vacío. En ese caso los umbrales del test de al lado no significan nada, y llevaban meses sin significar nada.

Es la misma idea que el control negativo de un laboratorio: la muestra que **tiene que** dar negativo. Si da positivo, el que falla es el reactivo, no el paciente.

Este patrón se generaliza a casi cualquier verificación automática, y es barato:

| Si tu comprobación… | El control negativo es… |
|---|---|
| compara dos conjuntos | perturbar uno y exigir que la coincidencia caiga a cero |
| valida un formato | inyectar un documento inválido y exigir que lo rechace |
| detecta un antipatrón | pasarle código limpio y exigir cero hallazgos |
| mide cobertura | borrar la mitad de la entrada y exigir que la cifra baje |

En el mismo gate hay una variante barata y muy rentable: el número de filas de la fuente de verdad se comprueba con **igualdad exacta**, no con un `>`. Es un fichero congelado; si cambia de tamaño, o se regeneró contra otra base o se truncó — y en ambos casos los suelos dejan de referirse a lo que se está midiendo.

---

## Los umbrales que se calibraron a ojo

Un gate se sostiene sobre un umbral, y el umbral es el sitio donde se cuela la opinión.

Dos reglas, las dos aprendidas a base de tropezar:

**El suelo es una cifra medida, no una aspiración.** Los míos viven en un manifiesto aparte, y están *truncados* por debajo del valor medido, no redondeados. Suena a detalle tonto: no lo es. Con el informe imprimiendo un decimal, poner el suelo en el valor redondeado hace fallar al propio commit que lo mide. Pasó dos veces antes de escribir la regla.

**Un umbral escrito a mano hereda el sesgo del único caso que tenías delante.** En ese gate había un `>= 1000` aristas de columna, puesto a ojo cuando la única base de prueba tenía 739 módulos. El día que entró un segundo elemento del banco de pruebas —24 procedimientos, 480 aristas— lo tumbó. No era un fallo del motor: era un número inventado que llevaba meses pasando por invariante. Es exactamente el trabajo que se le pide a una segunda fuente, y es el mismo mecanismo del [[04 Arquitectura IA/un-solo-corpus-te-engana|post de la base de prueba]] aplicado ya no al producto, sino al instrumento.

Y la tercera, que es la contraintuitiva: **hay métricas que no se deben gatear**. Mi precisión global *baja* cuando el motor mejora, porque al resolver más lecturas a través de vistas emite aristas correctas que el catálogo, que se detiene en la vista, no puede respaldar. Un suelo ahí no detecta regresiones: solo castiga mejoras, y acaba bajándose por costumbre hasta no significar nada. La solución fue gatear precisión **por clase de evidencia**, con su suelo cada una, porque así ninguna clase puede degradarse escondida detrás de otra.

---

## La prosa de un agente caduca en silencio

Este es el mecanismo que menos he visto por ahí y el que más específico es de trabajar con agentes.

Dos modelos de familias distintas auditaron mi proyecto y entregaron dos informes en prosa. Buenos informes, con cifras concretas: tal procedimiento tiene complejidad 19, escribe exactamente en 17 tablas, resuelve sus 34 pasos de SQL dinámico, impacta al 100% de dos vistas de portal.

El problema no es que estuvieran mal. Es que **estaban vivos**: cada uno de esos números depende del estado del motor, y el motor cambia todas las semanas. Un informe en Markdown no tiene forma de enterarse de que ha dejado de ser cierto. Se queda ahí, con su tono de autoridad intacto, envejeciendo en silencio — y alguien lo cita seis meses después.

Ya me había pasado una vez con un documento de mediciones, así que la respuesta fue convertir el informe en un test:

> [!important] Toda cifra afirmada en prosa se re-deriva del artefacto real en cada ejecución
> No se comprueba que el informe *diga* 17 tablas. Se cuentan las tablas en el grafo de verdad y se comparan con las 17 que el informe afirma. Si el motor cambia, **el informe roto suena**, en vez de quedarse obsoleto sin avisar.

Y dentro de esa lista hay un caso que no debería faltar en ninguna: una vista que **no** está afectada, y que tiene que seguir sin estarlo (`0 de 6`). Es el control negativo otra vez, ahora aplicado al análisis de impacto: un auditor que solo confirma impactos aprueba con nota a cualquiera que conteste "todo está afectado".

---

## Nadie corrige su propio examen

Con esto montado, la orquestación deja de ser un problema de prompts y pasa a ser uno de **topología**: quién produce, quién revisa y quién arbitra.

Mi reparto acabó en tres capas, y lo importante es qué caza cada una:

1. **Comparación entre modelos sobre el mismo encargo.** Útil, pero limitada por construcción: solo puede preguntar lo que ya sabías preguntar, porque las respuestas esperadas las derivas tú de antemano.
2. **Auditoría cruzada entre familias distintas.** Aquí sí aparece lo que no se te había ocurrido — es la capa abierta, y por eso a un modelo le encargué específicamente el papel de editor crítico buscando huecos, sin permiso para tocar el código.
3. **Un árbitro determinista.** Y este **no puede ser un LLM**.

El tercer punto es el que me costó aceptar. Cuando dos agentes coinciden, la coincidencia se siente como evidencia y casi nunca lo es: pueden estar leyendo el mismo artefacto obsoleto, arrastrando el mismo malentendido del enunciado o compartiendo el mismo sesgo hacia la respuesta que suena bien. Dos modelos de acuerdo son dos muestras correlacionadas, no dos testigos.

El árbitro tiene que ser código que recalcula la verdad desde el artefacto. Un juez LLM tiene exactamente el mismo sesgo de confirmación que los evaluados, con la diferencia de que además suena convincente.

De ahí sale la regla que abre mi guía de verificación, y que es la frase que más rendimiento me ha dado en todo el proyecto:

> **No declares "verificado" por leer un mensaje de commit o el informe de otro agente. Ejecuta el comando tú mismo y compara la salida literal.**

Esa guía está escrita para que la ejecute **cualquier modelo, no hace falta uno caro**: cada paso trae el comando exacto, la salida literal esperada y el criterio de pase/fallo. Ese es el truco de productividad real, y no tiene nada de glamuroso — verificar deja de ser trabajo de arquitecto y pasa a ser una tarea mecánica delegable, mientras el criterio sobre qué significa "está bien" sigue siendo mío.

---

## El impuesto invisible: el árbol compartido

Un apunte operativo que no sale en ninguna demo y que cuesta horas reales.

Cuando varios agentes trabajan sobre el mismo repositorio, la validación se rompe por un sitio inesperado: **no por lo que escriben, sino por lo que se llevan por delante**. Un `git add .` inocente empaqueta el trabajo sin commitear de otro agente sin que nadie lo vea. Un `git switch` arrastra el árbol de trabajo entero, con los cambios ajenos dentro.

Las tres reglas que acabaron por escrito, después de pagarlas:

- **Nunca `git add .`, nunca `git commit -a`.** Siempre rutas explícitas, y `git diff --cached --name-only` antes de confirmar.
- **Un fichero de estado que dice quién tiene tomado qué ahora mismo**, que se lee al empezar y del que se borra la fila al terminar. No es documentación: es un semáforo.
- **Aislarse de verdad es un worktree**, no una rama.

Y el que más veces me ha ahorrado una hora: **una sección de trampas conocidas del entorno**. En mi caso, que el antivirus de Windows bloquea el DLL recién compilado y la suite responde con un error que parece una regresión de código y no lo es. Un humano aprende eso una vez; un agente arranca en frío cinco veces al día y lo vuelve a pagar cada una, salvo que esté escrito donde va a leerlo.

---

La orquestación no está limitada por la capacidad de los modelos. Está limitada por **la velocidad a la que puedes creerte lo que producen**, y esa velocidad la fija tu maquinaria de validación, no ellos.

**Un gate que no puede fallar no es un gate. Es decoración verde.**

---

## Aplícalo

Si trabajas con un agente de código sobre tu propio proyecto, pégale esto:

```text
Con mi permiso, audita mis comprobaciones automáticas (tests, gates,
scripts de validación) buscando los puntos ciegos de este post:
¿hay algún control negativo que demuestre que la medición puede
fallar? ¿los umbrales son cifras medidas y truncadas, o inventadas
a ojo? ¿alguna métrica legítima está gateada aunque deba bajar al
mejorar? ¿hay cifras afirmadas en informes de IA que no se
re-derivan del artefacto real? No inventes resultados ni cifras:
ejecuta tú mismo cada comprobación y repórtame solo lo que
encuentres de verdad, con la salida literal delante.
```

---

*Si esto te ha sonado a lo mismo desde otro ángulo, lo es: [[04 Arquitectura IA/cambiar-el-instrumento-de-medida|cambiar el instrumento]] cuenta las cinco veces que este proyecto me enseñó que el punto ciego nunca se ve desde dentro del propio instrumento.*
