<?php
/**
 * Module Général — réglages du site et de l'administration WordPress :
 *  - URL de connexion personnalisée (masque wp-login.php et wp-admin) ;
 *  - réorganisation du menu d'administration.
 */

namespace WeRocket\Tools\Modules\General;

use WeRocket\Tools\Modules\AbstractModule;

class GeneralModule extends AbstractModule {

    public const REDIRECT_MODES = ['404', 'home', 'page'];

    /** Mots trop prévisibles pour une adresse de connexion. */
    private const OBVIOUS_SLUGS = [
        'login', 'log-in', 'signin', 'sign-in', 'admin', 'administrator', 'administration',
        'connexion', 'connect', 'dashboard', 'backend', 'wp', 'wp-admin', 'wp-login', 'wp-login-php',
    ];

    /** Chemins déjà utilisés par WordPress. */
    private const RESERVED_SLUGS = [
        'wp-content', 'wp-includes', 'wp-json', 'feed', 'comments', 'search', 'page', 'author',
        'category', 'tag', 'embed', 'trackback', 'sitemap', 'wp-sitemap', 'xmlrpc', 'index',
    ];

    protected string $id = 'general';
    protected string $name = 'Général';
    protected string $description = 'URL de connexion personnalisée et réorganisation du menu d\'administration WordPress.';
    protected string $icon = '';
    protected string $option_key = 'werocket_general_settings';

    public function init(): void {
        $settings = $this->get_settings();
        LoginUrl::boot($settings);
        new RestApi();

        if (!is_admin()) {
            return;
        }
        // Le menu d'origine n'est utile qu'à l'éditeur, sur la page du plugin.
        $on_plugin_page = sanitize_key((string) ($_GET['page'] ?? '')) === MenuCustomizer::OWN_SLUG;
        $menu = new MenuCustomizer($settings['menu_items']);
        $menu->register($on_plugin_page);

        if ($on_plugin_page) {
            add_filter('werocket_tools_admin_data', static fn(array $data): array => $data + [
                'general' => ['menuSnapshot' => $menu->snapshot(), 'loginPrefix' => LoginUrl::prefix()],
            ]);
        }
    }

    /** Ajoute l'URL de connexion calculée (lecture seule, ignorée à l'enregistrement). */
    public function get_settings(): array {
        $settings = parent::get_settings();
        $settings['login_url'] = $settings['login_slug'] !== '' ? LoginUrl::login_url_for($settings['login_slug']) : '';
        return $settings;
    }

    public function render_settings(): void {
        // Délégué à l'UI React via #werocket-admin-root
    }

    protected function get_default_settings(): array {
        return [
            'login_enabled'       => false,
            'login_slug'          => '',
            'login_redirect'      => '404',
            'login_redirect_page' => 0,
            'login_notify'        => true,
            'login_keep_session'  => true,
            'menu_items'          => [],
        ];
    }

    protected function sanitize_settings(array $data): array {
        $slug     = sanitize_title((string) ($data['login_slug'] ?? ''));
        $redirect = (string) ($data['login_redirect'] ?? '404');

        return [
            // Jamais activé sans adresse valide : ce serait un verrouillage du site.
            'login_enabled'       => !empty($data['login_enabled']) && self::validate_login_slug($slug) === '',
            'login_slug'          => $slug,
            'login_redirect'      => in_array($redirect, self::REDIRECT_MODES, true) ? $redirect : '404',
            'login_redirect_page' => absint($data['login_redirect_page'] ?? 0),
            'login_notify'        => !empty($data['login_notify']),
            'login_keep_session'  => !empty($data['login_keep_session']),
            'menu_items'          => self::sanitize_menu_items((array) ($data['menu_items'] ?? [])),
        ];
    }

    /**
     * Après enregistrement d'une nouvelle adresse : email aux administrateurs
     * et, si demandé, fin de la session courante (reconnexion via la nouvelle URL).
     */
    public function save_settings(array $data): bool {
        $before = $this->get_settings();
        $result = parent::save_settings($data);
        $after  = $this->get_settings();

        $address_changed = $after['login_enabled']
            && (!$before['login_enabled'] || $before['login_slug'] !== $after['login_slug']);

        if ($result && $address_changed) {
            if ($after['login_notify']) {
                $this->notify_admins($after['login_url']);
            }
            if (!$after['login_keep_session']) {
                wp_destroy_current_session();
                wp_clear_auth_cookie();
            }
        }

        return $result;
    }

    /**
     * Retourne '' si l'adresse est utilisable, sinon la raison du refus.
     */
    public static function validate_login_slug(string $slug): string {
        if ($slug === '') {
            return __('Saisissez une adresse.', 'werocket-tools');
        }
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            return __('Lettres minuscules, chiffres et tirets uniquement.', 'werocket-tools');
        }
        if (strlen($slug) < 4) {
            return __('Au moins 4 caractères.', 'werocket-tools');
        }
        if (in_array($slug, self::OBVIOUS_SLUGS, true)) {
            return __('Trop évidente : choisissez une adresse moins prévisible.', 'werocket-tools');
        }
        $reserved = array_merge(self::RESERVED_SLUGS, array_filter([
            trim((string) get_option('category_base'), '/'),
            trim((string) get_option('tag_base'), '/'),
        ]));
        if (in_array($slug, $reserved, true)) {
            return __('Adresse réservée par WordPress.', 'werocket-tools');
        }
        if (get_page_by_path($slug, OBJECT, get_post_types(['public' => true]))) {
            return __('Un contenu de votre site utilise déjà cette adresse.', 'werocket-tools');
        }
        return '';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function sanitize_menu_items(array $items): array {
        $clean = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $type = $item['type'] ?? '';
            if ($type === 'menu') {
                $slug = sanitize_text_field((string) ($item['slug'] ?? ''));
                if ($slug === '') {
                    continue;
                }
                $clean[] = [
                    'type'   => 'menu',
                    'slug'   => $slug,
                    'label'  => mb_substr(sanitize_text_field((string) ($item['label'] ?? '')), 0, 60),
                    // Le menu du plugin reste toujours visible : sinon plus d'accès à ces réglages.
                    'hidden' => !empty($item['hidden']) && $slug !== MenuCustomizer::OWN_SLUG,
                ];
            } elseif ($type === 'space' || $type === 'heading') {
                $id = sanitize_key((string) ($item['id'] ?? ''));
                if ($id === '') {
                    continue;
                }
                $entry = ['type' => $type, 'id' => $id];
                if ($type === 'heading') {
                    $entry['label'] = mb_substr(sanitize_text_field((string) ($item['label'] ?? '')), 0, 40);
                }
                $clean[] = $entry;
            }
        }
        return $clean;
    }

    private function notify_admins(string $login_url): void {
        $admins = get_users(['role' => 'administrator', 'fields' => ['user_email']]);
        $emails = array_filter(array_map(static fn($u) => $u->user_email, $admins), 'is_email');
        if (!$emails) {
            return;
        }

        $site = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
        wp_mail(
            $emails,
            /* translators: %s: site name */
            sprintf(__('[%s] Nouvelle adresse de connexion', 'werocket-tools'), $site),
            sprintf(
                /* translators: 1: site name, 2: login URL */
                __("Bonjour,\n\nL'adresse de connexion à l'administration de %1\$s a changé. Utilisez désormais :\n\n%2\$s\n\nLes anciennes adresses /wp-login.php et /wp-admin ne sont plus accessibles aux visiteurs non connectés.\n\nConservez cet email.", 'werocket-tools'),
                $site,
                $login_url
            )
        );
    }
}
