---
title: "Lab: Graphify, dar al agente un grafo que recorrer en vez de un repo que grepear"
date: 2026-07-18
draft: false
status: "aceptada"
tags: [lab, ia, agentes, context-engineering, grafos, tokens]
description: "Instalar Graphify, convertir un repo en grafo consultable y medir con tus propios tokens si de verdad se grepea menos cuando el agente tiene un grafo que recorrer."
---

## El problema

Pídele a un agente de código "¿dónde se descuentan los créditos del usuario?" sobre un repo que no conoce y lo verás hacer lo único que sabe hacer: `grep` de un término, abrir los ficheros que salen, `grep` de otro término relacionado, abrir más ficheros, repetir. Cada vuelta cuesta tokens — no porque el modelo razone mal, sino porque **la búsqueda no tiene estructura**. El agente no sabe qué fichero es relevante hasta que lo ha leído entero.

El coste no está en el modelo. Está en cómo busca.

Grepear un repo mediano para una pregunta de una frase puede quemar del orden de 100k+ tokens en lecturas exploratorias antes de llegar a los tres ficheros que de verdad importaban. Ese gasto no aparece en ningún benchmark de "calidad del modelo": aparece en la factura y en la ventana de contexto que ya no tienes disponible para el resto de la tarea.

## Qué vas a aprender

- Por qué un **grafo navegable** (nodos + aristas que el agente recorre paso a paso) sustituye al grep-and-read con menos tokens y más precisión.
- La diferencia entre una arista **EXTRACTED** (está en el código, es un hecho) y una **INFERRED** (la dedujo la herramienta) — y por qué esa distinción es lo que hace el grafo auditable en vez de una caja negra.
- A medir tú mismo el ahorro real de tokens en tu propio repo, en vez de fiarte de la cifra de marketing de nadie.

## Modelo mental

```mermaid
graph LR
    subgraph "Grep-and-read"
        Q1["¿Dónde se\ndescuentan créditos?"] --> S1[grep término 1]
        S1 --> R1[Leer N ficheros]
        R1 --> S2[grep término 2]
        S2 --> R2[Leer más ficheros]
        R2 --> A1["~123k tokens"]
    end
    subgraph "Grafo navegable"
        Q2["¿Dónde se\ndescuentan créditos?"] --> G[Consulta al grafo]
        G --> N[2-3 nodos relevantes\ncon sus aristas]
        N --> A2["~1,7k tokens"]
    end
```

El grafo no reemplaza al modelo leyendo código. Reemplaza la **fase de localizar** qué código leer. Tree-sitter ya hizo el trabajo de parsear el AST una vez, por adelantado, sin gastar ni un token de LLM; el agente solo recorre el resultado.

## Manos a la obra

### 1. Instalar Graphify

Necesitas Python 3.10+ y un gestor de paquetes. En Windows, `uv` se instala con winget:

```bash
winget install astral-sh.uv
```

Con `uv` (o `pipx`) instalado, el paquete de PyPI es `graphifyy` — con doble "y", ojo al escribirlo — pero el comando que queda en el PATH es `graphify`, sin doble y:

```bash
uv tool install graphifyy      # alternativa: pipx install graphifyy
```

> [!warning] El nombre del paquete no es el nombre del comando
> Es fácil equivocarse aquí porque son casi iguales. Instalas `graphifyy` (PyPI), ejecutas `graphify` (CLI). Si el comando no se encuentra tras instalar, es casi seguro que tecleaste `graphifyy` al invocarlo en vez de al instalarlo.

### 2. Registrar el skill con tu asistente

Graphify se expone como un *skill* dentro de tu asistente de código, no como un programa aparte que ejecutas y ya. Primero el registro genérico:

```bash
graphify install
```

Y luego el registro específico del asistente que uses (elige el tuyo):

```bash
graphify claude install
graphify cursor install
graphify codex install
graphify gemini install
graphify copilot install
```

> [!check] Checkpoint
> `graphify install` debería terminar sin error y el comando `/graphify` (con barra) debería aparecer disponible dentro de tu asistente — ese es el skill ya registrado, no un comando de shell.

### 3. Generar el grafo de un repo real

Dentro de tu asistente de código, apúntalo a un repo que conozcas bien (para poder juzgar si el resultado tiene sentido) e invoca el skill:

```bash
/graphify .
```

