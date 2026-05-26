# Cómo está hecho el portal

Notas técnicas sobre el portal de Lo Público. No es documentación formal, es un registro de decisiones para quien tenga que tocar el código más adelante (probablemente yo mismo).

---

## Stack

**Astro** como generador estático. No hay framework de UI —nada de React, Vue ni Svelte en el portal principal. La razón es simple: el portal es básicamente contenido estático con alguna interacción menor (el aviso de móvil que se cierra). Para eso no hace falta un árbol de componentes reactivo, y el HTML resultante es más limpio y rápido.

Astro permite mezclar componentes de distintos frameworks si hace falta en el futuro, así que la puerta no está cerrada. Por ahora, todo son componentes `.astro` con su propio CSS con ámbito.

**TypeScript** activado en modo estricto (`tsconfig.json`). En un proyecto de este tamaño los tipos en el frontmatter de los componentes son más documentación que otra cosa, pero evitan errores tontos cuando se refactoriza.

---

## CSS

Sin frameworks. Tailwind habría sido cómodo para prototipado rápido, pero para un diseño editorial con esta cantidad de reglas específicas (márgenes exactos, alturas mínimas calculadas para alinear texto entre columnas, ratios de aspecto fijos) hubiera resultado en clases imposibles de leer y difíciles de ajustar.

El enfoque es CSS con ámbito (`:where` de Astro por defecto) más variables globales en `:root` definidas en `Layout.astro`. Las variables cubren la paleta, las familias tipográficas y los valores de espaciado que se repiten, lo que hace que un cambio de tema o de fuente sea un cambio en un único sitio.

Los valores de layout que se repiten están centralizados como variables CSS en `:root` dentro de `Layout.astro`: `--page-max` (1320px), `--page-pad` (48px) y `--page-pad-sm` (20px). La clase `.page` también está definida ahí como global, de modo que todas las páginas tienen exactamente el mismo ancho sin duplicar reglas.

Las reglas responsive usan `max-width` porque el diseño base es de escritorio. Los breakpoints son:

- `768px`: aparece el aviso de dispositivo pequeño
- `860px`: el grid de dos columnas (sidebar + contenido) en páginas interiores colapsa a una columna
- `900px`: el grid de herramientas de la portada colapsa a una columna
- `600px`: padding lateral reducido (gestionado globalmente en `.page`)

---

## Tipografía

Tres familias de Google Fonts cargadas en el layout base:

- **Geist** para cabeceras y UI. Geométrica, tiene buen espaciado a tamaños grandes y no se pone fea a pesos altos. Alternativa obvia sería Inter, pero Geist tiene más carácter en los pesos medios.
- **Lora** para cuerpo de texto y pull quotes. Serif con buenas itálicas, legible en tamaños de lectura (14–16px). Las itálicas se usan para los pull quotes y para el contraste con los títulos en sans.
- **JetBrains Mono** para etiquetas, metadatos y elementos de UI secundarios. La monoespacia da ritmo visual y distingue la capa de "información sobre el dato" del dato en sí. Tiene ligaduras desactivadas por defecto, que es lo que se quiere aquí.

Las fuentes se preconectan en el `<head>` antes de la hoja de estilos para reducir el tiempo de carga. El `display=swap` de Google Fonts evita el FOIT.

---

## Componentes

El portal tiene cuatro componentes:

**`Layout.astro`** — Envuelve todas las páginas. Contiene el `<head>`, las fuentes, las variables CSS globales y el aviso de dispositivo pequeño. No sabe nada del contenido de las páginas.

**`SiteHeader.astro`** — Acepta `currentPath` para marcar el enlace activo. Los enlaces de navegación están definidos como un array en el frontmatter, así añadir una página nueva es una línea.

**`SiteFooter.astro`** — AVELROM con enlace al blog, licencia CC-BY, GitLab y la nota sobre el Prado. El footer es un elemento independiente fuera del contenedor `.page`, con su propio `<div class="footer-content">` interior que aplica el mismo `max-width` y padding que el resto del sitio. Así el fondo del footer puede ocupar el ancho completo sin necesidad de márgenes negativos.

