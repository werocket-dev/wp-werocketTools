<?php
/**
 * Cookies Management Module - Klaro Integration
 *
 * Provides GDPR-compliant cookie consent with Google Consent Mode v2 support
 */

namespace WeRocket\Tools\Modules\Cookies;

use WeRocket\Tools\Admin\ViteAssets;
use WeRocket\Tools\Modules\AbstractModule;
use WeRocket\Tools\Modules\Cookies\Scanner\ScanCron;

class CookiesModule extends AbstractModule {

    protected string $id = 'cookies';
    protected string $name = 'Gestion des Cookies';
    protected string $description = 'Bandeau de consentement RGPD avec Klaro et Google Consent Mode v2';
    protected string $icon = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    protected string $option_key = 'werocket_cookies_settings';

    public function init(): void {
        if (!is_admin()) {
            add_action('wp_head', [$this, 'render_google_consent_default'], 1);
            add_action('wp_head', [$this, 'render_klaro_config'], 2);
            add_action('wp_head', [$this, 'render_klaro_script'], 3);
            add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        }

        add_shortcode('werocket_cookie_settings', [$this, 'render_cookie_settings_shortcode']);
        add_shortcode('werocket_manage_cookies', [$this, 'render_cookie_settings_shortcode']);

        ScanCron::register_hooks();
    }

    /**
     * Shortcode to display a link/button to manage cookie preferences
     * Usage: [werocket_cookie_settings] or [werocket_cookie_settings text="Gérer mes cookies" class="my-class" tag="button"]
     *
     * SECURITY: CSP-friendly — uses data-attribute + global event listener
     * (see render_klaro_script) rather than inline onclick.
     */
    public function render_cookie_settings_shortcode($atts): string {
        $atts = shortcode_atts([
            'text'  => __('Gérer mes cookies', 'werocket-tools'),
            'class' => '',
            'tag'   => 'a',
            'style' => '',
        ], $atts);

        // Whitelist tag
        $tag = in_array($atts['tag'], ['a', 'button'], true) ? $atts['tag'] : 'a';

        // Sanitize multiple classes (sanitize_html_class only handles one)
        $extra_classes = $this->sanitize_class_list($atts['class']);
        $classes = trim('werocket-cookie-settings-link ' . $extra_classes);
        $style   = !empty($atts['style']) ? ' style="' . esc_attr($atts['style']) . '"' : '';
        $text    = esc_html($atts['text']);

        if ($tag === 'button') {
            return sprintf(
                '<button type="button" class="%s" data-werocket-cookie-trigger="settings"%s>%s</button>',
                esc_attr($classes),
                $style,
                $text
            );
        }

        return sprintf(
            '<a href="#werocket-cookies-settings" class="%s" data-werocket-cookie-trigger="settings"%s>%s</a>',
            esc_attr($classes),
            $style,
            $text
        );
    }

    /**
     * Sanitize a space-separated list of CSS classes.
     */
    private function sanitize_class_list(string $value): string {
        $parts = preg_split('/\s+/', trim($value));
        $clean = array_filter(array_map('sanitize_html_class', $parts ?: []));
        return implode(' ', $clean);
    }

    /**
     * Strict domain validation. Returns '' if invalid.
     */
    private function sanitize_cookie_domain(string $domain): string {
        $domain = trim(sanitize_text_field($domain));
        if ($domain === '') return '';
        // Allow leading dot for cookie subdomains. Reject anything that's not
        // a valid hostname (letters, digits, hyphens, dots only).
        if (!preg_match('/^\.?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i', $domain)) {
            return '';
        }
        return strtolower($domain);
    }

    /**
     * Whitelist GCM region list (ISO 3166 country/subdivision codes).
     */
    private function sanitize_gcm_region(string $value): string {
        $value = trim(sanitize_text_field($value));
        if ($value === '') return '';
        $parts = array_map('trim', explode(',', $value));
        $clean = [];
        foreach ($parts as $code) {
            if (preg_match('/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/i', $code)) {
                $clean[] = strtoupper($code);
            }
        }
        return implode(',', $clean);
    }