Por debajo pasan dos fases distintas: tree-sitter extrae el AST de todo el código soportado (36 lenguajes: Python, TS, Go, Rust, Java, C/C++, SQL, Terraform...) **sin llamar a ningún LLM** — es análisis determinista. Después, un pase semántico usa el LLM que tengas configurado para lo que tree-sitter no puede parsear como código: documentación, PDFs, imágenes. Por último, un clustering Leiden agrupa el grafo en comunidades y les pone etiqueta semántica.

> [!check] Checkpoint
> Debería aparecer una carpeta `graphify-out/` con tres ficheros: `graph.html` (el grafo interactivo, ábrelo en el navegador y verás que es clicable y filtrable), `GRAPH_REPORT.md` (conceptos clave y conexiones inesperadas que encontró) y `graph.json` (el grafo completo, reutilizable sin volver a leer el repo).

> [!tip] Ábrelo
> Abre el `graph.html` en el navegador: cada nodo es un símbolo del repo, cada arista una relación. Es clicable, filtrable y buscable — la arquitectura de un vistazo, sin releer un solo fichero.

### 4. Consultar el grafo

Ya no necesitas volver a `/graphify`: el grafo generado se consulta por CLI directamente.

```bash
graphify query "what connects auth to the database?"
graphify path "UserService" "DatabasePool"
graphify explain "RateLimiter"
```

> [!check] Checkpoint
> `graphify query` debería devolver una respuesta concreta —nodos y aristas nombrados— no un resumen genérico. Si la pregunta no tiene sentido para tu repo, cámbiala por algo real de tu dominio: un servicio, una clase, una tabla que sepas que existe.

Así responde de verdad `graphify query` (salida real sobre un proyecto propio en .NET, a la pregunta *"¿qué implementa `ISqlParser` y dónde se usa?"*):

```text
Traversal: BFS depth=2 | Start: ['ISqlParser'] | 14 nodes found

NODE ISqlParser        [src=src/MyApp.Core/Interfaces/ISqlParser.cs loc=L5]
NODE ScriptDomParser   [src=src/MyApp.Infrastructure/Parsing/ScriptDomParser.cs]
NODE TreeSitterParser  [src=src/MyApp.Infrastructure/Parsing/TreeSitterParser.cs]
...
EDGE ISqlParser --implements [EXTRACTED]--> ScriptDomParser
EDGE ISqlParser --implements [EXTRACTED]--> TreeSitterParser
EDGE ISqlParser --method     [EXTRACTED]--> .Parse()
EDGE .Parse()   --references [EXTRACTED context=return_type]--> SqlAstModel
```

*La respuesta cita nodos y aristas concretos —no un resumen— cada una marcada `EXTRACTED`, y por eso sabes de dónde sale cada afirmación sin abrir un solo fichero.*

## 📊 Mídelo tú: grep vs. grafo

Aquí está el experimento que de verdad importa de este lab — y es el que la cifra de marketing (**71,5×**, reportada por usuarios de Graphify, no medida por mí) te invita a no hacer: comprobarlo tú mismo, con tu repo y tu pregunta.

La clave es una comparación **limpia**: **dos agentes con el mismo modelo** y **contexto fresco** cada uno — uno responde solo con grep-and-read, el otro solo con el grafo. Separarlos evita que el segundo se aproveche de lo que ya leyó el primero; así el número que salga es honesto y es tuyo, no el de nadie.

### Cómo lanzar la prueba

Elige una pregunta concreta y verificable sobre tu repo — algo cuya respuesta sepas comprobar ("¿dónde se descuentan los créditos?", "¿qué toca la tabla `Orders`?"). Luego lanza **dos agentes con el mismo modelo**, cada uno en una sesión nueva.

**Agente A — grep-and-read** (sin grafo):

```text
Responde SOLO con grep y lectura de ficheros, sin usar Graphify, a esta pregunta
sobre el repo: "<TU PREGUNTA>". Mientras buscas, lleva la cuenta y repórtame al
final: grep lanzados, ficheros abiertos (y su tamaño) y tokens de contexto totales.
```

**Agente B — grafo** (sesión nueva, mismo modelo):

```text
Responde con `graphify query` a esta pregunta sobre el repo: "<TU PREGUNTA>".
Repórtame los tokens de los nodos y aristas que devuelve el grafo.
```