**Páginas** — `index.astro`, `acerca.astro`, `metodologia.astro`. Cada una importa `Layout`, `SiteHeader` y `SiteFooter`, y define su propio CSS con ámbito en un bloque `<style>` al final.

---

## Grid de herramientas

El grid de la portada es dinámico: se calcula en tiempo de build a partir del número de herramientas definidas en el array `tools`. La columna lead siempre ocupa `1.4fr` y el resto se reparten en fracciones iguales (`repeat(N-1, 1fr)`). Añadir una herramienta nueva al array es suficiente; el layout se adapta solo.

Los divisores verticales entre columnas son `border-left: 1px solid var(--line)` en el selector `.tool-col + .tool-col`, no columnas de grid separadas. Esto simplifica el marcado y hace que añadir o quitar herramientas no rompa los índices del grid.

Las captions de los cuadros tienen una altura mínima fija calculada para dos líneas (`min-height: calc(2 * 1.5 * 10.5px)`), lo que garantiza que los títulos de las herramientas arranquen en la misma línea base en las tres columnas, independientemente de la longitud del texto de la caption.

Por debajo de `900px` el grid colapsa directamente a una columna. No hay breakpoint intermedio de tablet: el diseño de múltiples columnas o no cabe, o cabe bien, y el punto en que deja de caber es `900px`.

---

## Aviso de dispositivo pequeño

Implementado en `Layout.astro` como un `<div>` con `display: none` por defecto que pasa a `display: flex` por debajo de `768px`. El botón de cierre usa `onclick="this.parentElement.remove()"` —JavaScript inline, sin framework, porque no necesita más. Si se quisiera que el aviso no reaparezca en recarga, se podría guardar un flag en `sessionStorage`, pero por ahora no parece necesario.

---

## Transiciones entre páginas

El portal usa `ClientRouter` de `astro:transitions` para la navegación en cliente. En el `<body>` se aplica `transition:animate={fade({ duration: '0.4s' })}`, que hace que cada cambio de página sea un fade cruzado suave.

En la portada, las columnas de herramientas tienen una animación de entrada escalonada: cada columna aparece con un pequeño desplazamiento vertical y un fade, con 130ms de retardo entre una y la siguiente. Esto solo ocurre en la carga inicial; la navegación entre páginas usa únicamente el fade global del `ClientRouter`.

El `fade()` de Astro gestiona el crossfade a nivel del elemento `body`, lo que evita el destello blanco que producen los overrides directos de `::view-transition-old/new(root)` cuando el navegador aplica `mix-blend-mode: plus-lighter` por defecto.

---

## Lo que no hay

- **JavaScript mínimo en cliente**: solo el `onclick` del aviso de móvil y el `ClientRouter` de Astro para la navegación. No hay hidratación, no hay estado global.
- **Sin Tailwind ni ningún framework CSS.** El CSS es manual y específico.
- **Sin sistema de gestión de contenidos.** El contenido está en los ficheros `.astro`. Si el volumen de herramientas o de páginas crece lo suficiente como para que esto sea un problema, la migración a Markdown con frontmatter + colecciones de Astro es directa.
- **Sin variables de entorno.** No hay nada que configurar para levantar el proyecto localmente.

---

## Desarrollo local

```
npm install
npm run dev
```

Por defecto arranca en `localhost:4321`. Si ese puerto está ocupado, Astro busca el siguiente disponible.

```
npm run build    # genera el sitio estático en dist/
npm run preview  # sirve dist/ localmente para comprobar el build
```

---

## Imágenes

Las imágenes de los cuadros están en `/public/` como archivos JPG sin optimización adicional. Para un portal de esta escala no es un problema, pero si el tiempo de carga en conexiones lentas resultara relevante, Astro tiene integración con Sharp para optimización automática mediante `<Image />` del paquete `astro:assets`.

Los atributos `width` y `height` están presentes en todos los `<img>` para evitar el layout shift (CLS) durante la carga.
