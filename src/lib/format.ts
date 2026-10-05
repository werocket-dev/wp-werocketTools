/** Temps écoulé depuis un horodatage Unix (secondes) : « à l'instant », « il y a 5 min »… */
export function formatRelative(unixTs: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixTs
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`
  return new Date(unixTs * 1000).toLocaleDateString('fr-FR')
}