**Consolida el resultado:** junta las dos salidas en una tabla comparativa y guárdala como un fichero markdown (`comparativa.md`) en la raíz del repo — así queda el número medido, con fecha, para poder volver a él. La tabla, rellena con **tus** números:

| Métrica | Grep-and-read | Grafo (`graphify query`) |
|---|---|---|
| `grep` lanzados | … | 0 |
| Ficheros abiertos | … | 0 (solo nodos citados) |
| Tokens de contexto | … | … |
| **Contexto ahorrado** | — | **… ×** |

> [!example] Resultado real — y por qué hay que medir
> **Este blog (Quartz, 610 nodos), 6 preguntas.** El grafo abre **0 ficheros** en todas (responde con `graphify query`); el grep abre los que haga falta:
>
> | Pregunta | ficheros (grep) | grep tk | grafo tk | ahorro |
> |---|---|---|---|---|
> | GlobalConfiguration | 8 | 9.248 | 1.562 | 5,9× |
> | FullPageLayout | 5 | 4.755 | 1.565 | 3,0× |
> | PageList | 4 | 3.794 | 1.563 | 2,4× |
> | GraphOptions | 1 | 1.008 | 460 | 2,2× |
> | QuartzConfig | 3 | 1.417 | 1.564 | 0,9× |
> | Analytics | 1 | 707 | 881 | 0,8× |
>
> **Media 2,5× · rango 0,8–5,9×.** En 2 de 6, el grep salió *más barato*: abría pocos ficheros y el `graphify query` está acotado (~1,5k tokens). El grafo gana cuando el grep tendría que abrir **muchos** ficheros; empata o pierde cuando la respuesta ya estaba en 1-3 ficheros pequeños. (En otro proyecto propio en .NET, una pregunta similar dio **9,8×**.) Moraleja: mide *tu* repo con este lab, no te fíes del titular.
>
> *Y es un suelo conservador: cuenta **un** grep + leer las coincidencias. Un agente real encadena varios greps en bucle (grep → leer → grep → leer…), así que en preguntas de varios saltos el grep gasta más y el ahorro sube.*

> [!check] Checkpoint
> El agente termina con una cifra propia de ahorro (grep vs. grafo) sobre tu repo. **No es "71,5×"**: es 8×, 40× o lo que te haya salido. Lo que prueba el experimento no es el número, es que **la estructura del dato de búsqueda importa más que el tamaño del modelo** que busca.

**Por qué gana el grafo:** en grep-and-read el agente abre ficheros que no venían al caso solo porque la palabra aparecía de pasada. El grafo no: la arista ya codifica la relación real, y la marca como **EXTRACTED** (está en el código: una llamada, un import, un FK) o **INFERRED** (la dedujo Graphify). Por eso la respuesta del grafo cita sus fuentes y sabes qué fiar y qué verificar — mientras que grep te devuelve coincidencias de texto que hay que leer para descartar.

## 🧮 El modelo del ahorro (por qué el veredicto es estructural)

Los números de arriba no son anécdota: salen de **cómo escala cada estrategia**. Y no escala de forma lineal.

**Una pregunta se responde en varios saltos** (`h = 1…H`): el agente localiza algo y desde ahí salta al siguiente. En cada salto, las dos estrategias pagan cosas distintas:

- **grep** busca un término y **lee los ficheros que salen** → cuesta `fₕ · sₕ` (ficheros × tamaño).
- **grafo** hace una `graphify query` → cuesta `bₕ`, **topado por el budget** (`bₕ ≤ B`) y sin abrir ficheros.

El contexto total de una pregunta es la **suma de sus saltos**:

$$C_{\text{grep}} = \sum_{h=1}^{H} f_h\,s_h \qquad\qquad C_{\text{grafo}} = \sum_{h=1}^{H} b_h \;\le\; H\cdot B$$

**Por qué no es lineal.** `f` y `s` **no son constantes**: crecen con el tamaño del repo (más código → términos más ambiguos, ficheros mayores) y con el alcance de la pregunta (`H`↑). Los tres suben a la vez, así que `C_grep` es **super-lineal** en la complejidad — una curva convexa. En cambio `b` está **topado** por el budget, así que `C_grafo` es **sub-lineal** y se **aplana**. El ahorro no es un "×" fijo, es una función que crece:

$$R = \frac{\sum_h f_h\,s_h}{\sum_h b_h}\ \nearrow\ \text{con el tamaño del repo y la profundidad de la pregunta.}$$

