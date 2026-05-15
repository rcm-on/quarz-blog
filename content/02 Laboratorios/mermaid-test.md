---
title: "Diagramas Mermaid — Prueba de renders"
date: 2026-05-14
draft: true
tags:
  - lab
  - mermaid
description: "Prueba de todos los tipos de diagrama Mermaid disponibles en Quartz."
draft: false
---

Comprobación de los tipos de diagrama Mermaid disponibles en Quartz.

---

## Flowchart — Arquitectura de agente IA

```mermaid
graph TD
    U([Usuario]) -->|prompt| O[Orchestrator]
    O --> P{Plan}
    P -->|tool call| T1[Herramienta: Búsqueda]
    P -->|tool call| T2[Herramienta: Código]
    P -->|tool call| T3[Herramienta: Memoria]
    T1 --> M[Modelo LLM]
    T2 --> M
    T3 --> M
    M -->|respuesta| O
    O -->|output| U
    style M fill:#4338ca,color:#fff
    style O fill:#f97316,color:#fff
```

---

## Sequence — Flujo RAG

```mermaid
sequenceDiagram
    actor U as Usuario
    participant API
    participant VDB as Vector DB
    participant LLM

    U->>API: pregunta
    API->>VDB: embed(pregunta)
    VDB-->>API: chunks relevantes
    API->>LLM: prompt + contexto
    LLM-->>API: respuesta generada
    API-->>U: respuesta final
```

---

## Architecture — Capas de sistema IA

```mermaid
architecture-beta
    group infra(cloud)[Infraestructura]
    group app(server)[Aplicación]

    service db(database)[Vector Store] in infra
    service cache(disk)[Cache semántica] in infra
    service api(internet)[API Gateway] in app
    service agent(server)[Agente LLM] in app
    service obs(monitor)[Observabilidad] in app

    api:R --> L:agent
    agent:B --> T:db
    agent:R --> L:cache
    agent:T --> B:obs
```

---

## State — Ciclo de vida de un agente

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Planning : recibe tarea
    Planning --> Executing : plan listo
    Executing --> Reflecting : acción completada
    Reflecting --> Planning : necesita más pasos
    Reflecting --> Done : tarea resuelta
    Executing --> Error : fallo de herramienta
    Error --> Reflecting : analiza error
    Done --> [*]
```

---

## ERD — Modelo de datos de Knowledge Base

```mermaid
erDiagram
    DOCUMENTO {
        string id PK
        string titulo
        string contenido
        float[] embedding
        date creado
    }
    CHUNK {
        string id PK
        string doc_id FK
        string texto
        float[] embedding
        int posicion
    }
    ETIQUETA {
        string id PK
        string nombre
    }
    DOCUMENTO ||--o{ CHUNK : "se divide en"
    DOCUMENTO }o--o{ ETIQUETA : "tiene"
```

---

## Gantt — Roadmap de implementación

```mermaid
gantt
    title Implementación de pipeline RAG
    dateFormat  YYYY-MM-DD
    section Infraestructura
    Vector DB           :done,    inf1, 2026-05-01, 7d
    API Gateway         :done,    inf2, 2026-05-05, 5d
    section Datos
    Ingesta documentos  :active,  dat1, 2026-05-10, 10d
    Embeddings          :         dat2, after dat1, 7d
    section Agente
    Orquestador LLM     :         age1, 2026-05-20, 14d
    Evaluación          :         age2, after age1, 7d
```

---

## Mindmap — Ecosistema de Agentes IA

```mermaid
mindmap
  root((Agentes IA))
    Percepción
      RAG
      Visión
      Audio
    Razonamiento
      Chain of Thought
      ReAct
      Tree of Thought
    Memoria
      Corto plazo
      Largo plazo
      Episódica
    Acción
      Herramientas
      APIs
      Código
    Evaluación
      Métricas
      RLHF
      Red teaming
```
