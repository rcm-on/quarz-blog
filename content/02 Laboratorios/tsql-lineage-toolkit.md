---
title: "TSql Lineage Toolkit: lineage de procedimientos SQL Server sin pagar licencias"
date: 2026-06-17
draft: true
tags: [sql-server, data-lineage, dotnet, arquitectura, ia]
---

Antes de renombrar una columna en una base de datos con decenas de stored procedures, la pregunta es siempre la misma: **¿qué rompo?**

Responderla a mano significa leer procedimientos uno a uno. Las herramientas comerciales —Purview, Octopai, Informatica— cuestan una fortuna y aun así no ven las tablas que solo aparecen en SQL dinámico o dentro de cursores. Este laboratorio documenta cómo lo resolví con un toolkit propio, y los números reales que obtuve analizando **WideWorldImporters contra SQL Server 2025**.

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

### Paso 2 — Generar el grafo completo con NodeStore

```bash
dotnet run -- input.json graph_full.json --columns --nodestore
```

```
NodeStore: 47 objects, 756 shared nodes, 3476 edges -> graph_full.nodes/
Analyzed 47 objects (47 ok, 0 parse errors)
Analyzed 48 table schemas (48 ok, 0 errors)
Graph: 1398 nodes, 3476 relationships -> graph_full.json
Tiempo total: 3,8 segundos
```

| Métrica | Valor |
|---|---|
| Nodos | 1.398 |
| Relaciones | 3.476 |
| Tamaño grafo completo | 1.604 KB |
| Ficheros NodeStore | 806 |
| Tamaño medio por fichero | 3,15 KB |

### Paso 3 — Enriquecer con el plan de ejecución real

Ejecuté los procedimientos clave en SQL Server para generar los planes en caché, los capturé como ShowPlanXML y los pasé al enricher:

```bash
dotnet run -- enrich-from-plans graph_full.json graph_enriched.json plans.xml
```

```
Plans: 1  Procs matched: 4  Confirmed: 36  Discovered: 23
```

**36 aristas del análisis estático confirmadas** por el plan real. **23 accesos a tablas nuevos descubiertos** — accesos dentro de cursores, tablas temporales construidas por el optimizador, relaciones que solo existen en runtime y que el AST no puede ver.

> [!warning] Compatibilidad con SQL Server 2025
> Durante esta ejecución encontré que SQL Server 2025 cambió el formato ShowPlanXML: usa `<StmtSimple StatementType="EXECUTE PROC">` donde versiones anteriores usaban `<StmtProc>`. El parser no lo detectaba y el enricher devolvía `Procs matched: 0`. Fix incluido en esta versión.

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

Para responder "¿qué accede a Warehouse.StockItems?" un agente lee **1 fichero de 21 KB** en lugar de los **1.604 KB del grafo completo**. **76 veces menos datos. Respuesta ya estructurada con los procedimientos, tipos de acceso y punteros a los ficheros vecinos.**

El patrón de diseño detrás de esto está explicado en: [[04 Arquitectura IA/datos-navegables-para-agentes|Dar el grafo entero al agente no es dar contexto. Es dar ruido.]]

---

## 📋 Comparativa

### vs. herramientas gratuitas

| Herramienta | AST real | Plan de ejecución | Dashboard | Lineage columna | Agent-ready |
|---|---|---|---|---|---|
| **TSql Lineage Toolkit** | ScriptDom | Sí (filas estimadas) | Sí, offline | Sí | Sí (NodeStore) |
| sqllineage (Python) | Regex | No | No | No | No |
| Apache Atlas | Catálogo metadatos | No | Genérico | No | No |
| dbt lineage | Solo modelos dbt | No | dbt Cloud | Limitado | No |

### vs. herramientas comerciales

| Herramienta | Precio | AST real | Plan de ejecución | Offline | Código abierto |
|---|---|---|---|---|---|
| **TSql Lineage Toolkit** | Gratis | Sí | Sí | Sí | Sí |
| Microsoft Purview | €€€€ / Azure-only | No (catálogo) | No | No | No |
| Octopai | €€€€ enterprise | No | No | No | No |
| Informatica IDMC | €€€€€ enterprise | No | No | No | No |

Ninguna herramienta gratuita usa ScriptDom ni lee el XML del plan de ejecución. Ninguna de pago fusiona análisis estático con accesos descubiertos en runtime.

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
