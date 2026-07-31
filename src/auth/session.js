// Sesión del panel admin.
//
// Se guarda en localStorage cuando el usuario tildó "Mantener mi sesión iniciada"
// y en sessionStorage cuando no, así en ese caso se cierra al cerrar la pestaña.
// Todos los accesos van con try/catch: Safari en modo privado tira excepción.

const KEY = 'halfmoon:admin-session';

const has = (storage) => {
  try {
    return storage.getItem(KEY) === '1';
  } catch {
    // Storage bloqueado por el navegador: tratamos la sesión como inexistente.
    return false;
  }
};

export function readSession() {
  return has(window.localStorage) || has(window.sessionStorage);
}

export function startSession({ remember = true } = {}) {
  clearSession();
  try {
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(KEY, '1');
  } catch {
    // Sin storage la sesión igual vale para esta carga de página.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nada que limpiar si el storage no está disponible.
  }
}
