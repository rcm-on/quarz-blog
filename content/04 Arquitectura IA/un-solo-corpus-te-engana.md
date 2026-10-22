---
title: "Una sola base de prueba te engaña"
date: 2026-08-01
draft: true
tags:
  - ia
  - arquitectura
  - evaluación
  - calidad
  - data-lineage
description: "Un trigger invisible en WideWorldImporters, por lo que una sola base de prueba no basta: lo que sí prueban, y no prueban, los scripts de estrés."
---

*Tercera parte de una serie de cuatro: [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|doce fallos en mi propia herramienta]] · [[04 Arquitectura IA/como-se-encarga-trabajo-a-un-agente|cómo se le encarga trabajo a un agente]] · **la base de prueba** · [[04 Arquitectura IA/cambiar-el-instrumento-de-medida|cambiar el instrumento]].*

Durante meses validé mi motor de análisis de T-SQL contra **WideWorldImporters**, la base de muestra de Microsoft. Es la elección natural: está en todas partes, se instala en un minuto, y tiene esquema real con claves ajenas de verdad.

También es una trampa. Está limpia, bien formada y **diseñada para lucir**. El procedimiento más largo tiene 706 líneas y una complejidad ciclomática de 19.

Cuando añadimos los otros tres al banco de pruebas, dos de los doce defectos que conté en el [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|primer post de la serie]] aparecieron en la primera ejecución. No porque miráramos con más atención. Porque **había con qué tropezar**.

---

## Los cuatro, y qué demuestra cada uno

| Elemento | Qué es | Qué demuestra |
|---|---|---|
| **WideWorldImporters** | muestra OLTP de Microsoft, base viva | lineage sobre esquema real, con **el catálogo como fuente de verdad** |
| **AdventureWorks2019** | muestra clásica, base viva | **segunda** fuente de verdad independiente |
| **Ola Hallengren** | mantenimiento SQL de producción, 0,52 MB | SQL dinámico denso, variables tabla, cursores |
| **First Responder Kit** | diagnóstico de Brent Ozar, 2,29 MB | **escala**: `sp_Blitz` son 10.659 líneas en un procedimiento |

Los cuatro pasan con **cero errores de parseo**. Ese es el dato que apetece publicar, y es el que menos dice. Vamos a los dos que sí dicen algo.

---

## Un fallo puede ser estructuralmente indetectable

WideWorldImporters no tiene **ningún trigger** persistido en su catálogo. Cero.

Mi extractor de objetos consultaba `sys.sql_modules` con un `JOIN` a `sys.objects`. Un trigger DDL a nivel de base de datos **no está en `sys.objects`** — vive solo en `sys.triggers`, con `parent_class = 0`. El `JOIN` lo descartaba en silencio, y ningún flag lo recuperaba: hacía falta una consulta aparte.

En AdventureWorks2019 el desglose es este:

```
sys.triggers total ............ 11
  parent_class = 0 (DDL de BD) .. 1   ← ddlDatabaseTriggerLog
  parent_class = 1 (de tabla) .. 10
en sys.objects con type='TR' .. 10
```

El síntoma visible era `dbo.DatabaseLog` reportada como **tabla huérfana** teniendo quien le escribiera: ese trigger. Un falso huérfano — la herramienta diciendo "nadie toca esto" sobre algo que sí se toca.

Con WideWorldImporters ese defecto era **invisible por construcción**. No es que se nos pasara: es que no había ni un solo caso que pudiera manifestarlo. Ninguna cantidad de atención sobre esa base de prueba lo habría encontrado, y ninguna prueba unitaria escrita mirando esa base de prueba se le habría ocurrido a nadie.

> [!important] Una base de prueba no solo cubre casos: también define qué fallos son posibles de ver
> La pregunta que hay que hacerle a una base de prueba no es "¿cuánto cubre?", sino "**¿qué clase de defecto no podría manifestarse nunca aquí?**". Esa lista es tu punto ciego, y no se ve desde dentro de la base de prueba.

---

## Estresar el parser no valida el lineage

Este es el hallazgo que más me cambió la forma de leer mis propias métricas.

Ola Hallengren y el First Responder Kit son brutales para la gramática. `sp_Blitz` es un **único procedimiento de 480 KB**:

| | Máximo en WWI | Ola Hallengren | First Responder Kit |
|---|---|---|---|
| Objeto más complejo | `DeactivateTemporalTables…` | `dbo.DatabaseBackup` | `dbo.sp_Blitz` |
| Líneas | 706 | ~5.000 | **10.659** |
| Complejidad ciclomática | 19 | 542 | **706** (37×) |
| Pasos | 87 | 541 | **1.229** |
| Anidación máxima | 1 | 7 | 9 |

