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

Editá `.env` y pegá la `DATABASE_URL` de Neon. También necesitás un
`JWT_SECRET` propio, sin el cual el login del panel no funciona:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**No subas `.env` a GitHub** — ya está en `.gitignore`.

> Si no tenés la URL, pedísela a Toli o entrá al [Neon Console](https://console.neon.tech) del proyecto compartido → **Connection string** (modo *pooler*).

### 3. Base de datos (solo la primera vez)

En el **SQL Editor** de Neon, ejecutá en este orden:

| Orden | Archivo | Qué hace |
|------:|---------|----------|
| 1 | [`docs/schema-init.sql`](docs/schema-init.sql) | Tablas, índices, seed admin y settings |
| 2 | [`docs/sql/catalog-and-canvas-migration.sql`](docs/sql/catalog-and-canvas-migration.sql) | 12 productos del home + tabla `canvas_catalog_items` |
| 3 | [`docs/sql/meeting-migration.sql`](docs/sql/meeting-migration.sql) | Tabla `quotes`, trabajos, servicios, clientes y estado CRM en leads |
| 4 | [`docs/sql/faqs-migration.sql`](docs/sql/faqs-migration.sql) | Preguntas frecuentes administrables (`site_faqs`) |
| 5 | [`docs/sql/canvas-prendas-ensure.sql`](docs/sql/canvas-prendas-ensure.sql) | Prendas del personalizador (`canvas_catalog_items`) |
| 6 | [`docs/sql/orders-payments-migration.sql`](docs/sql/orders-payments-migration.sql) | `quote_id` en pedidos + tabla `order_payments` |
| 7 | [`docs/sql/orders-description-migration.sql`](docs/sql/orders-description-migration.sql) | Detalle / tipo / color del pedido |
| 8 | [`docs/sql/quotes-deposit-migration.sql`](docs/sql/quotes-deposit-migration.sql) | Seña en presupuestos + origen de producto |
| 9 | [`docs/sql/messages-and-delivery-migration.sql`](docs/sql/messages-and-delivery-migration.sql) | Plantillas de mensajes editables + `delivered_at` en pedidos |
| 10 | [`docs/sql/newsletter-migration.sql`](docs/sql/newsletter-migration.sql) | Suscriptores del newsletter del footer (`newsletter_subscribers`) |
| 11 | [`docs/sql/email-templates-migration.sql`](docs/sql/email-templates-migration.sql) | Plantillas de mail editables (`email_templates`) |

> El paso 3 tiene que ir antes que el 6 y el 8: esos dos dependen de la tabla `quotes`.
> Todas las migraciones son idempotentes, así que se pueden reejecutar sin problema.

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

## Acceso al panel

El login valida contra la tabla `admins`, con la contraseña hasheada con bcrypt.
La sesión viaja en una cookie `httpOnly` firmada con `JWT_SECRET` y dura 7 días
(o hasta cerrar el navegador si se destilda *Mantener mi sesión iniciada*).

Para crear un admin o cambiarle la contraseña:

```bash
npm run admin:password -- tu-email@ejemplo.com
```

La contraseña se pide por teclado y no queda en el historial de la terminal.

El usuario que viene en el seed es `halfmoon@admin.com` con contraseña `1234`.
Sirve para arrancar en local, pero **cambiala antes de usarlo en producción**.
La primera vez que alguien entra con una contraseña guardada en texto plano, el
backend la convierte a bcrypt solo, así que no hay que migrar nada a mano.

### Qué queda público

La API está cerrada por defecto: todo `/api/*` pide sesión salvo una allowlist
explícita en `api/index.js` con lo que necesita la web pública (catálogo,
contenido del sitio y las tres escrituras del personalizador). Si agregás un
endpoint nuevo y no lo sumás a esa lista, nace protegido.

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Frontend Vite (HMR) |
| `npm run api` | Backend Express con nodemon |
| `npm run build` | Build de producción del frontend |
| `npm run preview` | Preview del build |
| `npm run admin:password -- <email>` | Crea o actualiza un admin del panel |

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

## Mensajes automáticos

El panel **Configuración → Mensajes automáticos** permite editar el texto de cada caso sin tocar
código: los pop-ups del personalizador, el mensaje de WhatsApp y los mails al cliente (diseño
guardado, presupuesto pedido y presupuesto generado con seña pendiente).

Los textos aceptan placeholders que se reemplazan con los datos reales:
`{cliente}`, `{prenda}`, `{cantidad}`, `{total}`, `{sena}`, `{saldo}` y `{negocio}`.

Para que los mails salgan hay que completar las variables `SMTP_*` en el `.env`. Sin eso el sistema
sigue funcionando igual (guarda diseños y presupuestos), sólo que no envía nada y lo avisa en el panel.

Con Gmail la contraseña común no funciona: hay que activar la verificación en 2 pasos y generar una
[contraseña de aplicación](https://myaccount.google.com/apppasswords) de 16 caracteres, que va en
`SMTP_PASS` sin espacios. Como `nodemon` no vigila el `.env`, después de editarlo hay que reiniciar
`npm run api` a mano. En producción las mismas variables se cargan en Vercel
(*Settings → Environment Variables*).

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