**Medido salto a salto** (recorrido real de 4 saltos en un proyecto propio en .NET: Console → parser → analyzer → exporter):

| | por salto (tokens) | total |
|---|---|---|
| **grafo** (`bₕ`) | 460 · 1.134 · 362 · 445 — *topado* | **2.401** |
| **grep** (`fₕ·sₕ`) | 0 · 6.748 · 756 · 1.735 — *disparado* | **9.239** |

Los **mismos 4 saltos** en ambos: el ahorro (**3,8×**) no viene de hacer menos loops, sino del **coste de cada loop**. Mira el salto `ScriptDomParser`: al grep le costó 6.748 tk (5 ficheros); al grafo, 1.134 topados.

**La conclusión estructural:** grep ≈ **O(Σ fₕsₕ)** con `f,s` crecientes → **super-lineal**; grafo ≈ **O(Σ bₕ)** con `b` topado → **sub-lineal, se aplana**. El grafo no elimina los loops: **acota el coste de cada uno**. Y para `N` preguntas se suma por pregunta —cada una con su `H`, su `f`, su `s`—, así que el ahorro es una **distribución**, no un número. Por eso: mídelo en tu repo.

![Ajuste sobre 16 preguntas: el grep crece ~lineal con los ficheros que toca la pregunta; el grafo se queda topado bajo el budget](/static/labs/graphify/coste-funcion.png)

*Ajuste real sobre 16 preguntas (cada punto, una pregunta). El grep (coral) crece ~lineal con los ficheros que toca; el grafo (teal) se queda plano bajo el budget. Regresión: `grep ≈ 1.000 · ficheros^0,93` (R²=0,75); grafo, pendiente ~0. La cifra `a≈1.000 tk/fichero` es de este repo — en el tuyo será otra.*

> [!check] El veredicto, contra los datos medidos
> Un solo modelo predice los tres regímenes, **incluido cuándo el grafo pierde**:
>
> | Pregunta | régimen | ahorro |
> |---|---|---|
> | blog `Analytics` | 1 salto, 1 fichero pequeño (`Σfs < B`) | **0,8×** — gana el grep |
> | .NET, recorrido 4 saltos | multi-salto, ficheros medianos | **3,8×** |
> | .NET `ISqlParser`, bucle | término ambiguo, 6 greps / 15 ficheros | **16,4×** |
>
> Que prediga el caso en que **pierde** es lo que lo hace fiable — y por qué el "×" se mide por pregunta, no se promete.

## Prueba tú

Genera el grafo de un repo que no sea tuyo — una dependencia open source que uses a diario y de la que no conozcas las tripas. Pregúntale a `graphify explain` por el componente que más te intriga. Compara lo que responde con lo que tardarías tú en encontrarlo a mano navegando GitHub. ¿Dónde falla el grafo — qué relación importante no capturó tree-sitter porque solo existe en tiempo de ejecución (reflection, inyección de dependencias dinámica, wiring por configuración)?

## Qué te llevas

Graphify materializa una idea sencilla pero potente: no ayudas a un agente dándole *más* datos, le ayudas dándole datos **navegables** — que pueda recorrer por pasos en vez de procesar de golpe.

Graphify extrae con tree-sitter, así que brilla en **código**: cualquiera de los 36 lenguajes soportados, sin coste de LLM en la extracción. Cuando tu dominio **no** es código —datos, catálogos de metadatos, documentación estructurada— tree-sitter no llega, y ahí toca un grafo a medida (un fichero por nodo, navegación por saltos). Yo construí uno así para otro proyecto propio, y el patrón de fondo es el mismo: partición + navegación por pasos gana a "dar el grafo entero" o "dar el repo entero", casi siempre.

**Cuándo usar cada uno:** Graphify cuando el problema es código y quieres algo que se instala en cinco minutos. Un grafo a medida cuando el dominio se sale de "código" o necesitas control fino sobre qué va en cada nodo y cómo se conecta, cosa que una herramienta genérica no te va a dar.

## Reprodúcelo con tu agente

El blog como laboratorio: pégale el bloque de "Aplícalo" más abajo a tu agente y que monte esto contigo.

Contexto que necesita: acceso a un repo real (el suyo o uno de referencia) para generar el grafo, permiso para instalar `uv`/`graphifyy` si no los tiene, y — para el experimento de "Rómpelo a propósito" — que tú le confirmes qué pregunta concreta usar, porque tiene que ser algo verificable en tu propio código, no un ejemplo genérico.

