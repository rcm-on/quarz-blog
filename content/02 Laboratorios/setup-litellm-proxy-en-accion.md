---
title: "Lab: dejé que un agente instalara el gateway LiteLLM solo"
date: 2026-07-09
draft: true
status: "rechazada"
tags:
  - lab
  - ia
  - agentes
  - litellm
  - docker
  - context-engineering
description: "Rastro real de un agente (Claude Code) descubriendo la skill setup-litellm-proxy desde llms.txt, ejecutando sus precondiciones y escribiendo los tres ficheros del gateway sin intervención manual — qué hizo bien, dónde se detuvo y por qué."
---

> [!important] Estado del experimento
> **Publicado** (2026-07-09) → **Rechazado** (2026-07-09). La skill instalable `setup-litellm-proxy` que este post documenta dependía de la capa ejecutable (manifiesto + skills auto-descubiertas), retirada por revisión de seguridad — ver el [postmortem](04-Arquitectura-IA/blog-documentacion-ejecutable). Este post queda en `draft` como registro de lo que se probó, no como guía a reproducir.

El [lab de LiteLLM multiproveedor](02-Laboratorios/litellm-multiproveedor) tiene una sección de más: "Instrucciones para agentes". No es documentación para humanos — es un runbook que un agente IA puede leer y ejecutar solo, publicado como skill instalable en `/skills/setup-litellm-proxy/SKILL.md`. Escribir esa sección es fácil. Confiar en que un agente la siga bien, sin supervisión, es otra cosa.

Este post es el rastro de la primera vez que la puse a prueba de verdad: le pedí a Claude Code que leyera `llms.txt`, encontrara la skill y la ejecutara en mi máquina. Sin decirle los pasos — solo el objetivo.

---

## El descubrimiento

El agente no conocía la skill de antemano. La encontró sola, siguiendo la cadena que el propio blog expone para eso:

```
blog.rcmon.dev/llms.txt
  → blog.rcmon.dev/skills/index.json   (catálogo)
  → blog.rcmon.dev/skills/setup-litellm-proxy/SKILL.md
```

El `SKILL.md` remite al post original como "fuente canónica" para los tres ficheros de configuración — la skill en sí es solo el runbook, no duplica el contenido. El agente fue a buscarlo también antes de escribir nada.

## Precondiciones — antes de tocar disco

El runbook exige comprobar Docker y preguntar qué proveedores tiene el usuario disponibles. Así lo hizo:

```bash
$ docker --version && docker compose version
Docker version 29.3.1, build c2be9cc
Docker Compose version v5.1.1

$ curl -s http://localhost:11434/api/tags
curl: (7) Failed to connect to localhost port 11434: Connection refused
```

Ollama no estaba corriendo. En vez de asumir nada, el agente lo interpretó como una señal para **excluir** el modelo `local` de `config.yaml`, no como un error que detener el lab. Después preguntó explícitamente qué proveedores quería configurar y dónde debía crear el directorio de trabajo — dos decisiones que el runbook delega al usuario a propósito.

## Lo que escribió

Con Azure y NVIDIA confirmados, generó los tres ficheros en `litellm-gateway/`, recortando `config.yaml` a los dos proveedores elegidos y generando un `master_key` propio en vez de reutilizar el `sk-lab-1234` del ejemplo:

```yaml
model_list:
  - model_name: produccion
    litellm_params:
      model: azure/gpt-4o
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
  - model_name: experimentos
    litellm_params:
      model: nvidia_nim/meta/llama-3.3-70b-instruct
      api_key: os.environ/NVIDIA_NIM_API_KEY

litellm_settings:
  fallbacks:
    - produccion: ["experimentos"]

general_settings:
  master_key: sk-litellm-2807594dac6be1f3
```

Y en `.env`, ni una clave inventada:

```bash
AZURE_API_BASE=<tu-recurso>.openai.azure.com
AZURE_API_KEY=<pega-tu-clave-azure-aqui>
NVIDIA_NIM_API_KEY=<pega-tu-clave-nvidia-aqui>
```

Esa es la línea que más me importaba ver respetada. El runbook dice explícitamente "pide las claves al usuario; nunca las inventes ni las escribas en `config.yaml`" — y es exactamente el punto donde un agente menos disciplinado rellenaría con algo plausible para "completar la tarea".

## Dónde se detuvo

`docker compose up -d` **no se ejecutó**. Con el `.env` en placeholders, levantar el contenedor solo habría producido un 401 del proveedor — una prueba falsa de éxito, no una real. El agente prefirió dejar el paso pendiente y explicar por qué, en vez de simular una verificación que no era honesta:

- [ ] `curl -s http://localhost:4000/health/liveliness` → `"I'm alive!"`
- [ ] Una petición a `/v1/chat/completions` con el `master_key` devuelve `choices[0].message.content` no vacío
- [ ] Endpoint, `master_key` y nombres lógicos comunicados al usuario

Los tres puntos siguen tal cual en el runbook original, esperando claves reales.

---

## Lo que esto valida

No es que el agente "supiera Docker". Es que **siguió un contrato escrito para agentes** sin desviarse en los tres sitios donde desviarse habría sido más cómodo: no inventó Ollama cuando no estaba, no inventó claves cuando no las tenía, y no fingió una verificación que no podía hacer.

Eso es lo que separa un runbook para humanos de una skill para agentes: no basta con que los pasos sean correctos, tienen que ser **imposibles de completar a medias sin que el agente lo note**. El paso de verificación no es un checklist decorativo — es la barrera que impide que el agente reporte éxito sin haberlo comprobado.

> [!tip] Si quieres reproducirlo
> Apunta cualquier agente con acceso a herramientas de red al `llms.txt` de este blog y pídele que instale `setup-litellm-proxy`. El runbook está diseñado para pedirte las claves, nunca para inventarlas.

## 📎 Referencias

- [Lab: LiteLLM, resolviendo la entropía multiproveedor](02-Laboratorios/litellm-multiproveedor) — fuente canónica de los tres ficheros
- [/skills/setup-litellm-proxy/SKILL.md](https://blog.rcmon.dev/skills/setup-litellm-proxy/SKILL.md)
- [/skills/index.json](https://blog.rcmon.dev/skills/index.json) — catálogo de skills instalables
- [Lab: ARCH.md](02-Laboratorios/arch-md-ejemplo) — el otro extremo del mismo patrón: contexto para que un agente no se pierda entre sesiones
