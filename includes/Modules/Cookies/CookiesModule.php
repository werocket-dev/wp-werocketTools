<?php
/**
 * Cookies Management Module
 */

namespace WeRocket\Tools\Modules\Cookies;

use WeRocket\Tools\Modules\AbstractModule;

class CookiesModule extends AbstractModule {

    protected string $id = 'cookies';
    protected string $name = 'Gestion des Cookies';
    protected string $description = 'Bandeau de consentement RGPD et gestion des cookies';
    protected string $icon = '<svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    protected string $option_key = 'werocket_cookies_settings';

    public function init(): void {
        if (!is_admin()) {
            add_action('wp_footer', [$this, 'render_cookie_banner']);
            add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        }
    }

    public function render_settings(): void {
        $settings = $this->get_settings();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/cookies-settings.php';
    }

    protected function get_default_settings(): array {
        return [
            'banner_title' => 'Gestion des cookies',
            'banner_message' => 'Nous utilisons des cookies pour améliorer votre expérience sur notre site.',
            'accept_button_text' => 'Accepter tout',
            'reject_button_text' => 'Refuser',
            'customize_button_text' => 'Personnaliser',
            'privacy_policy_url' => '',
            'banner_position' => 'bottom',
            'banner_style' => 'bar',
            'primary_color' => '#059669',
            'categories' => [
                'necessary' => [
                    'label' => 'Cookies nécessaires',
                    'description' => 'Ces cookies sont essentiels au fonctionnement du site.',
                    'required' => true,
                ],
                'analytics' => [
                    'label' => 'Cookies analytiques',
                    'description' => 'Ces cookies nous permettent d\'analyser le trafic du site.',
                    'required' => false,
                ],
                'marketing' => [
                    'label' => 'Cookies marketing',
                    'description' => 'Ces cookies sont utilisés pour le suivi publicitaire.',
                    'required' => false,
                ],
            ],
        ];
    }

    protected function sanitize_settings(array $data): array {
        return [
            'banner_title' => sanitize_text_field($data['banner_title'] ?? ''),
            'banner_message' => wp_kses_post($data['banner_message'] ?? ''),
            'accept_button_text' => sanitize_text_field($data['accept_button_text'] ?? ''),
            'reject_button_text' => sanitize_text_field($data['reject_button_text'] ?? ''),
            'customize_button_text' => sanitize_text_field($data['customize_button_text'] ?? ''),
            'privacy_policy_url' => esc_url_raw($data['privacy_policy_url'] ?? ''),
            'banner_position' => sanitize_key($data['banner_position'] ?? 'bottom'),
            'banner_style' => sanitize_key($data['banner_style'] ?? 'bar'),
            'primary_color' => sanitize_hex_color($data['primary_color'] ?? '#4F46E5'),
            'categories' => $this->sanitize_categories($data['categories'] ?? []),
        ];
    }

    private function sanitize_categories(array $categories): array {
        $sanitized = [];
        foreach ($categories as $key => $category) {
            $sanitized[sanitize_key($key)] = [
                'label' => sanitize_text_field($category['label'] ?? ''),
                'description' => sanitize_text_field($category['description'] ?? ''),
                'required' => !empty($category['required']),
            ];
        }
        return $sanitized;
    }

    public function enqueue_frontend_assets(): void {
        wp_enqueue_style(
            'werocket-cookies',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/css/cookies.css',
            [],
            WEROCKET_TOOLS_VERSION
        );

        wp_enqueue_script(
            'werocket-cookies',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/js/cookies.js',
            [],
            WEROCKET_TOOLS_VERSION,
            true
        );

        wp_localize_script('werocket-cookies', 'werocketCookies', [
            'settings' => $this->get_settings(),
        ]);
    }

    public function render_cookie_banner(): void {
        $settings = $this->get_settings();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/cookies-banner.php';
    }
}
