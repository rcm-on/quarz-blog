---
title: "El auditor encontró dos defectos en sí mismo"
date: 2026-08-22
draft: true
status: "borrador"
tags: [lab, ia, agentes, sql-server, data-lineage, testing, calidad, metodo]
description: "374 pruebas en verde; la auditoría sobre 739 objetos reales encontró dos defectos que la suite no veía. Con los números y el código."
---

En [[tsql-lineage-toolkit|el lab del toolkit]] conté qué hace el motor de lineage. Este cuenta algo menos cómodo: **el día que lo usé en serio contra una base de producción y me devolvió dos defectos propios**.

La suite estaba en verde. 374 pruebas, gates de recall, comparación contra el catálogo real de SQL Server. Y aun así, la primera auditoría end-to-end sobre [DNN Platform](https://github.com/dnnsoftware/Dnn.Platform) —739 objetos, 34.278 aristas— destapó dos fallos que ninguna prueba veía.

No es mala suerte. Es estructural, y esa es la parte que se puede trasladar a cualquier proyecto:

> **Las pruebas comprueban lo que ya sabías.** Un proyecto real comprueba lo que no se te ocurrió.

## Defecto 1: la regla medía una cosa y afirmaba otra

El motor tiene una regla de auditoría: *"UPDATE/DELETE sin WHERE"*, severidad alta. Sobre DNN disparó cuatro veces. Fui a comprobar una:

```sql
DELETE FROM dbo.[ScheduleHistory]
WHERE ScheduleHistoryID IN (SELECT TOP (1000) ScheduleHistoryID FROM #ScheduleHistoryIDsToDelete);
```

Ahí hay un `WHERE`. La regla decía que no.

Miré cómo estaba implementada:

```csharp
return (action == "UPDATE" || action == "DELETE") && !OutOf(s.Id, "FILTERS_ON").Any();
```

Usaba **"no tiene aristas de filtro"** como sustituto de **"no tiene WHERE"**. Y no son lo mismo: el predicado de arriba solo referencia una **tabla temporal**, y el grafo no modela tablas temporales a propósito. El `WHERE` existe; la arista no.

Lo que hace bueno el diagnóstico no es haberlo visto, es que el propio código traía el **control interno** que lo demuestra. `dbo.DeleteEventLog` tiene los dos casos, en el mismo procedimiento y sobre la misma tabla:

| Paso | Línea | Sentencia | `FILTERS_ON` |
|---|---|---|---|
| `step0` | 7 | `DELETE FROM dbo.EventLog` | 0 |
| `step1` | 9 | `DELETE FROM dbo.EventLog WHERE LogGUID = @LogGUID` | 1 |

El mecanismo funciona perfectamente cuando el predicado toca una columna modelada. El defecto era específicamente el de las entidades que el grafo ignora por diseño.

### Y fallaba en la dirección contraria, que no había visto

Al arreglarlo, el total de hallazgos `high` **subió** de 11 a 12. Eso me escamó: quitar falsos positivos debería bajar el contador.

Desapareció el falso positivo, sí. Pero aparecieron **dos objetos que el defecto ocultaba**:

```sql
DELETE m FROM dbo.aspnet_Membership m
INNER JOIN orphaned_aspnet_memberships o ON m.UserId = o.UserId;   -- sin WHERE
```

El `ON` de un `JOIN` **sí** emite aristas `FILTERS_ON`. Así que la regla vieja daba por filtrado un `DELETE` que no lo estaba. El mismo error, con el signo cambiado.

Balance: **−1 falso positivo, +2 verdaderos que llevaban ahí desde siempre.**

### La lección: la señal correcta ya existía

Aquí viene la parte que más me sirvió, y que no esperaba.

Antes de ponerme a modelar un `has_where` nuevo, fui a mirar qué había. Y `FlowLinkInfo.FilterText` llevaba escrito en su propio comentario, desde hacía meses:

> *Empty when the statement has no WhereClause (…) — GraphExporter uses emptiness **here**, not FilterColumns emptiness, to decide whether a WHERE-derived rule is warranted.*

El dato correcto estaba, documentado y en uso en otra parte del sistema. **El error no era de modelo: era de quién lo consultaba.** El arreglo fue exponer esa propiedad en el nodo y cambiar la condición de la regla. Cero cirugía.

> Antes de modelar algo nuevo, comprueba si el dato ya está y lo que falla es quién pregunta. Me ahorró un día.

## Defecto 2: un cero que era un instrumento roto

El motor tiene una regla `crit` para inyección SQL. Sobre DNN devolvió **0 hallazgos**.

Tengo una norma escrita para esto, y existe justamente porque un cero es cómodo de creer:

> **Un resultado vacío es un instrumento roto hasta demostrar lo contrario.** Cero hallazgos se investiga; no se celebra.

Fui a mirar. En `dbo.GetAvailableUsersForIndex` la ruta real del dato es:

```
ProfilePropertyDefinition.PropertyName   (una columna, dato de tabla)
    ↓  SELECT @PivotSql = … + '[' + PropertyName + ']' …
@PivotSql
    ↓  concatenado dentro del texto de @Sql
@Sql
    ↓  EXECUTE sp_executesql @Sql
```

Que es exactamente el patrón que la regla busca: SQL dinámico construido desde datos de tabla. Pero la regla exige que **una misma variable** cumpla las dos condiciones:

```csharp
var tainted = vars.Where(v => v.BuildsSql > 0 && v.AssignedFrom.Count > 0);
```

Y aquí están repartidas entre dos:

| Variable | Recibe dato de columna | Construye el SQL |
|---|---|---|
| `@PivotSql` | ✔ | — |
| `@Sql` | — | ✔ |

Ninguna cumple ambas. De ahí el cero.

Lo comprobé a fondo antes de llamarlo defecto, y el resultado fue tajante: **en las 34.278 aristas del grafo no hay ni una sola `Variable → Variable`**. El flujo de datos entre variables no está modelado, así que el *taint* no puede propagarse **por construcción**, no por un descuido de la regla.

**Este no lo arreglé.** Necesita emitir una arista que hoy no existe, y no tenía margen para hacerlo con red. Había un atajo tentador —una regla por co-locación: "el objeto tiene *alguna* variable contaminada y *alguna* que arma SQL"— que acierta en DNN por casualidad. Lo descarté: eso no es trazabilidad, es adivinar con suerte. Queda diagnosticado, con su causa y su alcance medido (**1 objeto**, no una epidemia), y dicho como pendiente.

## El truco de proceso: usar el gate como instrumento de medida

Este me parece el más exportable de todo el lab.

Tenía que clasificar 22 referencias de columna que el motor no ve, y escribir un *ground truth* declarando cuáles quedan ciegas. La forma obvia es leer el SQL y decidir. Ya lo hice una vez y **fallé dos veces**.

Así que le di la vuelta. El gate del repo compara el estado real contra un estado declarado y **canta la diferencia en los dos sentidos**. Entonces declaré **todas** las filas como "ciegas" —a sabiendas de que era falso— y ejecuté.

El gate me devolvió la verdad:

```
dbo.unionselectlist: dbo.madre.id ya no es ciega: actualiza expected-columns.json a cubierto
dbo.tvfenjoinllano: dbo.permisos.clave ya no es ciega: actualiza expected-columns.json a cubierto
… (14 de 22 filas)
```

De 22 filas sondeadas, **14 salieron cubiertas**. No las adiviné: me las dijo el instrumento.

Y ahí apareció algo que leyendo el T-SQL no vi. En un `JOIN` anidado entre paréntesis no solo se pierde el `ON` interior — **también se pierde la referencia del `ON` exterior a una tabla de dentro**. Yo había escrito la causa mal en mi propia clasificación.

> Un gate no sirve solo para impedir regresiones. Sirve para **preguntarle qué es verdad** cuando tu lectura del código es una hipótesis. Es más barato y más fiable que razonar.

## El hallazgo contraintuitivo del informe

Y una última cosa que salió de la auditoría y no del código.

Este es `dbo.GetUsersBasicSearch` visto por el grafo:

| | |
|---|---|
| `total_steps` | **1** |
| Complejidad ciclomática | **1** |
| Aristas de lectura / escritura | **0 / 0** |

Por toda métrica de calidad del informe, **es el objeto más simple de los 739**. En realidad son ~100 líneas de T-SQL que construyen una consulta entera por concatenación y la ejecutan. El grafo la reduce a un paso: `EXEC → (dynamic SQL)`.

Es el objeto que **más superficie oculta de todo el código auditado**, y aparece como el más inocente.

Peor: eso contamina otras secciones del mismo informe. La vista `dbo.vw_Profile` figura en la lista de "tablas huérfanas" —cero lecturas, cero escrituras— y sin embargo **la leen tres procedimientos**, dentro de su SQL dinámico. Quien use esa lista para decidir qué retirar, borra una vista en producción.

Por eso el informe ordena el plan de tareas **por dependencia y no por severidad**, y este caso lo justifica solo: por severidad, "revisar tablas sin uso" (`low`) iría antes que "parametrizar el SQL dinámico" (`high`). En ese orden, borras la vista.

## Lo que me llevo

Un proyecto real no es una prueba más grande: es otra clase de prueba, la que encuentra lo que no sabías que había que buscar. Por eso esta auditoría se publica con sus dos defectos dentro —uno arreglado, otro no— en vez de solo con el resultado final: un informe que no declara los límites de su instrumento vale menos, no más.

## Aplícalo

¿Tienes tu propio motor de reglas corriendo en verde sobre tus propios tests? Pégale esto a tu agente de código antes de confiar en el semáforo verde.

```text
Con mi consentimiento, aplica a mi propio proyecto el método de esta
auditoría, sin inventar claves ni cadenas de conexión — pídemelas o usa
las que ya tenga configuradas. Para cada regla `crit` o `high` de mi
motor que dé 0 hallazgos sobre mi código real, investígala como aquí:
comprueba si su condición mide de verdad lo que dice medir, no la des
por buena solo porque dio cero. Si tengo que clasificar algo a mano, declara
primero un estado base a sabiendas de que es falso y deja que el gate
del repo te corrija la diferencia, en vez de deducirlo leyendo el código.
Ordena cualquier lista de arreglos por dependencia, no solo por severidad.
```

El informe completo, con la procedencia marcada dato a dato —`[motor]` si sale del grafo y es reproducible, `[lectura]` si lo saqué yo leyendo T-SQL porque el motor no llega—, está en el repositorio: [`docs/auditoria-dnn.md`](https://github.com/rcm-on/tsql-lineage-toolkit/blob/main/docs/auditoria-dnn.md).