Se procesan sin fallo, sin excepción y sin artefacto truncado. Escalado sub-lineal, además: de 0,35 MB a 2,29 MB (6,5×) el tiempo solo se duplica, con un coste marginal de **~1,2 s por MB** de T-SQL.

Todo eso es cierto y todo eso es irrelevante para la pregunta que importa.

Porque estos dos scripts de estrés **leen vistas del sistema y escriben en tablas temporales**. En los doce procedimientos del First Responder Kit hay exactamente **2 aristas `WRITES_TO`** a tablas de usuario. Casi no tocan esquema propio, no tienen columnas de salida catalogadas y, sobre todo, **no hay catálogo contra el que contrastar**: no existe un `sys.foreign_keys` de un script suelto.

Prueban que el motor no se rompe. **No prueban que acierte.**

Esa distinción es la que evita el autoengaño. *"Cero errores de parseo sobre 2,3 MB de T-SQL de producción"* es un titular honesto, y no dice absolutamente nada sobre si el lineage es correcto. Cero errores de parseo es compatible con emitir un grafo entero equivocado — de hecho, los doce defectos convivían con cero errores de parseo.

---

## Para eso hacen falta las bases vivas, y solo ellas

Lo que responde a *"¿acierta?"* es el contraste contra el catálogo del propio SQL Server, y eso solo lo permiten las bases de prueba:

| | WideWorldImporters | AdventureWorks2019 |
|---|---|---|
| Claves ajenas vs `sys.foreign_keys` | **98 / 98** | **90 / 90** |
| Cadenas `EXEC` vs catálogo | **12 / 12** | **22 / 22** |
| Ausencias / aristas fantasma | 0 / 0 | 0 / 0 |
| Cobertura de lineage de columna | 32 / 32 (100%) | **251 / 251 (100%)** |

Dos bases independientes, cero ausencias y cero relaciones inventadas. Y el 251/251 de AdventureWorks pesa mucho más que el 32/32 de WideWorldImporters: son 20 vistas frente a 3, **ocho veces más superficie de resolución de columnas**, sin perder una.

Esa es la diferencia entre una segunda base y un segundo elemento cualquiera del banco de pruebas. Una segunda base no añade volumen: añade **una segunda fuente de verdad independiente**. Es la única forma de saber que el 98/98 de la primera no era una casualidad de esa base concreta.

---

## Lo que el banco de pruebas no me va a decir

Y para cerrar con el límite, porque publicar los límites es lo que hace creíble el resto.

En el First Responder Kit, de **241 pasos de SQL dinámico detectados, 164 (el 68%) no se resuelven** a un destino literal. La causa está verificada en el fuente:

```sql
SET @dsql = N'SELECT @RowcountOUT = COUNT(1) FROM ' + QUOTENAME(@DatabaseName) + N'.[sys].[objects] …';
EXEC sp_executesql @dsql, @params, …;
```

El nombre de la base de datos es un **parámetro de entrada**. En análisis estático no hay forma de saber a qué base apunta: depende de con qué lo llames. El motor lo marca como no resuelto y lo cuenta, en vez de adivinar un destino falso.

Eso es lo correcto y es lo que hay que decir en la documentación pública. La versión honesta no es *"resuelve el SQL dinámico"*: es **"lo resuelve cuando el destino es reconstruible estáticamente; cuando depende de un parámetro, lo marca y lo cuenta — en un script de estrés real ese caso fue el 68%"**.

Decirlo sube la credibilidad, no la baja. Un 68% declarado es una limitación. Un 68% escondido es un falso negativo esperando a que alguien tome una decisión con él.

---

## Aplícalo

Si quieres auditar el banco de pruebas de tu propio proyecto, pégale esto a tu agente de código:

```text
Con mi permiso, revisa los datos de prueba de este proyecto y
dime: ¿hay una sola base o fuente de verdad detrás de todos los
tests, o varias independientes? Clasifica cada fixture que
encuentres como base de prueba (tiene su propio catálogo o fuente
de verdad contra la que contrastar) o script de estrés (solo
prueba que no se rompe, no que acierte). Si todo depende de una
sola fuente, dímelo como riesgo, con el fichero exacto, y no
inventes una segunda fuente si no existe en el repo.
```

---

**Cierra la serie:** [[04 Arquitectura IA/cambiar-el-instrumento-de-medida|cambiar el instrumento]] — las cinco veces que este proyecto me enseñó lo mismo.
