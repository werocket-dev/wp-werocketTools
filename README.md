# WeRocket Tools

Plugin WordPress pour agences : gestion du consentement cookies (GDPR), affichage des avis Google, et informations Google Business.

## Installation initiale sur un site WordPress

1. Télécharger le ZIP `werocket-tools.zip` depuis la [dernière release GitHub](https://github.com/blablaa-lab/we-wp-werocketTools/releases/latest)
2. Dans WordPress : **Extensions → Ajouter → Téléverser une extension**
3. Uploader le ZIP et activer le plugin

## Mises à jour automatiques

Le plugin se met à jour automatiquement depuis ce dépôt GitHub **public** via le Plugin Update Checker v5 — aucune configuration côté `wp-config.php` n'est nécessaire.

Les mises à jour apparaissent dans **Tableau de bord → Mises à jour**, comme n'importe quel plugin WordPress. WordPress vérifie les updates toutes les 12h ; pour forcer un check immédiat : **Tableau de bord → Mises à jour → "Vérifier à nouveau"**.

## Développement

### Prérequis

- Node.js 20+
- npm

### Lancer le build local

```bash
npm install
npm run dev    # watch mode
npm run build  # build de production
```

### Publier une nouvelle version

Pousser sur `main` — le workflow GitHub Actions s'occupe de tout :
- Build Vite
- Bump automatique de la version patch
- Création du tag et de la release GitHub avec le ZIP

### Stack technique

- **PHP 8.0+** — PSR-4, pas de Composer
- **React 19 + TypeScript** — interface admin via Vite
- **shadcn/ui + Tailwind CSS v4** — composants UI
- **Plugin Update Checker v5.7** — système d'auto-update depuis GitHub
