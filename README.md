# Watt's Up?

Interactive energy-house hackathon scaffold using Vite, React, TypeScript and React Three Fiber.

## Run

```sh
npm ci
npm run dev
```

The initial screen shows a grey box with orbit controls and a title overlay.

## Checks

```sh
npm test
npm run build
npm run lint
```

Use `@/` for imports from `src/`. Shared appliance data belongs in `src/data/appliances.ts`, tunables in `src/data/config.ts`, and global state in `src/store/useHouse.ts`.
