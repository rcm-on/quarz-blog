---
title: "Construyendo este sitio: Arquitectura Docs-as-Code con Obsidian y Quartz"
date: 2026-03-31
tags:
  - quartz
  - github/actions
  - github
  - obsidian
---
# **🚀 Docs-as-Code: El Motor de este Portfolio**

Este artículo registra  los pasos de configuración y los problemas resueltos para levantar este mismo sitio utilizando **Obsidian** (como CMS local), **Quartz v4** (como generador de sitio estático) y **GitHub Actions** (como pipeline de CI/CD).

## **🏗️ 1 . Configuración del Entorno Local (Obsidian)**

Para que el ecosistema funcione sin fricciones entre la escritura local y el control de versiones con Git, la estructura del repositorio debe ser estricta.

[\!warning\] Regla de Oro del Entorno Local

El plugin de Git en Obsidian puede fallar si no detecta correctamente la raíz del repositorio.

1. **Clonado Limpio:** Se debe clonar el fork de Quartz en una carpeta nueva.  
2. **Raíz de la Bóveda:** Al abrir Obsidian, se selecciona la **carpeta principal del repositorio**, NO la carpeta content.  
3. **Gestión de Contenido:** Todo el contenido (Markdown, imágenes) vive *exclusivamente* dentro de la subcarpeta content.

## **🔗 2\. Estándar de Enrutamiento (Clean URLs)**

Para mantener URLs profesionales (Slugs) y evitar problemas de codificación en servidores Linux, he adoptado el siguiente estándar de nomenclatura:

[!info] Buenas Prácticas de SEO y Enrutamiento

* **Nombre del archivo:** Corto, en minúsculas y separado por guiones (ej. guia-despliegue-quartz). Esto genera la URL limpia: /Articulos/guia-despliegue-quartz.  
* **Propiedad Title (Frontmatter):** Dentro del archivo, se usa la propiedad YAML title: para definir el título largo y presentable que leerá el usuario.  
* **Enlaces (Wikilinks):** En archivos índice, se usa la barra vertical (|) para mapear la ruta técnica con el nombre visual:  
  \[\[03 Guidelines/Quartz + GitHub Actions | Construyendo este sitio: Arquitectura Docs-as-Code\]\]

## **⚙️ 3\. Pipeline de CI/CD: Solución al error de Jekyll**

Durante el primer despliegue a producción en GitHub Pages, el sistema falló por un conflicto de motores de renderizado.

[!bug] El Problema: Liquid Exception

GitHub Pages intentó compilar el sitio React/Node usando **Jekyll** (su motor heredado por defecto). Al leer la sintaxis de Quartz, lanzó un error de sintaxis de Liquid.

[!success] La Solución: Infraestructura como Código (IaC)

Se inyectó manualmente el pipeline de despliegue Node.js ignorando Jekyll.

1. En Settings \> Pages de GitHub, se cambió el Source a **GitHub Actions**.  
2. Se creó el archivo de flujo de trabajo .github/workflows/deploy.yml con el siguiente manifiesto:

name: Deploy Quartz site to GitHub Pages

on:  
  push:  
    branches:  
      \- v4  
      \- main  
      \- master

permissions:  
  contents: read  
  pages: write  
  id-token: write

concurrency:  
  group: "pages"  
  cancel-in-progress: false

jobs:  
  build:  
    runs-on: ubuntu-22.04  
    steps:  
      \- uses: actions/checkout@v4  
        with:  
          fetch-depth: 0  
      \- uses: actions/setup-node@v4  
        with:  
          node-version: 22  
      \- name: Install Dependencies  
        run: npm ci  
      \- name: Build Quartz  
        run: npx quartz build  
      \- name: Upload artifact  
        uses: actions/upload-pages-artifact@v3  
        with:  
          path: public

  deploy:  
    needs: build  
    environment:  
      name: github-pages  
      url: ${{ steps.deployment.outputs.page\_url }}  
    runs-on: ubuntu-latest  
    steps:  
      \- name: Deploy to GitHub Pages  
        id: deployment  
        uses: actions/deploy-pages@v4

## **🎨 4\. Branding y UI/UX Personalizada**

Para alejar el sitio de la "plantilla genérica" y darle un aspecto de documentación de plataforma técnica (estilo Vercel o Stripe), se modificaron los componentes base de Quartz:

### **A. Metadatos y Tema (quartz.config.ts)**

* **Modo Hacker/Tech:** Se configuró theme \> darkMode con fondos grises muy oscuros (\#0d1117) y acentos en azul terminal (\#58a6ff).  
* **Tipografía:** Se implementó Inter para una lectura limpia en UI y Fira Code para los bloques de código.

### **B. Layout de Documentación (quartz.layout.ts)**

* Se ajustó el defaultContentPageLayout moviendo el Índice de Contenidos (TableOfContents) a la columna derecha, reservando la izquierda para la navegación global del ecosistema.

### **C. Refinamiento CSS (quartz/styles/custom.scss)**

Se inyectaron variables para redondear bordes y suavizar el contraste de las alertas y bloques de código, mejorando la legibilidad prolongada.