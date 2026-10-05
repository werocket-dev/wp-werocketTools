<?php
/**
 * Réorganisation du menu d'administration : ordre, noms, éléments masqués,
 * espaces et titres de section. S'applique à tous les utilisateurs.
 *
 * L'ordre passe par l'API officielle (custom_menu_order / menu_order) :
 * les menus absents de la configuration — ajoutés plus tard par une autre
 * extension — sont placés par WordPress en bas de la liste.
 *
 * Les titres de section ne sont PAS des séparateurs WordPress : le cœur
 * supprime les séparateurs adjacents (wp-admin/includes/menu.php), un titre
 * placé après un espace disparaîtrait. Ce sont des entrées de menu rendues
 * comme un intitulé (styles + petit script en pied de page).
 */

namespace WeRocket\Tools\Modules\General;

class MenuCustomizer {

    private const OWN_SLUG       = 'werocket-tools';
    private const SPACE_PREFIX   = 'separator-wr-';
    private const HEADING_PREFIX = 'werocket-heading-';

    /** Menu d'origine (avant personnalisation), exposé à l'éditeur React. */
    private static ?array $snapshot = null;

    /** @var array<int, array<string, mixed>> */
    private array $items;

    public function __construct(array $items) {
        $this->items = $items;
    }

    /** Capture le menu tel que construit par WordPress et les extensions, juste avant nos changements. */
    public static function register_snapshot(): void {
        add_action('admin_menu', [self::class, 'capture'], PHP_INT_MAX - 1);
    }

    public static function capture(): void {
        global $menu, $submenu;

        $sorted = (array) $menu;
        uksort($sorted, 'strnatcasecmp'); // Même tri que wp-admin/includes/menu.php.

        self::$snapshot = [];
        foreach ($sorted as $entry) {
            $slug = (string) ($entry[2] ?? '');
            if (str_contains((string) ($entry[4] ?? ''), 'wp-menu-separator')) {
                self::$snapshot[] = ['type' => 'separator', 'slug' => $slug];
                continue;
            }
            // WordPress nettoie ensuite le menu (wp-admin/includes/menu.php) :
            // sous-menu unique identique au parent retiré, puis menu sans
            // sous-menu et sans droit d'accès supprimé (ex. « Liens » quand le
            // gestionnaire de liens est désactivé). Même règle ici.
            $subs  = (array) ($submenu[$slug] ?? []);
            $first = reset($subs);
            if (count($subs) === 1 && is_array($first) && ($first[2] ?? null) === $slug) {
                $subs = [];
            }
            if (!$subs && !current_user_can((string) ($entry[1] ?? 'read'))) {
                continue;
            }
            self::$snapshot[] = [
                'type'     => 'menu',
                'slug'     => $slug,
                'title'    => self::clean_title((string) ($entry[0] ?? '')),
                'icon'     => (string) ($entry[6] ?? ''),
                'submenus' => count($subs),
            ];
        }
    }

    public static function snapshot(): array {
        return self::$snapshot ?? [];
    }

    public function register(): void {
        if (!$this->items) {
            return;
        }
        add_action('admin_menu', [$this, 'apply'], PHP_INT_MAX);
        add_filter('custom_menu_order', '__return_true', PHP_INT_MAX);
        add_filter('menu_order', [$this, 'order'], PHP_INT_MAX);
        add_action('admin_head', [$this, 'print_styles']);
        add_action('admin_footer', [$this, 'print_script']);
    }

    public function apply(): void {
        global $menu;

        $positions = [];
        foreach ((array) $menu as $pos => $entry) {
            $positions[(string) ($entry[2] ?? '')] = $pos;
        }

        $kept_separators = [];
        foreach ($this->items as $item) {
            switch ($item['type']) {
                case 'menu':
                    $pos = $positions[$item['slug']] ?? null;
                    if ($pos === null) {
                        break;
                    }
                    if (!empty($item['hidden']) && $item['slug'] !== self::OWN_SLUG) {
                        unset($menu[$pos]);
                    } elseif (($item['label'] ?? '') !== '') {
                        // On garde les pastilles (commentaires en attente, mises à jour…).
                        $menu[$pos][0] = esc_html($item['label']) . self::bubble((string) $menu[$pos][0]);
                    }
                    break;

                case 'space':
                    if (isset($positions[$item['id']])) {
                        $kept_separators[] = $item['id']; // Séparateur WordPress d'origine.
                    } else {
                        $menu[] = ['', 'read', self::SPACE_PREFIX . $item['id'], '', 'wp-menu-separator'];
                    }
                    break;

                case 'heading':
                    $menu[] = [
                        esc_html((string) ($item['label'] ?? '')),
                        'read',
                        self::HEADING_PREFIX . $item['id'],
                        '',
                        'menu-top werocket-menu-heading',
                        self::HEADING_PREFIX . $item['id'],
                        'none',
                    ];
                    break;
            }
        }

        // Séparateurs d'origine supprimés dans l'éditeur.
        foreach ((array) $menu as $pos => $entry) {
            $slug = (string) ($entry[2] ?? '');
            if (str_contains((string) ($entry[4] ?? ''), 'wp-menu-separator')
                && !str_starts_with($slug, self::SPACE_PREFIX)
                && !in_array($slug, $kept_separators, true)) {
                unset($menu[$pos]);
            }
        }
    }

    /** @param array<int, string> $order */
    public function order($order): array {
        $wanted = [];
        foreach ($this->items as $item) {
            if ($item['type'] === 'menu') {
                $wanted[] = $item['slug'];
            } elseif ($item['type'] === 'heading') {
                $wanted[] = self::HEADING_PREFIX . $item['id'];
            } else {
                $wanted[] = in_array($item['id'], (array) $order, true) ? $item['id'] : self::SPACE_PREFIX . $item['id'];
            }
        }
        return $wanted;
    }

    public function print_styles(): void {
        ?>
<style id="werocket-menu-headings">
#adminmenu li.werocket-menu-heading { pointer-events: none; }
#adminmenu li.werocket-menu-heading .wp-menu-image { display: none; }
#adminmenu li.werocket-menu-heading .wp-menu-name { padding: 12px 10px 4px 12px; font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #8c8f94; }
.folded #adminmenu li.werocket-menu-heading { display: none; }
</style>
        <?php
    }

    /** Les titres de section sont des intitulés, pas des liens. */
    public function print_script(): void {
        ?>
<script id="werocket-menu-headings-js">
document.querySelectorAll('#adminmenu li.werocket-menu-heading > a').forEach(function (a) {
    var div = document.createElement('div');
    div.className = a.className;
    div.innerHTML = a.innerHTML;
    a.replaceWith(div);
});
</script>
        <?php
    }

    private static function clean_title(string $title): string {
        $title = (string) preg_replace('/\s*<span\b.*$/s', '', $title);
        return trim(html_entity_decode(wp_strip_all_tags($title), ENT_QUOTES, 'UTF-8'));
    }

    private static function bubble(string $title): string {
        return preg_match('/\s*<span\b.*$/s', $title, $m) ? $m[0] : '';
    }
}