    /**
     * Strip dangerous CSS constructs from user-supplied custom CSS.
     * Defense-in-depth: even if rendered later, blocks IE expression(),
     * MSIE behavior:, javascript: URLs and @import.
     */
    private function sanitize_custom_css(string $css): string {
        $css = wp_strip_all_tags($css);
        $css = preg_replace('/expression\s*\(/i', '', $css);
        $css = preg_replace('/behavior\s*:/i', '', $css);
        $css = preg_replace('/javascript\s*:/i', '', $css);
        $css = preg_replace('/-moz-binding/i', '', $css);
        $css = preg_replace('/@import[^;]*;?/i', '', $css);
        $css = preg_replace('/url\s*\(\s*["\']?\s*(javascript|data|vbscript):/i', 'url(', $css);
        return (string) $css;
    }

    public function render_settings(): void {
        // Rendu délégué au SPA React via #werocket-admin-root
    }

    /**
     * Override: ensure essential services (WordPress core, this plugin's own
     * consent cookie) always exist in the services list even on legacy installs
     * whose saved option pre-dates them. We only inject services whose `name`
     * isn't already present — admins can still customize or disable them.
     */
    public function get_settings(): array {
        $settings = parent::get_settings();
        $settings['services'] = $this->ensure_essential_services($settings['services'] ?? []);
        return $settings;
    }

    /**
     * Essential service names that must exist on any install. Matched against
     * services in get_default_settings() — those are the source of truth.
     */
    private const ESSENTIAL_SERVICE_NAMES = ['wordpress-core', 'werocket-consent'];

    /**
     * Inject missing essential services at the top of the list. Existing entries
     * (same `name`) are left untouched so admin customizations are preserved.
     */
    private function ensure_essential_services(array $services): array {
        $present = [];
        foreach ($services as $s) {
            if (is_array($s) && !empty($s['name'])) {
                $present[$s['name']] = true;
            }
        }

        $essentials_from_defaults = [];
        foreach ($this->get_default_settings()['services'] as $def) {
            if (in_array($def['name'] ?? '', self::ESSENTIAL_SERVICE_NAMES, true)) {
                $essentials_from_defaults[$def['name']] = $def;
            }
        }

        $missing = [];
        foreach (self::ESSENTIAL_SERVICE_NAMES as $name) {
            if (!isset($present[$name]) && isset($essentials_from_defaults[$name])) {
                $missing[] = $essentials_from_defaults[$name];
            }
        }

        if (empty($missing)) return $services;

        // Prepend essentials so they appear first in the modal.
        return array_merge($missing, $services);
    }

