# LumiLearn · Nomenclatura inorgànica

Web app en React + Vite per practicar nomenclatura inorgànica d'ESO/Batxillerat amb correcció immediata, mode examen, repàs intel·ligent d'errors i estadístiques desades a `localStorage`.

## Funcionalitats principals

- Pràctica ràpida amb correcció instantània i explicació breu.
- Examen de 40 exercicis: 20 d’anomenar i 20 de formular.
- Repàs d’errors, prioritzant especialment errades repetides, Stock i oxosals.
- Ajustos per temes, nomenclatura, dificultat, temporitzador i tolerància d’accents.
- Estadístiques de progrés, ratxa, històric de notes i errades freqüents.
- Mode clar/fosc i disseny responsive.

## Executar en local

```bash
npm install
npm run dev
```

L’app quedarà disponible habitualment a `http://localhost:3000`.

## Build de producció

```bash
npm run build
npm run preview
```

## Estructura principal

- `App.tsx`: interfície principal i pantalles.
- `data/chemistry.ts`: base química centralitzada i guia integrada.
- `lib/chemistry.ts`: generador d’exercicis, validació, progrés i examen.
- `styles.css`: estils globals.

## Persistència

L'aplicació desa automàticament a `localStorage`:

- ajustos de l'usuari,
- progrés i estadístiques,
- tema visual.
