# LumiLearn · Nomenclatura inorgánica

Web app en React + Vite para practicar nomenclatura inorgánica de ESO/Bachillerato con corrección inmediata, modo examen, repaso inteligente de errores y estadísticas guardadas en `localStorage`.

## Funciones principales

- Práctica rápida con corrección instantánea y explicación breve.
- Examen de 40 ejercicios: 20 de nombrar y 20 de formular.
- Repaso de errores, priorizando especialmente fallos repetidos, Stock y oxosales.
- Ajustes por temas, nomenclatura, dificultad, temporizador y tolerancia de acentos.
- Estadísticas de progreso, racha, histórico de notas y errores frecuentes.
- Modo claro/oscuro y diseño responsive.

## Ejecutar en local

```bash
npm install
npm run dev
```

La app quedará disponible normalmente en `http://localhost:3000`.

## Build de producción

```bash
npm run build
npm run preview
```

## Estructura principal

- `App.tsx`: interfaz principal y pantallas.
- `data/chemistry.ts`: base química centralizada y guía integrada.
- `lib/chemistry.ts`: generador de ejercicios, validación, progreso y examen.
- `styles.css`: estilos globales.

## Persistencia

La aplicación guarda automáticamente en `localStorage`:

- ajustes del usuario,
- progreso y estadísticas,
- tema visual.
