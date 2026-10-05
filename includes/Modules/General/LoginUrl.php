<?php
/**
 * URL de connexion personnalisée.
 *
 * Sert wp-login.php sous /{slug}, réécrit toutes les URL générées par
 * WordPress (connexion, déconnexion, mot de passe oublié, emails de
 * réinitialisation…) et répond aux accès directs à /wp-login.php ainsi
 * qu'à /wp-admin (visiteurs non connectés) selon le réglage : page 404,
 * redirection vers l'accueil ou vers une page.
 *
 * Secours en cas d'oubli : renommer le dossier du plugin par FTP, ou
 * définir WEROCKET_DISABLE_CUSTOM_LOGIN à true dans wp-config.php.
 */

namespace WeRocket\Tools\Modules\General;

class LoginUrl {

    private string $slug;
    private string $mode;
    private int $page_id;

    private function __construct(string $slug, string $mode, int $page_id) {
        $this->slug    = $slug;
        $this->mode    = $mode;
        $this->page_id = $page_id;
    }

    public static function boot(array $settings): void {
        if (defined('WEROCKET_DISABLE_CUSTOM_LOGIN') && WEROCKET_DISABLE_CUSTOM_LOGIN) {
            return;
        }
        // Le réseau multisite a ses propres URL de connexion par site : non géré.
        if (is_multisite() || empty($settings['login_enabled']) || ($settings['login_slug'] ?? '') === '') {
            return;
        }

        $instance = new self(
            (string) $settings['login_slug'],
            (string) ($settings['login_redirect'] ?? '404'),
            (int) ($settings['login_redirect_page'] ?? 0)
        );
        $instance->hooks();
    }

    /** URL publique de connexion pour une adresse donnée. */
    public static function login_url_for(string $slug, ?string $scheme = null): string {
        return get_option('permalink_structure')
            ? trailingslashit(home_url($slug, $scheme))
            : home_url('?' . $slug, $scheme);
    }

    private function hooks(): void {
        add_action('wp_loaded', [$this, 'route'], 1);

        foreach (['site_url', 'network_site_url', 'wp_redirect'] as $filter) {
            add_filter($filter, [$this, 'rewrite_url'], 10, 1);
        }

        // WordPress redirige /login, /admin et /dashboard vers les anciennes
        // adresses : ce serait les révéler.
        remove_action('template_redirect', 'wp_redirect_admin_locations', 1000);
    }

    public function route(): void {
        if ($this->is_new_login_request()) {
            $this->serve_login();
        }

        if ($this->is_old_login_request() || ($this->is_admin_request() && !is_user_logged_in())) {
            $this->deny();
        }
    }

    /** Remplace wp-login.php par la nouvelle adresse dans une URL générée par WordPress. */
    public function rewrite_url($url) {
        if (!is_string($url) || !str_contains($url, 'wp-login.php')) {
            return $url;
        }

        [$path, $query] = array_pad(explode('?', $url, 2), 2, '');
        if (!str_ends_with($path, 'wp-login.php')) {
            return $url;
        }

        $scheme  = wp_parse_url($url, PHP_URL_SCHEME);
        $new_url = self::login_url_for($this->slug, is_string($scheme) ? $scheme : null);
        if ($query === '') {
            return $new_url;
        }

        parse_str($query, $args);
        return add_query_arg(array_map(
            static fn($v) => is_string($v) ? rawurlencode($v) : $v,
            $args
        ), $new_url);
    }

    private function request_path(): string {
        $uri  = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = (string) wp_parse_url(rawurldecode($uri), PHP_URL_PATH);
        return untrailingslashit($path);
    }

    private function home_path(): string {
        return untrailingslashit((string) wp_parse_url(home_url(), PHP_URL_PATH));
    }

    private function is_new_login_request(): bool {
        if (get_option('permalink_structure')) {
            return $this->request_path() === $this->home_path() . '/' . $this->slug;
        }
        // Permaliens simples : /?{slug} sur la page d'accueil.
        return isset($_GET[$this->slug]) && in_array($this->request_path(), [$this->home_path(), $this->home_path() . '/index.php'], true);
    }

    private function is_old_login_request(): bool {
        global $pagenow;
        return $pagenow === 'wp-login.php' || basename($this->request_path()) === 'wp-login.php';
    }

    private function is_admin_request(): bool {
        global $pagenow;
        return is_admin()
            && !wp_doing_ajax()
            && !(defined('WP_CLI') && WP_CLI)
            && $pagenow !== 'admin-post.php';
    }

    private function serve_login(): void {
        // wp-login.php s'appuie sur ces globales (login_header()…) : inclus
        // depuis une méthode, ses variables seraient sinon locales.
        global $pagenow, $error, $interim_login, $action, $user_login, $errors, $redirect_to;
        $pagenow = 'wp-login.php';
        require_once ABSPATH . 'wp-login.php';
        exit;
    }

    private function deny(): void {
        if ($this->mode === 'home') {
            wp_safe_redirect(home_url('/'));
            exit;
        }
        if ($this->mode === 'page' && $this->page_id && get_post_status($this->page_id) === 'publish') {
            wp_safe_redirect((string) get_permalink($this->page_id));
            exit;
        }

        // /wp-admin : le thème ne peut pas être rendu dans le contexte admin,
        // on renvoie vers /wp-login.php qui, lui, affiche la 404 du thème.
        // Sans retirer notre filtre, wp_redirect réécrirait la cible vers la
        // nouvelle adresse… et la révélerait.
        if (is_admin()) {
            remove_filter('wp_redirect', [$this, 'rewrite_url']);
            wp_safe_redirect(home_url('/wp-login.php'));
            exit;
        }
        $this->render_404();
    }

    private function render_404(): void {
        global $pagenow, $wp_query;
        $pagenow = 'index.php';
        if (!defined('WP_USE_THEMES')) {
            define('WP_USE_THEMES', true);
        }

        wp();
        if (!is_404()) {
            $wp_query->set_404();
        }
        status_header(404);
        nocache_headers();
        require_once ABSPATH . WPINC . '/template-loader.php';
        exit;
    }
}
