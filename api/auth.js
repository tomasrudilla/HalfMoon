// Autenticación del panel admin.
//
// El token va en una cookie httpOnly en lugar de localStorage: así el JS de la
// página no puede leerlo (un XSS no se roba la sesión) y el navegador la manda
// sola en cada fetch al mismo origen, sin tocar las llamadas que ya existen.
// SameSite=Lax alcanza como defensa CSRF porque el navegador no adjunta la
// cookie en pedidos que vienen de otro sitio.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'halfmoon_session';
const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 12;

// Intentos fallidos por email. En Vercel cada instancia tiene su propio Map,
// así que esto frena fuerza bruta casera, no un ataque distribuido.
const LOCK_AFTER = 8;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map();

const isBcryptHash = (value) => typeof value === 'string' && value.startsWith('$2');

// Sin maxAge la cookie es "de sesión": el navegador la borra al cerrarse.
// Eso es lo que pide el check "Mantener mi sesión iniciada" cuando va destildado.
const cookieOptions = (remember = true) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  ...(remember ? { maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 } : {}),
});

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function registerFailure(email) {
  const entry = attempts.get(email) || { count: 0, until: 0 };
  entry.count += 1;
  if (entry.count >= LOCK_AFTER) entry.until = Date.now() + LOCK_MS;
  attempts.set(email, entry);
}

function lockedFor(email) {
  const entry = attempts.get(email);
  if (!entry || !entry.until) return 0;
  const left = entry.until - Date.now();
  if (left <= 0) {
    attempts.delete(email);
    return 0;
  }
  return left;
}

/**
 * Verifica credenciales contra la tabla admins.
 * Si el hash guardado todavía es texto plano (el seed original), lo migra a
 * bcrypt en el primer login correcto para no dejar contraseñas sin hashear.
 */
async function verifyCredentials(pool, email, password) {
  const result = await pool.query(
    'SELECT id, full_name, email, password_hash, role FROM admins WHERE lower(email) = lower($1) LIMIT 1',
    [email]
  );
  const admin = result.rows[0];
  if (!admin) return null;

  if (isBcryptHash(admin.password_hash)) {
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return null;
  } else {
    if (admin.password_hash !== password) return null;
    const upgraded = await hashPassword(password);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [upgraded, admin.id]);
  }

  return { id: admin.id, email: admin.email, name: admin.full_name, role: admin.role };
}

export function registerAuthRoutes(app, pool) {
  app.post('/api/auth/login', async (req, res) => {
    const secret = getSecret();
    if (!secret) {
      return res.status(500).json({
        error: 'Falta configurar JWT_SECRET en el servidor.',
      });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Completá email y contraseña.' });
    }

    const lockedMs = lockedFor(email);
    if (lockedMs) {
      const minutes = Math.ceil(lockedMs / 60000);
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Probá de nuevo en ${minutes} minuto${minutes === 1 ? '' : 's'}.`,
      });
    }

    try {
      const admin = await verifyCredentials(pool, email, password);
      if (!admin) {
        registerFailure(email);
        // Mismo mensaje para usuario inexistente y contraseña incorrecta, para
        // no revelar qué emails están dados de alta.
        return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
      }

      attempts.delete(email);
      const token = jwt.sign(
        { sub: admin.id, email: admin.email, role: admin.role },
        secret,
        { expiresIn: `${SESSION_DAYS}d` }
      );
      res.cookie(COOKIE_NAME, token, cookieOptions(req.body?.remember !== false));
      res.json({ user: admin });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const admin = readSession(req);
    if (!admin) return res.status(401).json({ error: 'No autorizado' });
    res.json({ user: admin });
  });
}

export function readSession(req) {
  const secret = getSecret();
  const token = req.cookies?.[COOKIE_NAME];
  if (!secret || !token) return null;
  try {
    const payload = jwt.verify(token, secret);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    // Token vencido, manipulado o firmado con otro secret.
    return null;
  }
}

export function requireAuth(req, res, next) {
  const admin = readSession(req);
  if (!admin) return res.status(401).json({ error: 'No autorizado' });
  req.admin = admin;
  next();
}

/**
 * Cierra toda la API salvo lo que el sitio público necesita.
 *
 * Va como allowlist a propósito: si mañana alguien agrega un endpoint nuevo y
 * se olvida de este archivo, nace protegido en vez de nacer abierto.
 *
 * @param {string[]} publicRoutes entradas con formato "GET /api/faqs"
 */
export function createApiGuard(publicRoutes) {
  const allowed = new Set(publicRoutes);
  return (req, res, next) => {
    if (!req.path.startsWith('/api/')) return next();
    if (req.method === 'OPTIONS') return next();
    if (req.path.startsWith('/api/auth/')) return next();
    if (allowed.has(`${req.method} ${req.path}`)) return next();
    return requireAuth(req, res, next);
  };
}
