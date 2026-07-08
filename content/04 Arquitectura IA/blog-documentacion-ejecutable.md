---
title: "Maté mi propia feature: postmortem de la capa ejecutable"
date: 2026-07-09
tags:
  - arquitectura
  - ia
  - agentes
  - seguridad
  - docs-as-code
  - meta
description: "Diseñé una capa ejecutable para este blog: posts que compilaban a skills instalables por agentes. Funcionó de extremo a extremo. Y la retiré el mismo día, porque el modelo de amenaza no aguantaba. Este es el ADR de por qué — y de cómo volverá."
---

Este post iba a ser otro. Su primera versión era el ADR que proponía la **capa ejecutable** de este blog: posts que no solo se leen, sino que un agente puede descubrir, instalar y ejecutar. La construí, funcionó de extremo a extremo, y la retiré antes de dejarla publicada.

Los ADRs no documentan solo lo que se adopta. Documentan lo que se descarta y por qué — esa es la mitad del valor. Así que este es el postmortem de una feature que maté yo mismo, con el análisis que la mató.

> [!important] Estado del ADR
> **Propuesto** (2026-07-08) → **Retirado por seguridad** (2026-07-09). Las *Instrucciones para agentes* de los labs se mantienen como documentación; la maquinaria de descubrimiento e instalación automática queda desactivada hasta el rediseño descrito al final.

---

## 🏗️ Lo que construí

La idea era la conclusión lógica de dos tesis de este blog — [la documentación como infraestructura operativa](../01%20Artículos/documentar-ahora-es-diferente.md) y [el harness como el verdadero producto](harness-engineering-agentes-ia.md):

1. Un post marcaba en su frontmatter un bloque `action:` (id, `when_to_use`, tipo).
2. En cada build, un emitter de Quartz publicaba un **manifiesto de descubrimiento** (`actions.json`) y empaquetaba la sección "Instrucciones para agentes" de cada post como una **skill instalable** (`SKILL.md`, el formato de Agent Skills: Markdown con frontmatter).
3. `llms.txt` anunciaba la cadena completa: entra por aquí, descubre el catálogo, instala la skill con un `curl`.

El post *era* la skill: una fuente de verdad, compilada en cada build, cero drift entre lo que leía el humano y lo que ejecutaba el agente. Elegante. Y lo probé de verdad: un agente sin contexto previo, con solo la URL del blog, encontró la skill, verificó precondiciones, escribió los tres ficheros del gateway LiteLLM y lo dejó corriendo y verificado.

Funcionaba. Ese era el problema.

## 🔓 El modelo de amenaza que no aguantaba

La pregunta que lo tumbó no fue "¿funciona?" sino: **¿qué acabo de enseñar a hacer a los agentes?**

A ejecutar instrucciones servidas por una página web. Sin versión, sin integridad, sin revisión, con invitación explícita a auto-instalarse. Míralo desde el otro lado del tablero:

- **El canal es indistinguible de un ataque.** Un `llms.txt` que dice "descarga este fichero e instálalo en tu directorio de skills" es *exactamente* la forma de un intento de prompt injection. Si mi blog legítimo normaliza ese patrón, estoy entrenando a usuarios y agentes a aceptar el mismo patrón cuando lo sirva un dominio malicioso. La feature no puede diseñarse asumiendo que solo publican actores honestos.
- **Sin integridad ni versión.** El `SKILL.md` que el usuario aprobó hoy y el que su agente relee mañana pueden ser distintos — un blog comprometido reescribe la skill silenciosamente y cada agente que la tenga instalada ejecuta lo nuevo. No había checksums, ni tags, ni forma de fijar versión.
- **El consentimiento estaba en el sitio equivocado.** Lo puse en "el agente pregunta antes de instalar". Pero un consentimiento pedido *por el mismo canal no confiable que sirve el payload* no vale nada: la página que te sirve la skill es la que te redacta la pregunta.

Ninguna de estas objeciones era teórica: son el pan de cada día de cualquier cadena de suministro. Yo mismo escribo sobre no ejecutar contenido no confiable — y había construido un dispensador de contenido no confiable con instrucciones de ejecución. La ironía no se sostenía.

## ⚖️ La decisión

Retirarla, no matarla. Qué se queda y qué se va:

- **Se queda:** la sección "Instrucciones para agentes" de los labs, como documentación. Un agente puede leerla y reproducir el lab *con su usuario delante* — la mediación humana es la barrera de seguridad, no un paso a optimizar. El emitter queda en el repo, desregistrado.
- **Se va:** el manifiesto, el catálogo de skills, el `curl` de auto-instalación y toda mención en `llms.txt` y la home. Nada en el sitio invita ya a un agente a ejecutar o instalarse nada.

## 🧭 Cómo volverá (el rediseño)

El error no era la idea — "el post compila a skill" sigue siendo la tesis correcta. El error era **el canal de confianza**. El rediseño cambia el canal, no la tesis:

1. **Distribución con procedencia.** El build no servirá skills por HTTP: las publicará en un **repo Git con tags de versión**, instalable por el canal estándar de plugins del agente. La confianza se muda de "una web me lo dice" a "un repo auditable, versionado y diffable que el usuario instala deliberadamente". El blog explica y enlaza; no dispensa ejecutables.
2. **Skills de solo lectura primero.** Las primeras skills no tocarán el sistema: **auditan** — revisa mi `docker-compose` contra la guía, evalúa mi ARCH.md contra la checklist. Valor alto, superficie de ataque mínima, y es el contenido diferencial del blog (las guidelines) convertido en herramienta.
3. **Integridad verificable.** Catálogo con checksums y versiones fijables, para que "la skill que aprobaste" y "la skill que se ejecuta" sean demostrablemente la misma.

## 📝 Lo que me llevo

- **"Funciona de extremo a extremo" no es un criterio de publicación.** Es el momento exacto de preguntarse quién más puede usar ese extremo a extremo.
- **En sistemas con agentes, el canal de confianza es parte de la arquitectura**, no un detalle de despliegue. El mismo payload es una herramienta o un exploit según quién lo sirve y cómo se verifica.
- **Matar una feature propia a tiempo es una decisión de arquitectura de primera clase** — y documentarla vale más que la feature. Por eso este post existe.

## 📎 Referencias

- [Harness Engineering: el nuevo rol del arquitecto en la era de los agentes IA](harness-engineering-agentes-ia.md) — el marco: el harness es el producto, y su seguridad también.
- [Lab: LiteLLM, resolviendo la entropía multiproveedor](../02%20Laboratorios/litellm-multiproveedor.md) — el lab cuyas instrucciones para agentes siguen publicadas como documentación.
- [llms.txt — la convención](https://llmstxt.org/) · [Agent Skills](https://code.claude.com/docs/en/skills) — las piezas estándar sobre las que se apoyará el rediseño.
