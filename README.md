# HalfMoon Indumentaria

Web pública (catálogo + personalizador canvas) y panel de administración.  
Stack: **React + Vite** (frontend) · **Express + PostgreSQL/Neon** (API).

Repositorio: https://github.com/tomasrudilla/HalfMoon

---

## Requisitos

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **npm** (viene con Node)
- Acceso a la base **Neon** (PostgreSQL) del proyecto

---

## Primer arranque (para Tomi o cualquier dev)

### 1. Clonar e instalar

```bash
git clone https://github.com/tomasrudilla/HalfMoon.git
cd HalfMoon
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Editá `.env` y pegá la `DATABASE_URL` de Neon.  
**No subas `.env` a GitHub** — ya está en `.gitignore`.

> Si no tenés la URL, pedísela a Toli o entrá al [Neon Console](https://console.neon.tech) del proyecto compartido → **Connection string** (modo *pooler*).

### 3. Base de datos (solo la primera vez)

En el **SQL Editor** de Neon, ejecutá en este orden:

| Orden | Archivo | Qué hace |
|------:|---------|----------|
| 1 | [`docs/schema-init.sql`](docs/schema-init.sql) | Tablas, índices, seed admin y settings |
| 2 | [`docs/sql/catalog-and-canvas-migration.sql`](docs/sql/catalog-and-canvas-migration.sql) | 12 productos del home + tabla `canvas_catalog_items` |

Documentación extra: [`docs/database-neon.md`](docs/database-neon.md)

### 4. Levantar el proyecto (dos terminales)

**Terminal 1 — API (puerto 3000):**

```bash
npm run api
```

**Terminal 2 — Frontend (Vite, puerto 5173):**

```bash
npm run dev
```

Abrí en el navegador: **http://localhost:5173**

El frontend proxyea `/api/*` al backend en desarrollo — no hace falta tocar CORS ni URLs.

### 5. Verificar que todo funciona

- Sitio público: http://localhost:5173  
- Catálogo: http://localhost:5173/catalogo  
- Admin: http://localhost:5173/admin (o doble click en el logo del nav → login)  
- API viva: http://localhost:3000/api/estado  

---

## Credenciales admin (desarrollo)

| Campo | Valor |
|-------|-------|
| Email | `halfmoon@admin.com` |
| Password | `1234` |

> Solo para dev. En producción hay que usar hash seguro (bcrypt).

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Frontend Vite (HMR) |
| `npm run api` | Backend Express con nodemon |
| `npm run build` | Build de producción del frontend |
| `npm run preview` | Preview del build |

---

## Estructura del proyecto

```
HalfMoon/
├── server.js              # API Express
├── src/
│   ├── pages/             # Catálogo, ficha de producto
│   ├── components/        # Nav, personalizador, carousel, etc.
│   ├── admin-screens/     # Dashboard, leads, catálogo admin
│   ├── data/              # storeProducts.js, mockups del canvas
│   └── layouts/           # Layout público
├── public/
│   ├── mockups/           # Remeras/buzos frente y dorso (personalizador)
│   └── gallery/           # Imágenes del home
└── docs/
    ├── schema-init.sql
    └── sql/catalog-and-canvas-migration.sql
```

---

## Notas importantes

- **Catálogo del home** hoy lee de `src/data/storeProducts.js` (estático). La tabla `catalog_items` en Neon alimenta el admin **Catálogo & Precios**; la migración SQL ya carga los 12 productos.
- **Personalizador** usa mockups en `public/mockups/` y `src/data/productMockups.js`. La tabla `canvas_catalog_items` está lista para conectar al admin más adelante.
- **`.env` con credenciales** no debe commitearse. Si alguna URL quedó expuesta en commits viejos, rotá la contraseña en Neon.

---

## Deploy (futuro)

- Frontend: build con `npm run build` → servir `dist/` (Vercel, Netlify, etc.)
- API: `node server.js` con `DATABASE_URL` en variables de entorno del hosting
- En producción configurar el proxy inverso o `VITE_API_URL` si se separan dominios