    protected function get_default_settings(): array {
        return [
            // General settings
            'cookie_name' => 'werocket_consent',
            'cookie_expires_days' => 365,
            'cookie_domain' => '',

            // Behavior
            'must_consent' => false, // Set to false to prevent Klaro auto-showing on load
            'accept_all' => true,
            'hide_decline_all' => false,
            'hide_learn_more' => false,
            'hide_toggle_all' => false,
            'default' => false,
            'required' => false,
            'opt_out' => false,
            'group_by_purpose' => true,
            'storage_method' => 'cookie', // cookie, localStorage

            // Appearance
            'theme' => 'light', // light, dark, custom
            'position' => 'bottom-left', // bottom-left, bottom-right, top-left, top-right, center
            'modal_trigger_position' => 'bottom-left',
            'notice_as_modal' => false,
            'flip_buttons' => false,
            'html_texts' => true,

            // Colors (custom theme)
            'color_primary' => '#059669',
            'color_primary_hover' => '#047857',
            'color_background' => '#ffffff',
            'color_text' => '#1f2937',
            'color_text_secondary' => '#6b7280',
            'color_border' => '#e5e7eb',
            'color_toggle_on' => '#059669',
            'color_toggle_off' => '#d1d5db',

            // Texts
            'texts' => [
                'notice_title' => 'Gestion des cookies',
                'notice_description' => 'Nous utilisons des cookies et technologies similaires pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. En cliquant sur "Tout accepter", vous consentez à leur utilisation.',
                'accept_all' => 'Tout accepter',
                'decline_all' => 'Tout refuser',
                'accept_selected' => 'Accepter la sélection',
                'save' => 'Enregistrer',
                'settings' => 'Personnaliser',
                'close' => 'Fermer',
                'privacy_policy' => 'Politique de confidentialité',
                'privacy_policy_url' => '',
                'imprint' => 'Mentions légales',
                'imprint_url' => '',
                'purposes_title' => 'Finalités',
                'purpose_necessary' => 'Nécessaire',
                'purpose_analytics' => 'Statistiques',
                'purpose_marketing' => 'Marketing',
                'purpose_preferences' => 'Préférences',
                'service_desc_template' => 'Ce service peut déposer {cookies} cookies.',
            ],

            // Google Consent Mode v2
            'gcm_enabled' => true,
            'gcm_default_analytics' => 'denied',
            'gcm_default_ad_storage' => 'denied',
            'gcm_default_ad_user_data' => 'denied',
            'gcm_default_ad_personalization' => 'denied',
            'gcm_default_functionality' => 'granted',
            'gcm_default_security' => 'granted',
            'gcm_wait_for_update' => 500,
            'gcm_region' => '', // Empty = all regions, or comma-separated: FR,BE,DE

            // Services/Apps
            // The first two services are "essential" and are also enforced at runtime
            // by ensure_essential_services() so they appear on legacy installs whose
            // settings were saved before they existed in the defaults.
            'services' => [
                [
                    'name' => 'wordpress-core',
                    'title' => 'WordPress',
                    'description' => "Cookies essentiels de WordPress : session admin, préférences de l'interface, cookie de test. Strictement nécessaires au fonctionnement du site.",
                    'purposes' => ['necessary'],
                    'cookies' => ['wordpress_*', 'wp-settings-*', 'wp-settings-time-*', 'wordpress_logged_in_*', 'wordpress_test_cookie', 'wordpress_sec_*', 'comment_author_*', 'comment_author_email_*', 'comment_author_url_*', 'wp_lang'],
                    'required' => true,
                    'default' => true,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => true,
                ],
                [
                    'name' => 'werocket-consent',
                    'title' => 'Préférences de consentement',
                    'description' => 'Cookie enregistrant votre choix de consentement aux cookies. Sans ce cookie, le bandeau s\'afficherait à chaque visite.',
                    'purposes' => ['necessary'],
                    'cookies' => ['werocket_consent', 'klaro'],
                    'required' => true,
                    'default' => true,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => true,
                ],
                [
                    'name' => 'google-analytics',
                    'title' => 'Google Analytics',
                    'description' => 'Service d\'analyse de trafic fourni par Google.',
                    'purposes' => ['analytics'],
                    'cookies' => ['_ga', '_gid', '_gat', '__utma', '__utmb', '__utmc', '__utmz'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => true,
                ],
                [
                    'name' => 'google-tag-manager',
                    'title' => 'Google Tag Manager',
                    'description' => 'Gestionnaire de balises Google pour le suivi et l\'analyse.',
                    'purposes' => ['analytics', 'marketing'],
                    'cookies' => ['_gcl_au'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => false,
                ],
                [
                    'name' => 'google-ads',
                    'title' => 'Google Ads',
                    'description' => 'Service publicitaire et de remarketing Google.',
                    'purposes' => ['marketing'],
                    'cookies' => ['_gcl_au', '_gcl_aw', '_gcl_dc'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => false,
                ],
                [
                    'name' => 'facebook-pixel',
                    'title' => 'Facebook Pixel',
                    'description' => 'Pixel de suivi Facebook pour le remarketing.',
                    'purposes' => ['marketing'],
                    'cookies' => ['_fbp', 'fr'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => false,
                ],
                [
                    'name' => 'hotjar',
                    'title' => 'Hotjar',
                    'description' => 'Outil d\'analyse comportementale et heatmaps.',
                    'purposes' => ['analytics'],
                    'cookies' => ['_hj*'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => false,
                ],
                [
                    'name' => 'linkedin-insight',
                    'title' => 'LinkedIn Insight',
                    'description' => 'Suivi des conversions LinkedIn.',
                    'purposes' => ['marketing'],
                    'cookies' => ['li_sugr', 'bcookie', 'lidc'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => false,
                ],
                [
                    'name' => 'youtube',
                    'title' => 'YouTube',
                    'description' => 'Intégration de vidéos YouTube.',
                    'purposes' => ['marketing'],
                    'cookies' => ['VISITOR_INFO1_LIVE', 'YSC'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => false,
                ],
                [
                    'name' => 'vimeo',
                    'title' => 'Vimeo',
                    'description' => 'Intégration de vidéos Vimeo.',
                    'purposes' => ['preferences'],
                    'cookies' => ['vuid'],
                    'required' => false,
                    'default' => false,
                    'opt_out' => false,
                    'only_once' => false,
                    'enabled' => false,
                ],
            ],

            // Purposes
            'purposes' => [
                'necessary' => [
                    'title' => 'Nécessaires',
                    'description' => 'Ces cookies sont essentiels au fonctionnement du site.',
                ],
                'analytics' => [
                    'title' => 'Statistiques',
                    'description' => 'Ces cookies nous aident à comprendre comment les visiteurs interagissent avec le site.',
                ],
                'marketing' => [
                    'title' => 'Marketing',
                    'description' => 'Ces cookies sont utilisés pour le suivi publicitaire et le remarketing.',
                ],
                'preferences' => [
                    'title' => 'Préférences',
                    'description' => 'Ces cookies permettent de mémoriser vos préférences.',
                ],
            ],

            // Advanced
            'additional_class' => '',
            'custom_css' => '',
            'callback_on_accept' => '',
            'callback_on_decline' => '',
        ];
    }

    protected function sanitize_settings(array $data): array {
        $allowed_themes      = ['light', 'dark', 'custom'];
        $allowed_positions   = ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center'];
        $allowed_storage     = ['cookie', 'localStorage'];
        $allowed_consent     = ['granted', 'denied'];

        $sanitized = [
            // General
            'cookie_name' => sanitize_key($data['cookie_name'] ?? 'werocket_consent') ?: 'werocket_consent',
            'cookie_expires_days' => max(1, min(730, absint($data['cookie_expires_days'] ?? 365))),
            'cookie_domain' => $this->sanitize_cookie_domain((string) ($data['cookie_domain'] ?? '')),

            // Behavior
            'must_consent' => !empty($data['must_consent']),
            'accept_all' => !empty($data['accept_all']),
            'hide_decline_all' => !empty($data['hide_decline_all']),
            'hide_learn_more' => !empty($data['hide_learn_more']),
            'hide_toggle_all' => !empty($data['hide_toggle_all']),
            'default' => !empty($data['default']),
            'required' => !empty($data['required']),
            'opt_out' => !empty($data['opt_out']),
            'group_by_purpose' => !empty($data['group_by_purpose']),
            'storage_method' => in_array($data['storage_method'] ?? '', $allowed_storage, true) ? $data['storage_method'] : 'cookie',

            // Appearance (strict whitelists)
            'theme' => in_array($data['theme'] ?? '', $allowed_themes, true) ? $data['theme'] : 'light',
            'position' => in_array($data['position'] ?? '', $allowed_positions, true) ? $data['position'] : 'bottom-left',
            'modal_trigger_position' => in_array($data['modal_trigger_position'] ?? '', $allowed_positions, true) ? $data['modal_trigger_position'] : 'bottom-left',
            'notice_as_modal' => !empty($data['notice_as_modal']),
            'flip_buttons' => !empty($data['flip_buttons']),
            'html_texts' => !empty($data['html_texts']),

            // Colors (sanitize_hex_color returns null on invalid → fallback)
            'color_primary' => sanitize_hex_color($data['color_primary'] ?? '') ?? '#059669',
            'color_primary_hover' => sanitize_hex_color($data['color_primary_hover'] ?? '') ?? '#047857',
            'color_background' => sanitize_hex_color($data['color_background'] ?? '') ?? '#ffffff',
            'color_text' => sanitize_hex_color($data['color_text'] ?? '') ?? '#1f2937',
            'color_text_secondary' => sanitize_hex_color($data['color_text_secondary'] ?? '') ?? '#6b7280',
            'color_border' => sanitize_hex_color($data['color_border'] ?? '') ?? '#e5e7eb',
            'color_toggle_on' => sanitize_hex_color($data['color_toggle_on'] ?? '') ?? '#059669',
            'color_toggle_off' => sanitize_hex_color($data['color_toggle_off'] ?? '') ?? '#d1d5db',

            // Texts
            'texts' => $this->sanitize_texts($data['texts'] ?? []),

            // GCM
            'gcm_enabled' => !empty($data['gcm_enabled']),
            'gcm_default_analytics' => in_array($data['gcm_default_analytics'] ?? '', $allowed_consent, true) ? $data['gcm_default_analytics'] : 'denied',
            'gcm_default_ad_storage' => in_array($data['gcm_default_ad_storage'] ?? '', $allowed_consent, true) ? $data['gcm_default_ad_storage'] : 'denied',
            'gcm_default_ad_user_data' => in_array($data['gcm_default_ad_user_data'] ?? '', $allowed_consent, true) ? $data['gcm_default_ad_user_data'] : 'denied',
            'gcm_default_ad_personalization' => in_array($data['gcm_default_ad_personalization'] ?? '', $allowed_consent, true) ? $data['gcm_default_ad_personalization'] : 'denied',
            'gcm_default_functionality' => in_array($data['gcm_default_functionality'] ?? '', $allowed_consent, true) ? $data['gcm_default_functionality'] : 'granted',
            'gcm_default_security' => in_array($data['gcm_default_security'] ?? '', $allowed_consent, true) ? $data['gcm_default_security'] : 'granted',
            'gcm_wait_for_update' => max(0, min(5000, absint($data['gcm_wait_for_update'] ?? 500))),
            'gcm_region' => $this->sanitize_gcm_region((string) ($data['gcm_region'] ?? '')),

            // Services & purposes
            'services' => $this->sanitize_services($data['services'] ?? []),
            'purposes' => $this->sanitize_purposes($data['purposes'] ?? []),

            // Advanced
            'additional_class' => $this->sanitize_class_list((string) ($data['additional_class'] ?? '')),
            'custom_css' => $this->sanitize_custom_css((string) ($data['custom_css'] ?? '')),
            // WARNING: callback_on_accept/decline contain raw JS user input.
            // They are stored after wp_strip_all_tags + length cap, but MUST NEVER
            // be echoed without esc_js() — and even then, treat as untrusted code.
            'callback_on_accept' => substr(wp_strip_all_tags((string) ($data['callback_on_accept'] ?? '')), 0, 2000),
            'callback_on_decline' => substr(wp_strip_all_tags((string) ($data['callback_on_decline'] ?? '')), 0, 2000),
        ];

        return $sanitized;
    }

    private function sanitize_texts(array $texts): array {
        $defaults = $this->get_default_settings()['texts'];
        $sanitized = [];

        foreach ($defaults as $key => $default) {
            if (in_array($key, ['privacy_policy_url', 'imprint_url'])) {
                $sanitized[$key] = esc_url_raw($texts[$key] ?? $default);
            } else {
                $sanitized[$key] = wp_kses_post($texts[$key] ?? $default);
            }
        }

        return $sanitized;
    }

    private function sanitize_services(array $services): array {
        $sanitized   = [];
        $seen_names  = [];
        $valid_purposes = ['necessary', 'analytics', 'marketing', 'preferences'];

        foreach ($services as $service) {
            if (!is_array($service) || empty($service['name'])) continue;
            $name = sanitize_key($service['name']);
            if ($name === '' || isset($seen_names[$name])) continue;
            $seen_names[$name] = true;

            // Filter purposes to whitelist
            $raw_purposes = array_map('sanitize_key', (array)($service['purposes'] ?? []));
            $purposes = array_values(array_intersect($raw_purposes, $valid_purposes));

            // Cookies : strip non-printable, cap length per entry
            $cookies = [];
            foreach ((array)($service['cookies'] ?? []) as $cookie) {
                $cookie = substr(sanitize_text_field((string) $cookie), 0, 100);
                if ($cookie !== '') $cookies[] = $cookie;
            }

            $sanitized[] = [
                'name'        => $name,
                'title'       => substr(sanitize_text_field($service['title'] ?? ''), 0, 200),
                'description' => substr(wp_kses_post($service['description'] ?? ''), 0, 1000),
                'purposes'    => $purposes,
                'cookies'     => $cookies,
                'required'    => !empty($service['required']),
                'default'     => !empty($service['default']),
                'opt_out'     => !empty($service['opt_out']),
                'only_once'   => !empty($service['only_once']),
                'enabled'     => !empty($service['enabled']),
            ];
        }

        return $sanitized;
    }

    private function sanitize_purposes(array $purposes): array {
        $sanitized = [];

        foreach ($purposes as $key => $purpose) {
            $sanitized[sanitize_key($key)] = [
                'title' => sanitize_text_field($purpose['title'] ?? ''),
                'description' => wp_kses_post($purpose['description'] ?? ''),
            ];
        }

        return $sanitized;
    }

    public function enqueue_frontend_assets(): void {
        $settings = $this->get_settings();

        wp_enqueue_style('klaro', 'https://cdn.kiprotect.com/klaro/v0.7/klaro.min.css', [], '0.7.0');
        ViteAssets::enqueue_entry('frontend/cookies/main.tsx', 'werocket-cookies');

        // Pass full settings to React banner (strip server-only callback strings)
        $config = $settings;
        unset($config['callback_on_accept'], $config['callback_on_decline']);

        add_action('wp_footer', function () use ($config): void {
            printf(
                '<div id="werocket-cookies-banner" data-config="%s"></div>',
                esc_attr(wp_json_encode($config))
            );
        }, 5);
    }

    public function render_klaro_script(): void {
        echo '<div id="werocket-klaro"></div>' . "\n";
        ?>
<style id="werocket-klaro-hide">.klaro .cookie-modal,.klaro .cookie-notice,.klaro .cookie-modal-backdrop{display:none !important}</style>
<script defer src="https://cdn.kiprotect.com/klaro/v0.7/klaro.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script>
(function(){
    var dispatch = function(name){ document.dispatchEvent(new CustomEvent(name)); };
    window.WeRocketCookies = {
        showSettings: function(){ dispatch('werocket:open-settings'); },
        showBanner:   function(){ dispatch('werocket:show-banner'); }
    };
    // CSP-friendly delegation for shortcode-rendered triggers
    document.addEventListener('click', function(e){
        var target = e.target && e.target.closest && e.target.closest('[data-werocket-cookie-trigger]');
        if (!target) return;
        e.preventDefault();
        var action = target.getAttribute('data-werocket-cookie-trigger');
        if (action === 'settings') dispatch('werocket:open-settings');
        else if (action === 'banner') dispatch('werocket:show-banner');
    });
})();
</script>
        <?php
    }

    /**
     * Render Google Consent Mode default state
     * Must be output BEFORE any Google tags
     */
    public function render_google_consent_default(): void {
        $settings = $this->get_settings();

        if (empty($settings['gcm_enabled'])) {
            return;
        }

        $region = !empty($settings['gcm_region']) ? array_map('trim', explode(',', $settings['gcm_region'])) : null;

        ?>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
    'ad_storage': '<?php echo esc_js($settings['gcm_default_ad_storage']); ?>',
    'ad_user_data': '<?php echo esc_js($settings['gcm_default_ad_user_data']); ?>',
    'ad_personalization': '<?php echo esc_js($settings['gcm_default_ad_personalization']); ?>',
    'analytics_storage': '<?php echo esc_js($settings['gcm_default_analytics']); ?>',
    'functionality_storage': '<?php echo esc_js($settings['gcm_default_functionality']); ?>',
    'security_storage': '<?php echo esc_js($settings['gcm_default_security']); ?>',
    'wait_for_update': <?php echo absint($settings['gcm_wait_for_update']); ?><?php if ($region): ?>,
    'region': <?php echo wp_json_encode($region); ?><?php endif; ?>
});
</script>
        <?php
    }

    /**
     * Render Klaro configuration
     */
    public function render_klaro_config(): void {
        $settings = $this->get_settings();
        $config = $this->build_klaro_config($settings);

        ?>
<script>
var klaroConfig = <?php echo wp_json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); ?>;

// Google Consent Mode v2 integration
<?php if (!empty($settings['gcm_enabled'])): ?>
klaroConfig.callback = function(consent, service) {
    var analyticsGranted = consent['google-analytics'] || consent['google-tag-manager'];
    var adsGranted = consent['google-ads'] || consent['google-tag-manager'];
    var marketingGranted = consent['facebook-pixel'] || consent['linkedin-insight'] || adsGranted;

    if (typeof gtag === 'function') {
        gtag('consent', 'update', {
            'analytics_storage': analyticsGranted ? 'granted' : 'denied',
            'ad_storage': adsGranted ? 'granted' : 'denied',
            'ad_user_data': marketingGranted ? 'granted' : 'denied',
            'ad_personalization': marketingGranted ? 'granted' : 'denied'
        });
    }

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('werocket_consent_update', {
        detail: { consent: consent, service: service }
    }));
};
<?php endif; ?>
</script>
        <?php
    }

    /**
     * Build Klaro configuration array
     */
    private function build_klaro_config(array $settings): array {
        $config = [
            'version' => 1,
            'elementID' => 'werocket-klaro',
            'storageMethod' => $settings['storage_method'],
            'storageName' => $settings['cookie_name'],
            'cookieExpiresAfterDays' => $settings['cookie_expires_days'],
            'cookieDomain' => $settings['cookie_domain'] ?: null,

            // Behavior
            'default' => $settings['default'],
            // Don't force mustConsent - let user control it
            // If forced to true, Klaro will auto-show its modal at page load
            'mustConsent' => !empty($settings['must_consent']),
            'acceptAll' => $settings['accept_all'],
            'hideDeclineAll' => $settings['hide_decline_all'],
            'hideLearnMore' => $settings['hide_learn_more'],
            'hideToggleAll' => $settings['hide_toggle_all'],
            'groupByPurpose' => $settings['group_by_purpose'],
            'noticeAsModal' => $settings['notice_as_modal'],
            'flipButtons' => $settings['flip_buttons'],
            'htmlTexts' => $settings['html_texts'],

            // Translations
            'translations' => [
                'fr' => $this->build_translations($settings),
            ],
            'lang' => 'fr',

            // Services
            'services' => $this->build_services_config($settings),
        ];

        // Add purposes if group by purpose is enabled
        if ($settings['group_by_purpose']) {
            $config['purposes'] = array_keys($settings['purposes']);
        }

        return $config;
    }

    /**
     * Build translations for Klaro
     */
    private function build_translations(array $settings): array {
        $texts = $settings['texts'];

        $translations = [
            'consentModal' => [
                'title' => $texts['notice_title'],
                'description' => $texts['notice_description'],
            ],
            'consentNotice' => [
                'title' => $texts['notice_title'],
                'description' => $texts['notice_description'],
                'changeDescription' => 'Des changements ont été apportés depuis votre dernière visite, veuillez mettre à jour votre consentement.',
                'learnMore' => $texts['settings'],
            ],
            'acceptAll' => $texts['accept_all'],
            'declineAll' => $texts['decline_all'],
            'acceptSelected' => $texts['accept_selected'],
            'save' => $texts['save'],
            'close' => $texts['close'],
            'ok' => 'OK',
            'service' => [
                'disableAll' => [
                    'title' => 'Tout activer/désactiver',
                    'description' => 'Utilisez ce bouton pour activer ou désactiver tous les services.',
                ],
                'optOut' => [
                    'title' => '(opt-out)',
                    'description' => 'Ce service est chargé par défaut (mais vous pouvez le désactiver)',
                ],
                'required' => [
                    'title' => '(requis)',
                    'description' => 'Ce service est requis pour le fonctionnement du site',
                ],
                'purposes' => 'Finalités',
                'purpose' => 'Finalité',
            ],
            'purposeItem' => [
                'service' => 'service',
                'services' => 'services',
            ],
            'purposes' => [],
        ];

        // Add purpose translations
        foreach ($settings['purposes'] as $key => $purpose) {
            $translations['purposes'][$key] = [
                'title' => $purpose['title'],
                'description' => $purpose['description'],
            ];
        }

        // Add privacy policy link
        if (!empty($texts['privacy_policy_url'])) {
            $translations['privacyPolicyUrl'] = $texts['privacy_policy_url'];
            $translations['privacyPolicy'] = [
                'name' => $texts['privacy_policy'],
                'url' => $texts['privacy_policy_url'],
            ];
        }

        return $translations;
    }

    /**
     * Build services configuration for Klaro
     */
    private function build_services_config(array $settings): array {
        $services = [];

        // Always add a "functional" service so Klaro displays
        $services[] = [
            'name' => 'functional',
            'title' => 'Cookies fonctionnels',
            'purposes' => ['necessary'],
            'cookies' => [],
            'required' => true,
            'default' => true,
            'optOut' => false,
            'onlyOnce' => false,
            'translations' => [
                'fr' => [
                    'description' => 'Ces cookies sont necessaires au fonctionnement du site.',
                ],
            ],
        ];

        foreach ($settings['services'] as $service) {
            if (empty($service['enabled'])) {
                continue;
            }

            $services[] = [
                'name' => $service['name'],
                'title' => $service['title'],
                'purposes' => $service['purposes'],
                'cookies' => $this->format_cookies($service['cookies'] ?? []),
                'required' => $service['required'] ?? false,
                'default' => $service['default'] ?? false,
                'optOut' => $service['opt_out'] ?? false,
                'onlyOnce' => $service['only_once'] ?? false,
                'translations' => [
                    'fr' => [
                        'description' => $service['description'] ?? '',
                    ],
                ],
            ];
        }

        return $services;
    }

    /**
     * Format cookies array for Klaro (supports regex patterns)
     */
    private function format_cookies(array $cookies): array {
        $formatted = [];

        foreach ($cookies as $cookie) {
            if (strpos($cookie, '*') !== false) {
                // Convert wildcard to regex
                $formatted[] = ['/^' . str_replace('*', '.*', preg_quote($cookie, '/')) . '$/', '/', '/'];
            } else {
                $formatted[] = $cookie;
            }
        }

        return $formatted;
    }

}
