---
title: "Harness AI desde la perspectiva del Arquitecto DDD"
date: 2026-05-14
tags:
  - ia
  - arquitectura
  - ddd
  - harness
description: "Cómo un arquitecto de DDD lee la propuesta de Harness AI: bounded contexts, domain events y la promesa de IA integrada en los flujos de entrega."
---

Cuando el mundo de la IA generativa comenzó a invadir las herramientas de desarrollo, la mayoría de los análisis vinieron del lado técnico: modelos, tokens, benchmarks. Harness AI llega con otra promesa — integrarse en el ciclo de vida del software — y merece ser leída desde la óptica de alguien que piensa en términos de dominio, contextos y flujos de negocio.

## Qué propone Harness AI

Harness no es un modelo ni un copiloto de código. Es una plataforma de ingeniería de software (CI/CD, feature flags, observabilidad, gestión de costes cloud) que ha empezado a incorporar IA en cada uno de sus módulos: desde sugerencias de pipelines hasta análisis automático de incidentes.

El arquitecto DDD lo lee así: Harness intenta ser el **dominio de orquestación** entre el código y la producción, y la IA actúa como un servicio de aplicación que enriquece cada bounded context del ciclo de entrega.

```mermaid
graph LR
    subgraph Desarrollo["Bounded Context: Desarrollo"]
        PR[Pull Request]
        CI[Pipeline CI]
    end
    subgraph Entrega["Bounded Context: Entrega"]
        CD[Pipeline CD]
        FF[Feature Flags]
    end
    subgraph Operacion["Bounded Context: Operación"]
        OBS[Observabilidad]
        COST[Gestión de costes]
    end

    AI((Harness AI))

    PR --> CI
    CI -->|artefacto| CD
    CD -->|release| FF
    FF -->|telemetría| OBS
    OBS --> COST

    AI -.->|optimiza| CI
    AI -.->|sugiere rollback| CD
    AI -.->|detecta anomalías| OBS
    AI -.->|recomienda| COST

    style AI fill:#4338ca,color:#fff,stroke:#4338ca
```

## La propuesta desde DDD: IA como servicio de aplicación

En DDD clásico, los servicios de aplicación orquestan casos de uso sin contener lógica de negocio. Harness AI encaja bien en ese rol: no decide qué hace tu pipeline, sugiere y automatiza. La lógica de negocio (qué tests son críticos, qué regiones son prioritarias para el deploy) sigue siendo tuya.

Esto importa porque muchas propuestas de IA en DevOps cometen el error de querer ser el dominio en vez de servir al dominio.

```mermaid
sequenceDiagram
    actor Dev as Desarrollador
    participant GH as Git
    participant H as Harness (orquestador)
    participant AI as Harness AI
    participant PROD as Producción

    Dev->>GH: push feature branch
    GH->>H: webhook: nuevo commit
    H->>AI: ¿qué tests ejecutar?
    AI-->>H: tests críticos según impacto histórico
    H->>H: ejecuta pipeline optimizado
    H->>AI: pipeline fallido — analiza logs
    AI-->>H: causa probable + sugerencia de fix
    H-->>Dev: notificación con contexto IA
    Dev->>GH: push fix
    H->>PROD: deploy con canary automático
    H->>AI: métricas de canary
    AI-->>H: ¿promover o rollback?
    H->>PROD: rollback (anomalía detectada)
```

## Domain Events que Harness AI debería emitir

Uno de los problemas de las plataformas de DevOps es que sus eventos son técnicos, no de dominio. Si Harness AI razona sobre el ciclo de entrega, sus eventos deberían tener semántica de negocio:

```mermaid
graph TD
    E1[PipelineFailed] -->|causa probable| AI
    E2[AnomalyDetected] -->|en producción| AI
    E3[CostThresholdExceeded] -->|en cloud| AI
    E4[DeploymentSlowed] -->|por tests lentos| AI

    AI -->|publica| R1[RollbackRecommended]
    AI -->|publica| R2[TestSuiteOptimized]
    AI -->|publica| R3[ResourceRightSized]
    AI -->|publica| R4[IncidentRootCauseIdentified]

    style AI fill:#f97316,color:#fff,stroke:#f97316
    style R1 fill:#4338ca,color:#fff
    style R2 fill:#4338ca,color:#fff
    style R3 fill:#4338ca,color:#fff
    style R4 fill:#4338ca,color:#fff
```

La diferencia entre `PipelineFailed` y `RollbackRecommended` es exactamente la que separa un evento técnico de un evento de dominio. Harness AI está en posición de hacer esa traducción — si su diseño lo permite.

## El problema de la confianza como concepto de dominio

Desde DDD, la confianza en las sugerencias de la IA no es un detalle de UI — es un concepto de dominio que necesita modelarse explícitamente.

```mermaid
stateDiagram-v2
    [*] --> Sugerida : IA genera recomendación
    Sugerida --> Aceptada : desarrollador aprueba
    Sugerida --> Rechazada : desarrollador descarta
    Sugerida --> AutoAplicada : confianza alta + política configurada
    Aceptada --> Validada : resultado positivo en prod
    Aceptada --> Revertida : resultado negativo
    AutoAplicada --> Validada : resultado positivo
    AutoAplicada --> Revertida : resultado negativo
    Validada --> [*] : alimenta modelo de confianza
    Revertida --> [*] : penaliza modelo de confianza
```

Sin este ciclo de feedback modelado, la IA de la plataforma no aprende del contexto de tu organización — uno de los déficits comunes en las implementaciones actuales.

## Lo que el Arquitecto DDD le pediría a Harness

| Pregunta | Expectativa |
|----------|-------------|
| ¿Dónde están mis bounded contexts? | Que la plataforma los reconozca como límites de configuración |
| ¿Mis domain events viajan por el sistema? | Webhooks con semántica de negocio, no solo técnica |
| ¿Puedo ajustar el modelo de confianza? | Política configurable por equipo/servicio |
| ¿La IA conoce mi ubiquitous language? | Integración con el lenguaje del equipo, no genérico |
| ¿Hay trazabilidad de decisiones IA? | Log de razonamiento, no solo de acción |

## Conclusión

Harness AI es una apuesta interesante precisamente porque no intenta ser una IA de propósito general. Su valor está en el dominio específico del ciclo de entrega de software. Desde DDD, eso es una ventaja enorme: un modelo de IA que sabe dónde está, qué vocabulario usar y qué eventos le importan es un modelo que puede integrarse sin romper las fronteras de contexto que el equipo ha construido.

El riesgo, como siempre, es que la plataforma optimice para la métrica fácil (velocidad de pipelines) y no para el problema de negocio (confianza en el release). Esa distinción es exactamente la que el pensamiento DDD lleva décadas intentando enseñar.

---

> Este artículo explora la propuesta de Harness AI desde una perspectiva arquitectónica de DDD. No es un análisis técnico de la implementación interna de sus modelos.
