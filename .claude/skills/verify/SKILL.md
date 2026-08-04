---
name: verify
description: Piloter le plugin WeRocket Tools en runtime (front, admin React, API REST) sur le site Local by Flywheel, pour vérifier un changement par observation. Utiliser quand il faut prouver qu'une modification fonctionne réellement, pas seulement qu'elle compile.
---

# Vérifier WeRocket Tools en runtime

Site Local by Flywheel : **https://werocket-tools.local/** (certificat auto-signé →
toujours `curl -k` / `--ignore-certificate-errors`).

## Setup

```bash
npm run build     # obligatoire : PHP lit dist/.vite/manifest.json
```

Sans build après une modif de `src/`, l'app sert les anciens assets.

**OPcache est actif** (`validate_timestamps=1`, `revalidate_freq=2`) : après une
édition PHP, attendre ~2 s avant de tester, sinon l'ancien opcode est servi.

## Surfaces

| Changement | Où l'observer |
|---|---|
| Widgets front (avis, badge, cookies) | pages du site, en pixels |
| Admin React | `wp-admin/admin.php?page=werocket-tools&tab=<id>` |
| Settings / modules | API REST `werocket/v1/*` |

Tabs admin : `dashboard`, `cookies`, `google_reviews`, `retractation`,
`click_collect`, `company_info` (le routage lit `?tab=`, cf. `App.tsx:getTab`).

Point de montage admin : `#werocket-admin-root` (dans le PHP) ; `#werocket-app`
est le div rendu **par React à l'intérieur** — c'est lui que ciblent les
sélecteurs CSS de `_tw-base.css`.

## Handle : session admin + nonce REST

L'API REST par cookie exige **aussi** `X-WP-Nonce`. Deux pièges :
le nonce doit être généré dans le contexte d'une session **déjà établie**, et
re-appeler `wp_set_auth_cookie()` change le session token, donc invalide le
nonce qu'on vient de créer. D'où le `if (!is_user_logged_in())`.

Script à poser dans le webroot (`app/public/`), **à supprimer après usage** :

```php
<?php // wr-verify-login.php
require_once __DIR__ . '/wp-load.php';
if (($_GET['t'] ?? '') !== 'UN_TOKEN_ALEATOIRE') { status_header(403); exit('forbidden'); }
if (!is_user_logged_in()) {
    $u = get_users(['role' => 'administrator', 'number' => 1]);
    wp_set_current_user($u[0]->ID);
    wp_set_auth_cookie($u[0]->ID, true);
}
header('Content-Type: application/json');
echo wp_json_encode(['nonce' => wp_create_nonce('wp_rest')]);
```

```bash
curl -sk -c cookies.txt "https://werocket-tools.local/wr-verify-login.php?t=TOK" >/dev/null
NONCE=$(curl -sk -b cookies.txt "https://werocket-tools.local/wr-verify-login.php?t=TOK" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['nonce'])")
curl -sk -b cookies.txt -H "X-WP-Nonce: $NONCE" \
  "https://werocket-tools.local/wp-json/werocket/v1/modules"
```

## Écrire des settings — sauvegarder d'abord

Le body **doit** être `{"settings": {...}}`. Un body à plat est accepté sans
erreur : `$data` vaut `[]`, tous les champs retombent aux défauts et la réponse
dit quand même « Paramètres enregistrés ». On écrase les réglages réels du site
sans le voir. Toujours :

```bash
curl -sk -b cookies.txt -H "X-WP-Nonce: $NONCE" \
  ".../werocket/v1/settings/<id>" > backup-<id>.json   # avant
# ... tests ...
# puis re-PUT backup-<id>.json['settings'] à l'identique
```

Envoyer le payload **complet** (les champs absents sont réinitialisés).

## Captures navigateur

Chrome headless ne rend pas toujours la main sur les pages du plugin (le
`MutationObserver` de `reviews/main.tsx` garde la page active) : `--dump-dom` et
`--screenshot` peuvent bloquer. Lancer en arrière-plan et attendre le fichier :

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --no-sandbox --ignore-certificate-errors \
  --no-first-run --user-data-dir="$SP/chrome-profile" --virtual-time-budget=9000 \
  --window-size=1500,1100 --screenshot="$SP/out.png" "$URL" >/dev/null 2>&1 &
CH=$!; for i in $(seq 1 35); do [ -s "$SP/out.png" ] && break; sleep 1; done; kill $CH
```

Pour l'admin authentifié : faire visiter `wr-verify-login.php` par Chrome avec
un `--user-data-dir` **persistant** ; le cookie (`remember = true`) est écrit
dans `Default/Cookies` et réutilisé aux lancements suivants. Supprimer
`$PROFILE/Singleton*` entre deux lancements.

## Compter les requêtes REST côté serveur

Plus fiable que d'instrumenter `fetch`. mu-plugin temporaire :

```php
<?php // wp-content/mu-plugins/wr-verify-counter.php
add_filter('rest_pre_dispatch', function ($r, $s, $req) {
    if (strpos($req->get_route(), '/werocket/v1/reviews') === 0) {
        file_put_contents(WP_CONTENT_DIR . '/wr-verify-hits.log',
            date('H:i:s') . ' ' . $req->get_route() . "\n", FILE_APPEND);
    }
    return $r;
}, 10, 3);
```

## Appeler du code interne (membres protected)

Étendre la classe dans une sonde webroot plutôt que de deviner le comportement :

```php
final class WrProbe extends \WeRocket\Tools\Modules\AbstractModule {
    protected string $id='p'; protected string $name='p'; protected string $description='';
    protected string $icon=''; protected string $option_key='wr_probe_never_saved';
    public function init(): void {} public function render_settings(): void {}
    protected function get_default_settings(): array { return []; }
    protected function sanitize_settings(array $d): array { return $d; }
    public static function c(mixed $v, string $fb=''): string { return self::sanitize_hex_color($v, $fb); }
}
```

## Flux qui valent d'être pilotés

- **Scan de cookies** (`CookieCatalog`) — `POST cookies/scan/start` renvoie la clé
  **`id`** (pas `scan_id`), à repasser *sous* le nom `scan_id` dans `report` /
  `finalize`. Dans `report`, `localStorage` / `sessionStorage` / `resources`
  attendent des **objets** (`{key, value_sample}`, `{domain}`), pas des chaînes —
  une liste de chaînes est ignorée en silence et les résultats sortent vides.
  Cookies de test qui matchent le catalogue : `_ga`, `_fbp`, `_gcl_au` ;
  domaines : `www.google-analytics.com`, `connect.facebook.net`.
- **Save `company_info`** — vérifier que le CPT miroir `werocket_company` suit
  (métas préfixées `_werocket_`). Un cache de settings non invalidé au save
  laisse le CPT sur les valeurs d'avant.
- **Clic & Collect** — `/panier/` avec un produit pour déclencher
  `ShippingMethod::calculate_shipping()`. Panier vide → `/commander/` renvoie 302
  et la méthode n'est jamais appelée.

## Nettoyage

Toujours retirer `app/public/wr-verify-*.php`,
`wp-content/mu-plugins/wr-verify-counter.php` et `wp-content/wr-verify-hits.log`.
