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
description: "Diseñé una capa ejecutable para este blog: posts que compilaban a skills instalables por agentes. Funcionó de extremo a extremo. Y la retiré el mismo día, porque el modelo de amenaza no aguantaba y cada arreglo añadía más maquinaria. Este es el ADR de por qué — y de qué quedó en su lugar."
---

Este post iba a ser otro. Su primera versión era el ADR que proponía la **capa ejecutable** de este blog: posts que no solo se leen, sino que un agente puede descubrir, instalar y ejecutar. La construí, funcionó de extremo a extremo, y la retiré antes de dejarla publicada.

Los ADRs no documentan solo lo que se adopta. Documentan lo que se descarta y por qué — esa es la mitad del valor. Así que este es el postmortem de una feature que maté yo mismo, con el análisis que la mató.

> [!important] Estado del ADR
> **Propuesto** (2026-07-08) → **Retirado** (2026-07-09). La maquinaria (emitter, manifiesto, skills) está eliminada del código y del sitio. Lo que queda en su lugar: unas *Notas para agentes* al final de cada lab, como documentación que se aplica con el usuario delante.

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

Podría haberla parcheado. De hecho, lo intenté sobre el papel: distribuir las skills desde un repo Git con tags en lugar de servirlas por HTTP, checksums en el catálogo, permisos de solo lectura declarados en el frontmatter, un pipeline que probara cada skill con un agente antes del release... Cada parche era razonable. Y la suma era un producto de distribución de software colgando de un blog personal — más maquinaria de la que la idea valía, más superficie que mantener, más promesas de seguridad que cumplir.

Así que la decisión fue retirarla entera, no parchearla:

- **Se va:** el emitter, el manifiesto, el catálogo de skills, el `curl` de auto-instalación y toda mención en `llms.txt` y la home. Eliminado del código, no desactivado.
- **Se queda:** lo único que aportaba valor real sin modelo de amenaza — unas **Notas para agentes** al final de cada lab. No un runbook paralelo que duplique los pasos (el post ya los cuenta, y un agente los extrae perfectamente): solo lo que la narrativa no dice — las decisiones de adaptación, los guardarraíles con las claves, el criterio de "hecho". El usuario le pasa la URL a su agente y trabaja con él delante. La mediación humana es la barrera de seguridad, no un paso a optimizar.

## 📝 Lo que me llevo

- **"Funciona de extremo a extremo" no es un criterio de publicación.** Es el momento exacto de preguntarse quién más puede usar ese extremo a extremo.
- **En sistemas con agentes, el canal de confianza es parte de la arquitectura**, no un detalle de despliegue. El mismo payload es una herramienta o un exploit según quién lo sirve y cómo se verifica.
- **Cuando asegurar una feature exige construir un producto entero alrededor, la feature no era viable.** Una skill es una dependencia de software: o se distribuye como tal —versionada, empaquetada, verificable— o no se distribuye. Un blog no es ese canal, y fingir que puede serlo era el error de fondo.
- **Matar una feature propia a tiempo es una decisión de arquitectura de primera clase** — y documentarla vale más que la feature. Por eso este post existe.

## 📎 Referencias

- [Harness Engineering: el nuevo rol del arquitecto en la era de los agentes IA](harness-engineering-agentes-ia.md) — el marco: el harness es el producto, y su seguridad también.
- [Lab: LiteLLM, resolviendo la entropía multiproveedor](../02%20Laboratorios/litellm-multiproveedor.md) — el lab que cierra con las "Notas para agentes" que sí sobrevivieron.
- [llms.txt — la convención](https://llmstxt.org/) · [Agent Skills](https://code.claude.com/docs/en/skills) — los estándares que la capa usaba.
