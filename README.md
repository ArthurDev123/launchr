# Launchr

Marketplace de landing pages creado con Next.js, React, Supabase y Tailwind CSS.

## Desarrollo local

```bash
npm ci
npm run dev
```

Abre `http://localhost:3000`. Necesitas las variables de Supabase definidas en `.env.local`.

## Comandos

```bash
npm run lint
npm run build
npm run start
```

## CI/CD

GitHub Actions ejecuta `npm run lint` y `npm run build` en cada push y pull request hacia `main`.

Cada push a `main` despliega a Vercel mediante `.github/workflows/cd.yml`. Configura estos secretos en GitHub:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Las variables de entorno de Supabase deben configurarse también en el proyecto de Vercel.
