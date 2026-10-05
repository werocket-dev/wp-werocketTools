<?php
/**
 * Réorganisation du menu d'administration : ordre, noms, éléments masqués,
 * espaces et titres de section. S'applique à tous les utilisateurs.
 *
 * Tout passe par le filtre `custom_menu_order`, que WordPress applique après
 * avoir trié et nettoyé le menu (menus inaccessibles retirés…) : la capture
 * de l'éditeur voit donc exactement le menu d'origine affiché, et nos
 * changements profitent ensuite de l'API officielle `menu_order` — les menus
 * absents de la configuration (ajoutés plus tard par une autre extension)
 * sont placés par WordPress en bas de la liste.
 *
 * Les titres de section ne sont PAS des séparateurs WordPress : le cœur
 * supprime les séparateurs adjacents (wp-admin/includes/menu.php), un titre
 * placé après un espace disparaîtrait. Ce sont des entrées de menu rendues
 * comme un intitulé (styles + petit script en pied de page).
 */

namespace WeRocket\Tools\Modules\General;

class MenuCustomizer {

    /** Menu du plugin : toujours visible, sinon plus d'accès à ces réglages. */
    public const OWN_SLUG = 'werocket-tools';

    private const SPACE_PREFIX   = 'separator-wr-';
    private const HEADING_PREFIX = 'werocket-heading-';
    /** Pastilles ajoutées au titre (commentaires en attente, mises à jour…). */
    private const BUBBLE_PATTERN = '/\s*<span\b.*$/s';

    /** @var array<int, array<string, mixed>> */
    private array $items;

    /** Menu d'origine (avant personnalisation), exposé à l'éditeur React. */
    private array $snapshot = [];

    public function __construct(array $items) {
        $this->items = $items;
    }

    /** @param bool $capture Mémoriser le menu d'origine (page du plugin uniquement). */
    public function register(bool $capture): void {
        if ($capture) {
            add_filter('custom_menu_order', [$this, 'capture'], 0);
        }
        if (!$this->items) {
            return;
        }
        add_filter('custom_menu_order', [$this, 'apply'], PHP_INT_MAX);
        add_filter('menu_order', [$this, 'order'], PHP_INT_MAX);

        if (array_filter($this->items, static fn(array $item): bool => $item['type'] === 'heading')) {
            add_action('admin_head', [$this, 'print_styles']);
            add_action('admin_footer', [$this, 'print_script']);
        }
    }

    public function snapshot(): array {
        return $this->snapshot;
    }

    /** @param mixed $custom Valeur du filtre, rendue telle quelle. */
    public function capture($custom) {
        global $menu, $submenu;

        foreach ((array) $menu as $entry) {
            $slug = (string) ($entry[2] ?? '');
            $this->snapshot[] = self::is_separator($entry)
                ? ['type' => 'separator', 'slug' => $slug]
                : [
                    'type'     => 'menu',
                    'slug'     => $slug,
                    'title'    => self::clean_title((string) ($entry[0] ?? '')),
                    'icon'     => (string) ($entry[6] ?? ''),
                    'submenus' => count($submenu[$slug] ?? []),
                ];
        }
        return $custom;
    }

    /** Applique noms, masquages et séparateurs, puis active le tri personnalisé. */
    public function apply($custom): bool {
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
                    if (!empty($item['hidden'])) {
                        unset($menu[$pos]);
                    } elseif (($item['label'] ?? '') !== '') {
                        $bubble        = preg_match(self::BUBBLE_PATTERN, (string) $menu[$pos][0], $m) ? $m[0] : '';
                        $menu[$pos][0] = esc_html($item['label']) . $bubble;
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
            if (self::is_separator($entry)
                && !str_starts_with($slug, self::SPACE_PREFIX)
                && !in_array($slug, $kept_separators, true)) {
                unset($menu[$pos]);
            }
        }

        return true;
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

    private static function is_separator(array $entry): bool {
        return str_contains((string) ($entry[4] ?? ''), 'wp-menu-separator');
    }

    private static function clean_title(string $title): string {
        $title = (string) preg_replace(self::BUBBLE_PATTERN, '', $title);
        return trim(html_entity_decode(wp_strip_all_tags($title), ENT_QUOTES, 'UTF-8'));
    }
}
