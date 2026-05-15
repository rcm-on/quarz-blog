---
title: Arquitectura y Despliegue de LLMs locales con Ollama y Docker
date: 2026-03-30
draft: true
tags: [llmops, docker, arquitectura, ia]
---
# Desplegando IA en Local: Privacidad y Control

Como Arquitecto de Software, la integración de modelos de lenguaje (LLMs) plantea un desafío crítico: **la privacidad de los datos**. Enviar información sensible de la empresa a APIs de terceros (como OpenAI o Anthropic) no siempre es viable por normativas de seguridad.

La solución pasa por el **LLMOps en infraestructura propia**. En este laboratorio, documento cómo levantar un modelo open-source utilizando **Ollama** contenedorizado con Docker.

---

## 🏗️ Arquitectura de la Solución

El objetivo es tener un servicio desacoplado que exponga una API REST compatible con OpenAI, pero ejecutándose 100% en nuestra máquina o servidor on-premise.

> [!info] Componentes del Stack
> - **Runtime:** Docker Engine
> - **Inferencia:** Ollama
> - **Modelo:** Llama 3 (o Mistral)
> - **Interfaz (Opcional):** Open WebUI

## ⚙️ Implementación (Docker Compose)

Para mantener la infraestructura como código (IaC), defino el servicio en un `docker-compose.yml`. Esto asegura que el entorno sea reproducible en cualquier nodo.

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama_core
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: always
    # Si tienes GPU Nvidia, descomenta las siguientes líneas:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

volumes:
  ollama_data:
```