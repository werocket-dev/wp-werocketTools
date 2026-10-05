/*
 * Ajustements des composants shadcn pour la maquette « Werocket — Tableau de
 * bord » : panneaux bordés à 12 px sans ombre et boutons secondaires 8 px, au
 * lieu des rayons Luma (rounded-4xl) et de l'ombre par défaut. Couleurs :
 * tokens uniquement (cf. palette admin dans styles/globals.css).
 */

/** Card utilisée comme panneau : bordure fine, pas d'ombre ni de padding interne. */
export const PANEL = 'gap-0 overflow-hidden rounded-[12px] py-0 shadow-none ring-1 ring-border'

/** Button variant="outline" — bouton secondaire (Configurer, Documentation…). */
export const SECONDARY_BUTTON =
  'h-9 gap-2 rounded-[8px] border-input bg-card px-3.5 text-[13px] text-foreground [&_svg]:text-muted-foreground'

/** Button variant="outline" — petite action de ligne (Lier les pages, Relancer…). */
export const ROW_ACTION_BUTTON =
  'h-[30px] gap-1 rounded-[7px] border-input bg-card px-2.5 text-xs font-semibold text-foreground [&_svg]:text-muted-foreground'
