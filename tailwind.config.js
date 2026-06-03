/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    // Désactive le reset CSS (Preflight) — évite les conflits avec l'admin WordPress
    preflight: false,
  },
}