En cada checkpoint debe verificar de verdad, no asumir: que `graphify-out/` existe con los tres ficheros, que el skill responde dentro del asistente (`/graphify`), y que `graphify query` de la CLI devuelve nodos y aristas nombrados, no un resumen vago.

## Cuestionario para tu agente

- [ ] ¿Se instaló `graphifyy` (PyPI) y se verificó que el comando `graphify` responde (`graphify --version` o equivalente)?
- [ ] ¿Se registró el skill con el asistente de código en uso (`graphify install` + el subcomando del asistente)?
- [ ] ¿Se generó `graphify-out/` con los tres ficheros (`graph.html`, `GRAPH_REPORT.md`, `graph.json`) sobre un repo real?
- [ ] ¿Se ejecutó al menos una consulta (`graphify query`, `graphify path` o `graphify explain`) y se comprobó que la respuesta cita nodos/aristas concretos del repo, no una respuesta genérica?
- [ ] ¿Se midió el ahorro real de tokens en el repo del usuario (grep-and-read vs. grafo) para la misma pregunta, en vez de asumir la cifra de marketing?
- [ ] ¿Se informó al usuario del resultado final: ruta de `graphify-out/`, asistente registrado y el número de tokens medido en el experimento?

## Comprueba lo aprendido

> [!question]- ¿Por qué tree-sitter no necesita llamar a un LLM para extraer el grafo de código, pero el pase semántico de documentación sí?
> Tree-sitter parsea gramática: produce un AST determinista a partir de la sintaxis del lenguaje (funciones, llamadas, imports), lo mismo que hace un compilador antes de generar código máquina. No hay ambigüedad que resolver, así que no hace falta un modelo. Un PDF o una imagen no tiene gramática formal — entender "de qué habla" este documento y cómo se relaciona con el código requiere interpretación semántica, que es justo lo que aporta un LLM.

> [!question]- ¿Qué diferencia práctica hay entre una arista EXTRACTED y una INFERRED, y por qué te debería importar cuál es cuál?
> EXTRACTED viene directamente del fuente — una llamada de función, un import, una FK — es un hecho verificable con solo mirar el código. INFERRED es una relación que Graphify dedujo sin que estuviera escrita explícitamente (por ejemplo, dos módulos que comparten un tipo de dato sin llamarse entre sí). Te debería importar porque determina cuánto puedes fiarte de la respuesta sin verificar: una cadena de aristas EXTRACTED es tan fiable como el código mismo; una INFERRED es una hipótesis razonable, no un hecho, y merece una comprobación antes de actuar sobre ella.

> [!question]- El lab pide medir tú mismo el ahorro de tokens en vez de citar el "71,5×" de Graphify sin más. ¿Por qué importa esa distinción?
> Porque la cifra de otro repo, con otra pregunta y otro tamaño de codebase, no predice lo que pasará en el tuyo. El ahorro depende de cuánto ruido hay realmente en tu repo respecto a la pregunta que haces — un monolito con nombres pobres se beneficia mucho más del grafo que un repo pequeño y bien organizado donde el grep ya era casi directo. Medir tu propio caso es lo que separa una decisión de arquitectura de repetir un titular.

> [!question]- ¿Por qué el coste del grafo se mantiene ~plano aunque el repo crezca, y el del grep no?
> Porque un `graphify query` está acotado por el presupuesto (`--budget`): devuelve solo el subgrafo relevante, no importa si el repo tiene 127 nodos o 610. El grep, en cambio, lee ficheros enteros, y cuantos más ficheros mencionen el término, más tokens gasta — su coste crece ~lineal con los ficheros que toca la pregunta, mientras el del grafo se queda topado.

> [!question]- ¿Cuándo elegirías construir un grafo a medida en vez de usar Graphify?
> Cuando el dominio no es código fuente que tree-sitter pueda parsear — datos, catálogos de metadatos, documentación estructurada con su propia semántica — o cuando necesitas control fino sobre qué información exacta lleva cada nodo y cómo se calculan sus aristas. Graphify gana en velocidad de puesta en marcha y cobertura de lenguajes; un grafo a medida gana cuando el dominio se sale de "código".

## Referencias

- [Graphify](https://graphify.net/)
- [Repositorio en GitHub](https://github.com/safishamsi/graphify)
