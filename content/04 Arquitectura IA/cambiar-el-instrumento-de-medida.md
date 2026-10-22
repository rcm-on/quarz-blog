---
title: "Cambiar el instrumento de medida"
date: 2026-08-02
draft: true
tags:
  - ia
  - arquitectura
  - evaluación
  - método
description: "Repasando meses de trabajo, los hallazgos significativos vinieron de cambiar el instrumento de medida, no de mirar más fuerte. Cinco veces."
---

*Cierra una serie de cuatro: [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|doce fallos en mi propia herramienta]] · [[04 Arquitectura IA/como-se-encarga-trabajo-a-un-agente|cómo se le encarga trabajo a un agente]] · [[04 Arquitectura IA/un-solo-corpus-te-engana|una sola base de prueba te engaña]] · **el patrón**.*

Una nota corta, porque el patrón es corto.

Repasando meses de trabajo sobre el mismo proyecto, **todos los hallazgos significativos vinieron de cambiar el instrumento de medida, no de mirar más fuerte con el mismo.** Cinco veces, y ninguna me di cuenta hasta la quinta.

---

**1. Un script en Node midiendo algo hecho para un agente.** Optimicé un formato de datos para que un agente de IA lo leyera mejor y lo medí con `process.hrtime`: bytes y milisegundos, todo a favor. Medido con **un agente de verdad**, en un caso la ventaja no existía y en otro se invertía. El dato estaba bien; el instrumento, no. Está contado entero en [[04 Arquitectura IA/medir-agentes-no-scripts|medir agentes, no scripts]].

**2. Pruebas unitarias contra el catálogo de la base de datos.** El motor llevaba meses con las unitarias en verde. Contrastado contra **`sys.foreign_keys` del propio SQL Server**, aparecieron ausencias que ninguna prueba miraba, porque una prueba unitaria comprueba lo que se te ocurrió comprobar.

**3. Una base de muestra contra una segunda base.** Con AdventureWorks salió, en la primera ejecución, un defecto que era **estructuralmente indetectable** con la base que llevaba meses usando. Ese es el [[04 Arquitectura IA/un-solo-corpus-te-engana|post anterior]] entero.

**4. Una herramienta de clustering que no encontró nada.** Probé si el clustering de un grafo revelaba el acoplamiento entre aplicación y base de datos. **0 de 6.** Un resultado negativo, y de los más útiles que he tenido: dejó de ser una vía a explorar.

**5. Un experimento con otro modelo que falló por otro motivo.** Chocó con sus propios límites de contexto y, de rebote, destapó un defecto de diseño que nadie estaba buscando: **las reglas de negocio vivían en el JavaScript del dashboard, no en el motor**. El hallazgo no fue el resultado del experimento. Fue su efecto colateral.

---

## Por qué pasa siempre

La moraleja no es "mide más". Con el mismo instrumento, medir más solo te da más confianza en el mismo punto ciego.

> [!important] Cada instrumento tiene un punto ciego que es invisible desde dentro del propio instrumento
> Un script no puede decirte que un agente se comporta distinto. Una prueba unitaria no puede decirte lo que no se te ocurrió comprobar. Una base de prueba limpia no puede decirte lo que le pasa a una sucia.

La única forma de encontrar ese punto ciego es **medir la misma cosa con algo que falle de otra manera**.

Por eso la lista de nueve capas de verificación del [[04 Arquitectura IA/doce-fallos-en-mi-herramienta|primer post]] no es una checklist de calidad. Es otra cosa: **una colección de puntos ciegos que no se solapan**. Añadir una décima capa que falle igual que una de las nueve no aporta nada; añadir una que falle distinto puede aportar un defecto grave.

---

## El corolario: publica los resultados negativos

Los dos hallazgos más rentables de esa lista —el 0 de 6 del clustering y el prototipo que recuperaba un 21% de los casos en una base de prueba y **cero** en otra— tienen algo en común: **no hay nada que enseñar**. No hay captura, no hay demo, no hay número que suba.

Y son exactamente los que más tiempo ahorran, porque cada uno **cierra una puerta**. Sin ellos escritos, dentro de seis meses vuelvo a abrirla, con la misma corazonada y el mismo entusiasmo.

Lo mismo vale para los límites que documentamos sin arreglar: los identificadores de paso posicionales, las tablas temporales sin nodo, el 68% de SQL dinámico irresoluble por diseño. Ninguno da un buen titular. Todos evitan que alguien —yo el primero— tome una decisión creyendo que la herramienta sabe algo que no sabe.

Y hay un efecto que no esperaba: **publicar lo que no funcionó hace más creíble lo que sí.** Un repositorio donde todo sale bien es un repositorio que nadie ha medido de verdad. El día que escribí que mi propia herramienta tenía doce defectos, dejó de parecer marketing.

---

## Aplícalo

Si quieres repetir este ejercicio sobre tu propio proyecto, pégale esto a tu agente de código:

```text
Con mi permiso, lista los instrumentos de medida que ya usamos en
este proyecto (scripts, tests, linters, gates) y para cada uno
dime qué tipo de fallo no podría detectar nunca, por diseño. Luego
propón un instrumento distinto que falle de otra manera para la
misma pregunta — no inventes resultados, solo propón el
experimento y qué verías si existe el punto ciego. Si ya corriste
algo que no encontró nada, dímelo también: un resultado negativo
cuenta.
```
