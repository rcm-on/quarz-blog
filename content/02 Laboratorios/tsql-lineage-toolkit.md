---
title: "TSql Lineage Toolkit: lineage de procedimientos SQL Server sin pagar licencias"
date: 2026-06-17
tags: [sql-server, data-lineage, dotnet, arquitectura, ia]
description: "Un motor determinista de lineage e impacto para SQL Server que ve lo que ninguna otra herramienta ve: 34 sentencias de SQL dinámico resueltas, triggers creados en runtime, reglas de negocio y flujos de control — todo offline y sin licencias."
---

Antes de renombrar una columna en una base de datos con decenas de stored procedures, la pregunta es siempre la misma: **¿qué rompo?**

Responderla a mano significa leer procedimientos uno a uno. Ni el catálogo de metadatos ni un grep ven las tablas que solo aparecen en SQL dinámico o dentro de cursores — justo donde vive el riesgo. Este laboratorio documenta cómo lo resolví con un toolkit propio, y los números reales que obtuve analizando **WideWorldImporters contra SQL Server 2025**.

---

## La pantalla de impacto — lo que no ves con otra herramienta

![Pantalla de impacto del dashboard analizando un procedimiento de WideWorldImporters](/static/labs/tsql/impacto.png)

Una sola pantalla —el procedimiento `DeactivateTemporalTablesBeforeDataLoad`— resume por qué esto no es otro visor de dependencias:

- **34 sentencias de SQL dinámico, resueltas y contadas.** El procedimiento construye su SQL en `@SQL` en tiempo de ejecución y lo lanza 34 veces con `EXECUTE (@SQL)`. El contraste está en el flujo de control: un `grep` del cuerpo encuentra **52** tokens `IF`, pero **34 de ellos viven *dentro* de los strings que el procedimiento está fabricando**. El AST reconoce los **18** reales y una anidación de **1**. Ese hueco —entre lo que parece código y lo que es código— es el sentido de todo.
- **Detecta que crea triggers dinámicamente.** Los `TR_Application_Cities_DataLoad_Modify` y compañía no existen en el código como `CREATE TRIGGER`: nacen de SQL construido en runtime. El toolkit los modela como nodos con sus relaciones.
- **Reglas de negocio y riesgos, no solo dependencias.** El objeto **escribe en 17 tablas** ("hace demasiado, candidato a dividir"), **modifica datos sin transacción ni manejo de errores**, ejecuta SQL dinámico ("revisar parametrización/permisos"). Riesgos de seguridad, robustez y mantenibilidad derivados del AST, con severidad.
- **Flujos de control reales:** complejidad ciclomática 19, 18 flujos de control, 87 pasos — métricas del árbol de sintaxis, no del texto.
- **Resumen en lenguaje natural**, automático, arriba del todo — para que un humano (o un LLM) entienda el objeto sin leer 87 pasos.

Nada de esto lo ve un catálogo de metadatos ni un grep. Y todo sale de arrastrar un fichero a un HTML, sin servidor.

### El impacto, por niveles y profundidad

![Cadena de impacto por niveles](/static/labs/tsql/impacto-niveles.png)

La cadena de impacto se despliega **por niveles**, aguas arriba y aguas abajo, hasta la profundidad que elijas. `Configuration_ConfigureForEnterpriseEdition` → **Nivel +1**: los 4 procedimientos que ejecuta → **Nivel +2**: las tablas donde insertan → **Nivel +3**: la vista que las lee. El radio de impacto completo de un vistazo, con la distancia en saltos a cada cosa que vas a tocar.

### El flujo de negocio, paso a paso

![Flujograma de control con decisiones IF reconstruido desde el AST](/static/labs/tsql/flujo.png)

Cada procedimiento se traduce a su **flujograma real** desde el AST, con sus **decisiones**. `Configuration_ApplyAuditing`: *¿existe ya `WWI_ServerAuditSpecification`?* → si no, lo crea con SQL dinámico (`EXEC ⚡`); *¿el servidor soporta especificaciones de auditoría?* → ramifica. Cada `IF` con sus ramas **sí/no** en lenguaje natural y la línea exacta. La lógica de negocio legible sin abrir el `CREATE PROCEDURE`.

