# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeRocket Tools is a modular WordPress plugin providing agency tools: cookie consent (GDPR), Google Reviews display, and Google Business Profile management. Built with PHP 8.0+, PSR-4 autoloading, and Tailwind CSS admin interface.

## Architecture

```
werocket-tools/
├── werocket-tools.php          # Main entry point, constants, hooks
├── includes/
│   ├── Autoloader.php          # PSR-4 autoloader (WeRocket\Tools namespace)
│   ├── Core/
│   │   ├── Plugin.php          # Singleton, initializes modules and admin
│   │   ├── Activator.php       # Activation hook logic
│   │   └── Deactivator.php     # Deactivation hook logic
│   ├── Admin/
│   │   └── AdminMenu.php       # WP admin menu, AJAX handlers, asset loading
│   └── Modules/
│       ├── ModuleInterface.php # Contract for all modules
│       ├── AbstractModule.php  # Base class with common functionality
│       ├── ModuleManager.php   # Registers, activates/deactivates modules
│       ├── Cookies/            # GDPR cookie consent module
│       ├── GoogleReviews/      # Google Places reviews module
│       └── GoogleBusiness/     # Business info & Schema.org module
├── templates/
│   ├── admin/                  # Admin dashboard & main template
│   └── modules/                # Module settings & frontend templates
├── assets/
│   ├── css/                    # Admin and frontend styles
│   └── js/                     # Admin and frontend scripts
└── languages/                  # Translation files (.pot, .po, .mo)
```

## Key Patterns

### Module System

All modules implement `ModuleInterface` and extend `AbstractModule`. To add a new module:

1. Create directory under `includes/Modules/YourModule/`
2. Create `YourModuleModule.php` extending `AbstractModule`
3. Implement required methods: `init()`, `render_settings()`, `get_default_settings()`, `sanitize_settings()`
4. Register in `ModuleManager::register_modules()`

### Namespace Convention

All classes use `WeRocket\Tools\` namespace. Directory structure matches namespace:
- `WeRocket\Tools\Core\Plugin` → `includes/Core/Plugin.php`
- `WeRocket\Tools\Modules\Cookies\CookiesModule` → `includes/Modules/Cookies/CookiesModule.php`

### Settings Storage

- Global plugin options: `werocket_tools_options` (contains `active_modules` array)
- Module settings: `werocket_{module_id}_settings` (e.g., `werocket_cookies_settings`)

### AJAX Pattern

Admin AJAX handlers use nonce `werocket_tools_nonce`:
- `werocket_save_settings` - Save module settings
- `werocket_toggle_module` - Activate/deactivate module

## Frontend Shortcodes

- `[werocket_reviews]` - Display Google reviews (options: `count`, `style`)
- `[werocket_business_info]` - Display business contact info
- `[werocket_business_hours]` - Display opening hours
- `[werocket_business_map]` - Display Google Maps/OpenStreetMap

## Development

### Local Setup

Plugin runs in Local by Flywheel environment. Activate via WordPress admin.

### Adding a New Module

```php
// includes/Modules/NewTool/NewToolModule.php
namespace WeRocket\Tools\Modules\NewTool;

use WeRocket\Tools\Modules\AbstractModule;

class NewToolModule extends AbstractModule {
    protected string $id = 'new_tool';
    protected string $name = 'New Tool';
    protected string $description = 'Description here';
    protected string $icon = '<svg>...</svg>';
    protected string $option_key = 'werocket_new_tool_settings';

    public function init(): void {
        // Register hooks, shortcodes, etc.
    }

    public function render_settings(): void {
        $settings = $this->get_settings();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/new-tool-settings.php';
    }

    protected function get_default_settings(): array {
        return ['option1' => 'default'];
    }

    protected function sanitize_settings(array $data): array {
        return ['option1' => sanitize_text_field($data['option1'] ?? '')];
    }
}
```

Then register in `ModuleManager::register_modules()`:
```php
$this->register(new NewToolModule());
```

### CSS Framework

Admin uses Tailwind CSS via CDN. For production, consider compiling Tailwind locally. Frontend modules use standalone CSS in `assets/css/`.

## UI / Design Rules — IMPÉRATIF

**Toute interface (admin ET front) DOIT utiliser exclusivement le template shadcn/ui installé (preset `b1GwVdBaa` — teal/neutral, Luma style).**

### Règles strictes

1. **Composants shadcn obligatoires** — Toujours utiliser les composants importés depuis `@/components/ui/*` :
   - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`
   - `Button` avec ses `variant` (`default` / `outline` / `ghost` / `secondary` / `destructive` / `link`) et `size`
   - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
   - `Accordion`, `Input`, `Textarea`, `Select`, `Switch`, `Checkbox`, `Badge`, `Tabs`, `Label`, `Separator`
   - **Jamais** réimplémenter à la main avec `<div className="bg-white rounded-lg shadow ...">`

2. **Aucun style en dur** — Interdit :
   - Couleurs hex / rgb hardcodées dans le code React (`#10b981`, `bg-emerald-600`, `text-teal-500`, etc.)
   - Bordures / shadows / radius custom qui ne viennent pas du composant shadcn (`shadow-lg`, `rounded-lg` à la place du natif `rounded-4xl` du Card)
   - Backgrounds inline qui ignorent les CSS variables

3. **Tokens de thème uniquement** — Pour toute couleur, utiliser exclusivement les tokens du preset :
   - Couleurs : `bg-primary`, `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border-border`, `bg-destructive`, etc.
   - Radius : laisser les composants gérer (sinon `rounded-2xl`, `rounded-3xl`, `rounded-4xl`)
   - Shadow : `shadow-md` / `shadow-xl` ou laisser le composant

4. **Personnalisation du thème** — Si un module doit honorer une palette utilisateur (ex: bandeau cookies custom theme), **override les CSS variables shadcn** (`--primary`, `--background`, `--foreground`, `--border`, `--card`, etc.) sur un wrapper via `style={{}}` — jamais en injectant des couleurs hex sur les éléments individuels.

5. **Dark mode** — Appliquer la classe `dark` sur un wrapper (le `@custom-variant dark` du preset s'occupe du reste).

6. **Ajout d'un composant shadcn manquant** — `npx shadcn@latest add <component>` plutôt que de l'écrire à la main.

### Anti-patterns à éviter

```tsx
// ❌ MAUVAIS — styles en dur, pas de Card shadcn
<div className="bg-white rounded-lg shadow-sm border p-6">
  <h2 className="text-emerald-600 font-bold">Titre</h2>
  <button className="bg-teal-500 text-white px-4 py-2 rounded">Action</button>
</div>

// ✅ BON — composants shadcn + tokens
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

```tsx
// ❌ MAUVAIS — couleur hex inline sur le rendu
<div style={{ borderColor: '#10b981', backgroundColor: '#ffffff' }}>

// ✅ BON — override des CSS variables shadcn sur le wrapper
<div style={{ ['--primary' as never]: userPrimaryHex }}>
  <Button>...</Button>  {/* Le bouton utilise var(--primary) automatiquement */}
</div>
```

## Text Domain

Use `werocket-tools` for all translatable strings:
```php
__('Text', 'werocket-tools')
esc_html__('Text', 'werocket-tools')
```
