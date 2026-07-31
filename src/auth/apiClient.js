// Detecta sesiones vencidas sin tocar los ~50 fetch del panel.
//
// Las pantallas del admin llaman a fetch directo. En vez de envolver cada una,
// se envuelve fetch una sola vez y se avisa cuando la API contesta 401. Es la
// única forma de enterarse a tiempo sin reescribir todas las pantallas.

let handleUnauthorized = null;
let installed = false;

export function onUnauthorized(callback) {
  handleUnauthorized = callback;
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    if (response.status === 401) {
      const url = String(typeof input === 'string' ? input : input?.url || '');
      // Las rutas de auth manejan su propio 401: /me contesta así cuando
      // simplemente no hay sesión, y el login cuando la clave está mal.
      if (url.includes('/api/') && !url.includes('/api/auth/')) {
        handleUnauthorized?.();
      }
    }
    return response;
  };
}