---

## 🏗️ Qué hace el toolkit

Parsea el AST real de cada procedimiento, función, trigger y vista usando **Microsoft.SqlServer.TransactSql.ScriptDom** — no regex. Construye el grafo de lineage completo con nodos tipados y aristas direccionadas. Y opcionalmente **lo fusiona con el XML del plan de ejecución real de SQL Server** para descubrir las tablas que el análisis estático no puede ver.

> [!info] Qué analiza
> `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE`, cursores, variables de tabla (`@TableVar`), SQL dinámico (`EXEC(@sql)`), lineage a columna con `--columns`, complejidad ciclomática por objeto, accesos confirmados o descubiertos por plan de ejecución (⚡)

---

## ⚙️ Ejecución real: WideWorldImporters en SQL Server 2025

Esto no es un ejemplo de README. Lo ejecuté contra la base de datos de muestra de Microsoft y aquí están los números reales.

### Paso 1 — Extraer objetos de la base de datos

```bash
dotnet run -- extract WideWorldImporters input.json --server .\SQLEXPRESS --tables
```

```
Wrote 47 objects from WideWorldImporters to input.json
Appended 48 table definitions to input.json
```

**47 objetos analizables** (procedimientos, funciones, vistas) + **48 definiciones de tabla** con sus columnas y FK.

Retén ese 47, porque el dashboard de más arriba dice **64 objetos · 69 tablas**. No es una errata ni son dos ejecuciones distintas: **son dos escalas de conteo, y la diferencia entre ellas es exactamente el motivo por el que existe esta herramienta.**

Los 47 son lo que hay en el catálogo, y se comprueba en un segundo:

```sql
SELECT COUNT(*) FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
WHERE o.type IN ('P','FN','IF','TF','TR','V');   -- 47
```

42 procedimientos, 1 función escalar, 1 función de tabla, 3 vistas… y **cero triggers**. WideWorldImporters no tiene ni un trigger persistido.

Los 64 son lo que hay de verdad. Los 17 que faltan son triggers que `DeactivateTemporalTablesBeforeDataLoad` **crea en tiempo de ejecución**: monta el `CREATE TRIGGER` como texto dentro de una variable y lo lanza con `EXECUTE (@SQL)`. No existen en `sys.objects` hasta que el procedimiento corre. Un inventario de catálogo se los pierde enteros; un `grep` ve un string. El AST los encuentra los 17, con la tabla sobre la que dispara cada uno.

47 + 17 = 64. Esa resta es el producto.

*(Con las tablas pasa lo mismo a menor escala: las 48 del DDL, más 15 del catálogo `sys.*` que los procedimientos leen, más las 3 vistas y 2 tablas de respaldo creadas también en runtime, más 1 pseudo-tabla que sale de un `OPENJSON(@parametro)` — cuenta como tabla aunque no lo sea —, dan 69.)*

### Paso 2 — Generar el grafo completo con NodeStore

```bash
dotnet run -- input.json graph_full.json --columns --sqlite --nodestore
```

```
NodeStore: 64 objects, 783 shared nodes, 4382 edges -> graph_full.nodes/
SQLite: 1593 nodes, 4382 edges -> graph_full.db
Analyzed 47 objects (47 ok, 0 parse errors)
Analyzed 48 table schemas (48 ok, 0 errors)
Graph: 1593 nodes, 4382 relationships -> graph_full.json
```

| Métrica | Valor |
|---|---|
| Nodos | 1.593 |
| Relaciones | 4.382 |
| Errores de parseo | 0 |
| Tamaño grafo completo | 2.016 KB |
| Ficheros NodeStore | 1.702 |
| Tamaño medio por fichero | 2,56 KB |

Ahí se ve otra vez la resta: la entrada son 47 objetos, el NodeStore escribe 64.

