// Sesión del panel admin.
//
// El token vive en una cookie httpOnly que pone el servidor, así que desde acá
// no se guarda ni se lee nada: sólo se pregunta quién está logueado. Por eso
// todas las llamadas van con credentials 'same-origin', que además es lo que
// hace el resto de los fetch del panel sin configurar nada.

const jsonHeaders = { 'Content-Type': 'application/json' };

async function readError(response, fallback) {
  try {
    const data = await response.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

/** Devuelve el admin logueado, o null si no hay sesión válida. */
export async function fetchSession() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user ?? null;
  } catch {
    // Sin red tratamos la sesión como cerrada; el login vuelve a intentar.
    return null;
  }
}

export async function login({ email, password, remember }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'same-origin',
    body: JSON.stringify({ email, password, remember }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'No pudimos iniciar sesión.'));
  }

  const data = await response.json();
  return data.user;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {
    // Si el pedido falla igual cerramos del lado del cliente.
  }
}
