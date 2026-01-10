# Design System: Barberia CR (Apple-Style Dark Mode)

Este documento describe los principios de diseño, la paleta de colores y los componentes utilizados en la nueva interfaz de usuario de "Barberia CR". El objetivo es lograr una experiencia **minimalista, premium y moderna**, inspirada en el "Dark Mode" de iOS.

## 1. Fundamentos Visuales

### Colores
La paleta se basa en un fondo gris oscuro profundo para reducir la fatiga visual, con tarjetas translúcidas ("Glassmorphism") para jerarquizar el contenido.

*   **Fondo Principal (`--color-background`):** `#3E3E3E` (Gris Oscuro Base)
*   **Tarjetas / Superficies (`--color-card`):** `rgba(255, 255, 255, 0.07)` (Blanco Translúcido / Glass)
*   **Highlight / Hover (`--color-card-highlight`):** `rgba(255, 255, 255, 0.12)`
*   **Texto Principal (`--color-text-primary`):** `#FFFFFF` (Blanco Puro)
*   **Texto Secundario (`--color-text-secondary`):** `rgba(255, 255, 255, 0.6)`
*   **Acento (`--color-accent`):** `#30D158` (Verde iOS vibrante)
*   **Peligro / Acción Destructiva (`--color-danger`):** `#FF453A` (Rojo iOS)

### Tipografía
Se utiliza la pila de fuentes del sistema (`system-ui`) para una sensación nativa y limpia en cualquier dispositivo (San Francisco en Apple, Segoe UI en Windows, Roboto en Android).

*   **Títulos:** `font-bold` o `font-semibold`, tracking ajustado (`tracking-tight`).
*   **Cuerpo:** `font-medium` o `font-normal`.
*   **Etiquetas:** `font-medium`, mayúsculas, tracking amplio (`tracking-widest`).

### Efectos y Formas
*   **Bordes Redondeados:**
    *   Botones y Tarjetas Grandes: `rounded-2xl` o `rounded-xl`.
    *   Elementos Pequeños: `rounded-lg` o `rounded-full` (botones circulares).
*   **Sombras:** Sutiles (`shadow-sm`) para dar profundidad sin ensuciar.
*   **Glassmorphism:** Uso de `backdrop-blur-md` en elementos flotantes o superpuestos.

---

## 2. Estructura de Páginas

### Home (Dashboard)
El centro de mando de la aplicación.
*   **Header:** Limpio, con saludo "Bienvenido" y nombre de la marca. Botón de perfil flotante a la derecha. Separación sutil del contenido.
*   **Widget de Reserva:** Tarjeta destacada con efecto de brillo (blur) y botón de "Cancelar" estilo texto (sin borde pesado).
*   **Menú Principal:** Lista estilo "Inset Grouped" (como Configuración de iOS).
    *   Iconos dentro de contenedores "Squircle" (`rounded-xl`) con fondo de acento tenue.
    *   Efecto de hover con gradientes y movimiento sutil.

### Turnos (Booking)
*   **Selector de Fecha:** Input nativo oculto sobre una tarjeta estilizada ("Glass Input").
*   **Lista de Turnos:** Tarjetas individuales (`bg-card`) separadas.
    *   Hora destacada a la izquierda.
    *   Botón de acción estilo "Pill" (`rounded-full`, `bg-white/10`, texto verde).
*   **Estado Vacío:** Mensaje centrado, tipografía secundaria.

### Historial
*   **Resumen:** Badge (insignia) superior mostrando el total de visitas (`bg-accent/20`).
*   **Lista:** Similar a Turnos, pero enfocada en la información (Fecha/Hora) con iconografía simple.

### Perfil
*   **Avatar:** Placeholder con iniciales en un círculo grande.
*   **Datos:** Agrupados en una tarjeta contenedora única con separadores internos (`border-b border-white/5`), imitando una tarjeta de contacto.
*   **Acciones:** Botón de "Cerrar Sesión" destacado como acción destructiva al final de la pantalla.

---

## 3. Componentes Clave

### Botones
*   **Primario (Acción):** Fondo `white/10` o `accent/20`, texto de acento.
*   **Destructivo:** Fondo transparente o `danger/10`, texto rojo.
*   **Navegación (Atrás):** Flecha simple + Texto, estilo nativo.

### Iconos
*   Todos los iconos utilizan `fill="currentColor"` para adaptarse dinámicamente al color del texto del contenedor (`text-accent`, `text-primary`, etc.).
