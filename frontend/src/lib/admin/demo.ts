/**
 * Le bouton « Accès admin » connecte un compte de démo aux identifiants publics :
 * actif en dev, et en production seulement si NEXT_PUBLIC_ADMIN_DEMO=true.
 */
export function isAdminDemoEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ADMIN_DEMO === "true";
}