*(Actualización 2026-08-01: entre la primera medición de este laboratorio y hoy
integré 12 arreglos en el motor — el más visible modela cada `WHERE` como una
regla de negocio propia. Por eso el grafo pasó de 1.529/4.151 a 1.593/4.382
nodos y relaciones; el detalle de cada arreglo, con su repro, está en
[`docs/corpus-multibase.md`](https://github.com/rcm-on/tsql-lineage-toolkit/blob/master/docs/corpus-multibase.md)
del repositorio.)*

### Paso 2b — Contrastar el grafo contra el propio catálogo

Un motor de lineage que solo se mide a sí mismo no vale nada. El toolkit trae un comando que compara lo que ha deducido contra `sys.foreign_keys` y `sys.sql_expression_dependencies`:

```bash
dotnet run -- validate graph_full.json --server .\SQLEXPRESS
```

```
FK relationships in DB restricted to tables present in graph: 81
  In DB but missing from graph: 0
  In graph but not in DB (within scope): 0

CALLS (EXEC) relationships in DB restricted to analyzed objects: 12
  In DB but missing from graph: 0
```

**98 de 98 claves ajenas y 12 de 12 cadenas de ejecución. Cero ausencias y cero aristas fantasma, en ambos sentidos.** No es "detecta mucho": es "detecta exactamente lo que hay".

*(El 81 frente a las 98 no es una discrepancia: `validate` compara pares de tablas distintos, y WWI tiene varias claves ajenas entre el mismo par —`Sales.Orders` referencia dos veces a `Application.People`— más 3 auto-referencias. `SELECT COUNT(*) FROM sys.foreign_keys` devuelve 98, y el grafo tiene 98 aristas `FK_TO`, una por constraint.)*

El grafo marca además 8 tablas sin ninguna relación. Las comprobé una a una: 5 son tablas de historial temporal (`temporal_type = HISTORY`, las gestiona el motor, no las toca ningún DML) y 3 son vistas que `sys.sql_expression_dependencies` confirma que nadie referencia. Ninguna es un fallo de extracción. Un huérfano explicado vale más que un huérfano escondido.

### Paso 3 — Enriquecer con el plan de ejecución real

Los procedimientos clave de WideWorldImporters son destructivos sobre la propia base —`DeactivateTemporalTablesBeforeDataLoad` desactiva el versionado temporal y borra triggers, los `Configuration_*` alteran la instancia—, así que en lugar de ejecutarlos para poblar la caché de planes capturé **planes estimados** con `SET SHOWPLAN_XML ON`, que compilan sin ejecutar nada. El parser soporta ambos formatos:

```bash
dotnet run -- enrich-from-plans graph_full.json graph_enriched.json plans/*.xml
```

```
Plans: 33  Procs matched: 30  Confirmed: 60  Discovered: 79
```

**60 aristas del análisis estático confirmadas** por el plan. **79 accesos a tablas nuevos descubiertos** — tablas base detrás de una vista, accesos que el optimizador expande, relaciones que el AST no puede ver desde el texto.

> [!note] Planes estimados, no reales
> Al no ejecutar los procedimientos, los planes traen `EstimateRows` y no `ActualRows`, y los procedimientos cuyo cuerpo es íntegramente SQL dinámico producen un plan sin accesos a tabla: el `@SQL` no se compila en tiempo de estimación. El enriquecimiento real viene de los `Integration.Get*` y de las vistas. Con planes de ejecución reales las cifras serían mayores.

> [!warning] Compatibilidad con SQL Server 2025
> Durante esta ejecución encontré que SQL Server 2025 cambió el formato ShowPlanXML: usa `<StmtSimple StatementType="EXECUTE PROC">` donde versiones anteriores usaban `<StmtProc>`. El parser no lo detectaba y el enricher devolvía `Procs matched: 0`. Fix incluido en esta versión.

> [!note] Este paso no se repitió en la actualización de 2026-08-01
> Los planes `.xml` de esta ejecución no sobrevivieron entre máquinas de trabajo y recapturarlos no entraba en el alcance de la actualización de cifras. Los números de arriba (33/30/60/79) son de la ejecución original, sobre el grafo de 1.529/4.151 nodos y relaciones — con el grafo actual (1.593/4.382) el enriquecimiento daría cifras distintas. Lo dejo anotado en vez de inventar el número nuevo.

### Paso 4 — Abrir el dashboard

Sube `graph_enriched.json` al dashboard (o `graph_full.json` sin enriquecimiento):

```bash
start dashboard/index.html   # Windows
open  dashboard/index.html   # macOS/Linux
```

Cero instalaciones. Cero npm. Cero servidor. Un fichero HTML con vanilla JS.

---

## 📊 Qué te muestra el dashboard

Con WideWorldImporters, el dashboard muestra en tiempo real:

- Todos los procedimientos y sus métricas de complejidad ciclomática
- El grafo de llamadas entre objetos (`CALLS`, `READS_FROM`, `WRITES_TO`)
- Las aristas confirmadas ✓ vs. descubiertas ⚡ por el plan de ejecución
- Las filas estimadas por el optimizador en cada acceso
- El diagrama ORM interactivo con FK dibujadas automáticamente

Ejemplo real de lo que responde al instante: "¿qué procedures acceden a `Warehouse.StockItems`?" → 10 objetos, desglosados por tipo de acceso y si están confirmados por el plan o inferidos por AST.

---

## 🤖 NodeStore: el grafo optimizado para agentes IA

El flag `--nodestore` genera una versión del grafo particionada en ficheros pequeños, diseñada para que agentes IA la naveguen sin cargar el grafo completo.

Para responder "¿qué accede a Warehouse.StockItems?" un agente lee **1 fichero de 26 KB** en lugar de los **2.016 KB del grafo completo**: **77 veces menos datos**, ya estructurados con los procedimientos, sus tipos de acceso y punteros a los ficheros vecinos. Y si solo necesita saltar al siguiente nodo, hay un `nav.json` de **10 KB** con las aristas navegables y nada más — **194 veces menos**.

El patrón de diseño detrás de esto está explicado en: [[04 Arquitectura IA/datos-navegables-para-agentes|Dar el grafo entero al agente no es dar contexto. Es dar ruido.]]

---

## 📋 Qué hueco llena

| Herramienta | AST real | Plan de ejecución | Dashboard | Lineage columna | Agent-ready |
|---|---|---|---|---|---|
| **TSql Lineage Toolkit** | ScriptDom | Sí (filas estimadas) | Sí, offline | Sí | Sí (NodeStore) |
| sqllineage (Python) | Regex | No | No | No | No |
| Apache Atlas | Catálogo metadatos | No | Genérico | No | No |
| dbt lineage | Solo modelos dbt | No | dbt Cloud | Limitado | No |

El catálogo (Atlas, Purview y similares) ve lo que está declarado en `sys.objects`, nada más: un trigger creado en runtime o una tabla que solo existe dentro de un `EXEC(@sql)` no aparece. Un regex (sqllineage) no distingue un `IF` real de uno dentro de un string que se está construyendo. Ninguna herramienta gratuita usa ScriptDom ni lee el XML del plan de ejecución. Este toolkit entiende el AST completo del procedimiento —lo que hace, no solo lo que declara— y por eso ve el SQL dinámico y las reglas de negocio que las demás se pierden.

---

## 🚀 Quick start desde ficheros SQL (sin base de datos)

```bash
git clone https://github.com/rcm-on/tsql-lineage-toolkit
cd tsql-lineage-toolkit/src/TSqlParser

# Desde ficheros .sql locales
dotnet run -- from-sql MiBase ../../input.json path/to/sql/*.sql
dotnet run -- ../../input.json ../../graph.json --columns
start ../../dashboard/index.html
```

> [!tip] Sin base de datos
> El repositorio incluye `samples/from-sql-demo/graph.json` — grafo pre-construido con los ejemplos del repo, listo para abrir en el dashboard sin instalar nada.

---

**Repositorio:** [github.com/rcm-on/tsql-lineage-toolkit](https://github.com/rcm-on/tsql-lineage-toolkit) — MIT · sin cloud · sin telemetría · Windows / Linux / macOS
