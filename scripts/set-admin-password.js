// Crea o actualiza un admin del panel con la contraseña hasheada.
//
//   npm run admin:password -- halfmoon@admin.com
//
// La contraseña se pide por teclado y no se muestra, así no queda en el
// historial de la terminal ni en los logs.

import readline from 'node:readline';
import dotenv from 'dotenv';
import pg from 'pg';
import { hashPassword } from '../api/auth.js';

dotenv.config();

const ask = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // readline no tiene modo password: interceptamos la escritura para que
      // el eco de las teclas no llegue a la pantalla.
      rl._writeToOutput = (chunk) => {
        if (chunk.includes(question)) rl.output.write(question);
      };
    }
    rl.question(question, (answer) => {
      if (hidden) rl.output.write('\n');
      rl.close();
      resolve(answer.trim());
    });
  });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en el .env');
    process.exit(1);
  }

  const email = (process.argv[2] || (await ask('Email del admin: '))).trim().toLowerCase();
  if (!email) {
    console.error('Necesito un email.');
    process.exit(1);
  }

  const password = await ask('Contraseña nueva: ', { hidden: true });
  if (password.length < 8) {
    console.error('La contraseña tiene que tener al menos 8 caracteres.');
    process.exit(1);
  }
  const repeat = await ask('Repetila: ', { hidden: true });
  if (password !== repeat) {
    console.error('No coinciden.');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const hash = await hashPassword(password);
    const existing = await pool.query('SELECT id FROM admins WHERE lower(email) = lower($1)', [email]);

    if (existing.rows.length) {
      await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, existing.rows[0].id]);
      console.log(`Contraseña actualizada para ${email}`);
    } else {
      const name = (await ask('Nombre completo: ')) || 'Admin HalfMoon';
      await pool.query(
        'INSERT INTO admins (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [name, email, hash, 'admin']
      );
      console.log(`Admin ${email} creado`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
