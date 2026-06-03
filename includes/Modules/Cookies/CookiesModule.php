<?php
/**
 * Cookies Management Module - Klaro Integration
 *
 * Provides GDPR-compliant cookie consent with Google Consent Mode v2 support
 */

namespace WeRocket\Tools\Modules\Cookies;

use WeRocket\Tools\Admin\ViteAssets;
use WeRocket\Tools\Modules\AbstractModule;

class CookiesModule extends AbstractModule {

    protected string $id = 'cookies';
    protected string $name = 'Gestion des Cookies';
    protected string $description = 'Bandeau de consentement RGPD avec Klaro et Google Consent Mode v2';
    protected string $icon = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    protected string $option_key = 'werocket_cookies_settings';

    public function init(): void {
        if (!is_admin()) {
            // Load Klaro early in head with high priority
            add_action('wp_head', [$this, 'render_google_consent_default'], 1);
            add_action('wp_head', [$this, 'render_klaro_config'], 2);
            add_action('wp_head', [$this, 'render_klaro_script'], 3);
            add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
            add_filter('body_class', [$this, 'add_theme_body_class']);
        }

        // Register shortcodes
        add_shortcode('werocket_cookie_settings', [$this, 'render_cookie_settings_shortcode']);
        add_shortcode('werocket_manage_cookies', [$this, 'render_cookie_settings_shortcode']);
    }

    /**
     * Add theme class to body
     */
    public function add_theme_body_class(array $classes): array {
        $settings = $this->get_settings();
        $theme = $settings['theme'] ?? 'light';

        if ($theme === 'dark') {
            $classes[] = 'werocket-cookies-theme-dark';
        } else {
            $classes[] = 'werocket-cookies-theme-light';
        }

        return $classes;
    }

    /**
     * Shortcode to display a link/button to manage cookie preferences
     * Usage: [werocket_cookie_settings] or [werocket_cookie_settings text="Gérer mes cookies" class="my-class" tag="button"]
     */
    public function render_cookie_settings_shortcode($atts): string {
        $atts = shortcode_atts([
            'text' => 'Gérer mes cookies',
            'class' => '',
            'tag' => 'a', // 'a' or 'button'
            'style' => '', // Additional inline styles
        ], $atts);

        $classes = 'werocket-cookie-settings-link';
        if (!empty($atts['class'])) {
            $classes .= ' ' . esc_attr($atts['class']);
        }

        $style = !empty($atts['style']) ? ' style="' . esc_attr($atts['style']) . '"' : '';

        if ($atts['tag'] === 'button') {
            return sprintf(
                '<button type="button" class="%s" onclick="WeRocketCookies.showSettings()"%s>%s</button>',
                $classes,
                $style,
                esc_html($atts['text'])
            );
        }

        return sprintf(
            '<a href="#" class="%s" onclick="WeRocketCookies.showSettings(); return false;"%s>%s</a>',
            $classes,
            $style,
            esc_html($atts['text'])
        );
    }

    public function render_settings(): void {
        $settings = $this->get_settings();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/cookies-settings.php';
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
            'services' => [
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
        $sanitized = [
            // General
            'cookie_name' => sanitize_key($data['cookie_name'] ?? 'werocket_consent'),
            'cookie_expires_days' => absint($data['cookie_expires_days'] ?? 365),
            'cookie_domain' => sanitize_text_field($data['cookie_domain'] ?? ''),

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
            'storage_method' => in_array($data['storage_method'] ?? '', ['cookie', 'localStorage']) ? $data['storage_method'] : 'cookie',

            // Appearance
            'theme' => sanitize_key($data['theme'] ?? 'light'),
            'position' => sanitize_key($data['position'] ?? 'bottom-left'),
            'modal_trigger_position' => sanitize_key($data['modal_trigger_position'] ?? 'bottom-left'),
            'notice_as_modal' => !empty($data['notice_as_modal']),
            'flip_buttons' => !empty($data['flip_buttons']),
            'html_texts' => !empty($data['html_texts']),

            // Colors
            'color_primary' => sanitize_hex_color($data['color_primary'] ?? '#059669'),
            'color_primary_hover' => sanitize_hex_color($data['color_primary_hover'] ?? '#047857'),
            'color_background' => sanitize_hex_color($data['color_background'] ?? '#ffffff'),
            'color_text' => sanitize_hex_color($data['color_text'] ?? '#1f2937'),
            'color_text_secondary' => sanitize_hex_color($data['color_text_secondary'] ?? '#6b7280'),
            'color_border' => sanitize_hex_color($data['color_border'] ?? '#e5e7eb'),
            'color_toggle_on' => sanitize_hex_color($data['color_toggle_on'] ?? '#059669'),
            'color_toggle_off' => sanitize_hex_color($data['color_toggle_off'] ?? '#d1d5db'),

            // Texts
            'texts' => $this->sanitize_texts($data['texts'] ?? []),

            // GCM
            'gcm_enabled' => !empty($data['gcm_enabled']),
            'gcm_default_analytics' => in_array($data['gcm_default_analytics'] ?? '', ['granted', 'denied']) ? $data['gcm_default_analytics'] : 'denied',
            'gcm_default_ad_storage' => in_array($data['gcm_default_ad_storage'] ?? '', ['granted', 'denied']) ? $data['gcm_default_ad_storage'] : 'denied',
            'gcm_default_ad_user_data' => in_array($data['gcm_default_ad_user_data'] ?? '', ['granted', 'denied']) ? $data['gcm_default_ad_user_data'] : 'denied',
            'gcm_default_ad_personalization' => in_array($data['gcm_default_ad_personalization'] ?? '', ['granted', 'denied']) ? $data['gcm_default_ad_personalization'] : 'denied',
            'gcm_default_functionality' => in_array($data['gcm_default_functionality'] ?? '', ['granted', 'denied']) ? $data['gcm_default_functionality'] : 'granted',
            'gcm_default_security' => in_array($data['gcm_default_security'] ?? '', ['granted', 'denied']) ? $data['gcm_default_security'] : 'granted',
            'gcm_wait_for_update' => absint($data['gcm_wait_for_update'] ?? 500),
            'gcm_region' => sanitize_text_field($data['gcm_region'] ?? ''),

            // Services
            'services' => $this->sanitize_services($data['services'] ?? []),

            // Purposes
            'purposes' => $this->sanitize_purposes($data['purposes'] ?? []),

            // Advanced
            'additional_class' => sanitize_html_class($data['additional_class'] ?? ''),
            'custom_css' => wp_strip_all_tags($data['custom_css'] ?? ''),
            'callback_on_accept' => sanitize_text_field($data['callback_on_accept'] ?? ''),
            'callback_on_decline' => sanitize_text_field($data['callback_on_decline'] ?? ''),
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
        $sanitized = [];

        foreach ($services as $service) {
            if (empty($service['name'])) continue;

            $sanitized[] = [
                'name' => sanitize_key($service['name']),
                'title' => sanitize_text_field($service['title'] ?? ''),
                'description' => wp_kses_post($service['description'] ?? ''),
                'purposes' => array_map('sanitize_key', (array)($service['purposes'] ?? [])),
                'cookies' => array_map('sanitize_text_field', (array)($service['cookies'] ?? [])),
                'required' => !empty($service['required']),
                'default' => !empty($service['default']),
                'opt_out' => !empty($service['opt_out']),
                'only_once' => !empty($service['only_once']),
                'enabled' => !empty($service['enabled']),
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

        // Klaro CSS (conservé car moteur de consentement)
        wp_enqueue_style('klaro', 'https://cdn.kiprotect.com/klaro/v0.7/klaro.min.css', [], '0.7.0');

        // Bundle React cookies (banner custom)
        ViteAssets::enqueue_entry('frontend/cookies/main.tsx', 'werocket-cookies');

        // Passe la config au composant React
        $config = [
            'position'        => $settings['position'] ?? 'bottom-left',
            'theme'           => $settings['theme'] ?? 'light',
            'primary_color'   => $settings['color_primary'] ?? '#059669',
            'notice_text'     => $settings['texts']['notice_description'] ?? '',
            'accept_all_text' => $settings['texts']['accept_all'] ?? 'Tout accepter',
            'decline_text'    => $settings['texts']['decline_all'] ?? 'Tout refuser',
            'settings_text'   => $settings['texts']['settings'] ?? 'Personnaliser',
        ];

        add_action('wp_footer', function () use ($config): void {
            printf(
                '<div id="werocket-cookies-banner" data-config="%s"></div>',
                esc_attr(wp_json_encode($config))
            );
        }, 5);
    }

    /**
     * Render Klaro container div (required by Klaro)
     */
    public function render_klaro_container(): void {
        echo '<div id="werocket-klaro"></div>' . "\n";
    }

    /**
     * Render Klaro script tag directly in head (after config)
     */
    public function render_klaro_script(): void {
        $settings = $this->get_settings();
        $position = $settings['position'] ?? 'bottom-left';
        $show_modal = !empty($settings['must_consent']) || !empty($settings['notice_as_modal']);

        // Output Klaro container div first
        $this->render_klaro_container();
        ?>
<script defer type="text/javascript" src="https://cdn.kiprotect.com/klaro/v0.7/klaro.js"></script>
<script>
(function() {
    // Prevent multiple initializations
    if (window.werocketKlaroInitialized) {
        return;
    }
    window.werocketKlaroInitialized = true;

    var klaroPosition = '<?php echo esc_js($position); ?>';
    var showAsModal = <?php echo $show_modal ? 'true' : 'false'; ?>;
    var klaroTheme = '<?php echo esc_js($settings['theme'] ?? 'light'); ?>';

    // Force theme by removing Klaro's auto-detected dark class
    function enforceTheme() {
        var klaroElements = document.querySelectorAll('.klaro');
        klaroElements.forEach(function(el) {
            // Remove Klaro's dark mode class
            el.classList.remove('klaro-dark');

            // Add our custom class if dark theme is selected
            if (klaroTheme === 'dark') {
                el.classList.add('werocket-force-dark');
            } else {
                el.classList.remove('werocket-force-dark');
            }
        });
    }

    function cleanupExistingNotices() {
        // Remove any existing WeRocket notices
        var existingNotices = document.querySelectorAll('#werocket-cookie-notice, .werocket-notice');
        existingNotices.forEach(function(notice) {
            notice.remove();
        });

        // Remove any duplicate Klaro modals
        var klaroModals = document.querySelectorAll('.klaro, [id^="klaro-"]');
        if (klaroModals.length > 1) {
            // Keep only the first one, remove the rest
            for (var i = 1; i < klaroModals.length; i++) {
                klaroModals[i].remove();
            }
        }
    }

    function initKlaroNotice() {
        if (typeof klaro === 'undefined') return;

        var manager = klaro.getManager ? klaro.getManager() : null;
        if (!manager) {
            return;
        }

        // Clean up any existing notices first
        cleanupExistingNotices();

        // Enforce theme immediately
        enforceTheme();

        // Simple approach: Hide Klaro's modal and show custom notice
        if (!showAsModal) {

            // Hide any Klaro UI elements with CSS (using opacity for smooth transitions)
            var style = document.createElement('style');
            style.id = 'werocket-klaro-hide';
            style.textContent = `
                .klaro .cookie-modal,
                .klaro .cookie-notice {
                    opacity: 0 !important;
                    pointer-events: none !important;
                    visibility: hidden !important;
                }
                .klaro .cookie-modal-backdrop {
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `;
            document.head.appendChild(style);

            // Only show custom notice if consent not yet given
            if (!manager.confirmed) {
                createCustomNotice(manager, klaroPosition);
            }

            // Watch for Klaro modal being added (simple observer, no loop)
            var observer = new MutationObserver(function(mutations) {
                var modal = document.querySelector('.klaro .cookie-modal');
                var externalBackdrop = document.querySelector('.klaro .cookie-modal-backdrop');

                if (modal) {
                    enforceTheme();

                    // Function to remove all modal elements
                    function closeModal() {
                        if (modal && modal.parentNode) {
                            modal.remove();
                        }
                        if (externalBackdrop && externalBackdrop.parentNode) {
                            externalBackdrop.remove();
                        }
                        // Also remove any .cm-bg
                        var cmBg = document.querySelector('.klaro .cm-bg');
                        if (cmBg && cmBg.parentNode) {
                            cmBg.remove();
                        }
                    }

                    // Add click handler on modal container
                    if (!modal.hasAttribute('data-werocket-close-listener')) {
                        modal.setAttribute('data-werocket-close-listener', 'true');

                        modal.addEventListener('click', function(e) {
                            var isBackdropClick = e.target.classList.contains('cm-bg') ||
                                                 e.target.classList.contains('cookie-modal');

                            if (isBackdropClick) {
                                closeModal();
                            }
                        });
                    }

                    // Add click handler on external backdrop too
                    if (externalBackdrop && !externalBackdrop.hasAttribute('data-werocket-close-listener')) {
                        externalBackdrop.setAttribute('data-werocket-close-listener', 'true');

                        externalBackdrop.addEventListener('click', function(e) {
                            if (e.target === externalBackdrop) {
                                closeModal();
                            }
                        });
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // Show Klaro modal directly
            klaro.show();
            setTimeout(enforceTheme, 50);
        }
    }

    function createCustomNotice(manager, position) {
        // Check if notice already exists
        if (document.getElementById('werocket-cookie-notice')) return;

        var config = window.klaroConfig || {};
        var texts = (config.translations && config.translations.fr && config.translations.fr.consentNotice) || {};

        var notice = document.createElement('div');
        notice.id = 'werocket-cookie-notice';
        notice.className = 'werocket-notice werocket-notice--' + position;
        notice.innerHTML =
            '<div class="werocket-notice__content">' +
                '<div class="werocket-notice__text">' +
                    '<strong>' + (texts.title || 'Gestion des cookies') + '</strong>' +
                    '<p>' + (texts.description || 'Nous utilisons des cookies pour améliorer votre expérience.') + '</p>' +
                '</div>' +
                '<div class="werocket-notice__buttons">' +
                    '<button type="button" class="werocket-notice__btn werocket-notice__btn--secondary" data-action="settings">Personnaliser</button>' +
                    '<button type="button" class="werocket-notice__btn werocket-notice__btn--outline" data-action="decline">Refuser</button>' +
                    '<button type="button" class="werocket-notice__btn werocket-notice__btn--primary" data-action="accept">Accepter</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(notice);

        // Button handlers
        var acceptBtn = notice.querySelector('[data-action="accept"]');
        var declineBtn = notice.querySelector('[data-action="decline"]');
        var settingsBtn = notice.querySelector('[data-action="settings"]');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                manager.saveAndApplyConsents(true); // Accept all
                notice.remove();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                manager.saveAndApplyConsents(false); // Decline all
                notice.remove();
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Remove notice
                notice.remove();

                // Add smooth transition before removing hide style
                var transitionStyle = document.createElement('style');
                transitionStyle.id = 'werocket-klaro-transition';
                transitionStyle.textContent = `
                    .klaro .cookie-modal,
                    .klaro .cookie-modal-backdrop,
                    .klaro .cm-modal {
                        transition: opacity 0.3s ease-out, visibility 0.3s ease-out !important;
                    }
                `;
                document.head.appendChild(transitionStyle);

                // Wait a frame for transition style to be applied
                requestAnimationFrame(function() {
                    // Remove the style that hides Klaro modal
                    var hideStyle = document.getElementById('werocket-klaro-hide');
                    if (hideStyle) {
                        hideStyle.remove();
                    }

                    // Remove werocket-hidden class from any Klaro elements
                    var klaroElements = document.querySelectorAll('.klaro.werocket-hidden, .klaro .werocket-hidden');
                    klaroElements.forEach(function(el) {
                        el.classList.remove('werocket-hidden');
                    });
                });

                // Open modal with minimal delay (just enough for transition style to apply)
                setTimeout(function() {
                    if (typeof klaro === 'undefined') {
                        alert('Erreur : Klaro n\'est pas chargé. Veuillez actualiser la page.');
                        return;
                    }

                    try {
                        // Call klaro.show() to display the notice first
                        klaro.show();

                        // Try multiple approaches to open the settings modal (reduced delay)
                        setTimeout(function() {
                            var manager = klaro.getManager();

                            // Approach 1: Try manager.showModal() if it exists
                            if (manager && typeof manager.showModal === 'function') {
                                manager.showModal();
                                setTimeout(enforceTheme, 100);
                                return;
                            }

                            // Approach 2: Try manager.modal.show()
                            if (manager && manager.modal && typeof manager.modal.show === 'function') {
                                manager.modal.show();
                                setTimeout(enforceTheme, 100);
                                return;
                            }

                            // Approach 3: Try klaro.show() with force parameter
                            if (typeof klaro.show === 'function') {
                                try {
                                    klaro.show(undefined, true);
                                    setTimeout(enforceTheme, 100);
                                    return;
                                } catch (e) {
                                    // Silently fail and try next approach
                                }
                            }

                            // Approach 4: Find and click the settings link
                            var settingsLink = document.querySelector('.klaro .cn-learn-more, .klaro a[href="#"]');
                            if (settingsLink) {
                                settingsLink.click();
                                setTimeout(enforceTheme, 200);
                            } else {
                                alert('Impossible d\'ouvrir les paramètres. Veuillez réessayer ou contacter le support.');
                            }
                        }, 50);
                    } catch (error) {
                        alert('Erreur : ' + error.message);
                    }
                }, 20);
            });
        }

        // Animate in smoothly using requestAnimationFrame
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                notice.classList.add('werocket-notice--visible');
            });
        });
    }

    // Wait for DOM and Klaro with optimized timing
    function waitForKlaro() {
        if (typeof klaro !== 'undefined' && typeof klaro.getManager === 'function') {
            // Klaro is ready, but wait a bit more to ensure full initialization
            setTimeout(function() {
                initKlaroNotice();
            }, 100);
        } else {
            // Klaro not ready yet, check again in 50ms
            setTimeout(waitForKlaro, 50);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForKlaro);
    } else {
        waitForKlaro();
    }
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
            // Force noticeAsModal to true so Klaro creates a modal with service list
            // We'll hide it with CSS and show our custom notice instead
            'noticeAsModal' => true,

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

    /**
     * Generate custom CSS for theming
     */
    private function generate_custom_css(array $settings): string {
        $css = ":root {\n";
        $css .= "  --werocket-klaro-primary: {$settings['color_primary']};\n";
        $css .= "  --werocket-klaro-primary-hover: {$settings['color_primary_hover']};\n";
        $css .= "  --werocket-klaro-bg: {$settings['color_background']};\n";
        $css .= "  --werocket-klaro-text: {$settings['color_text']};\n";
        $css .= "  --werocket-klaro-text-secondary: {$settings['color_text_secondary']};\n";
        $css .= "  --werocket-klaro-border: {$settings['color_border']};\n";
        $css .= "  --werocket-klaro-toggle-on: {$settings['color_toggle_on']};\n";
        $css .= "  --werocket-klaro-toggle-off: {$settings['color_toggle_off']};\n";
        $css .= "}\n";

        // Position-specific styles
        $position = $settings['position'] ?? 'bottom-left';
        $css .= $this->get_position_css($position);

        // Dark theme
        if (($settings['theme'] ?? 'light') === 'dark') {
            $css .= "\n/* Dark Theme */\n";
            $css .= ".klaro .cookie-notice, .klaro .cookie-modal .cm-modal { background: #1f2937 !important; border-color: #374151 !important; }\n";
            $css .= ".klaro .cookie-notice p, .klaro .cm-modal p { color: #d1d5db !important; }\n";
            $css .= ".klaro .cookie-notice .cn-body p.title, .klaro .cm-modal h1 { color: #f9fafb !important; }\n";
        }

        if (!empty($settings['custom_css'])) {
            $css .= "\n/* Custom CSS */\n";
            $css .= $settings['custom_css'];
        }

        return $css;
    }

    /**
     * Get position-specific CSS
     */
    private function get_position_css(string $position): string {
        $css = "\n/* Position: {$position} */\n";

        switch ($position) {
            case 'bottom-right':
                $css .= ".klaro .cookie-notice { position: fixed; bottom: 20px; right: 20px; left: auto; max-width: 400px; }\n";
                break;
            case 'bottom-left':
                $css .= ".klaro .cookie-notice { position: fixed; bottom: 20px; left: 20px; right: auto; max-width: 400px; }\n";
                break;
            case 'top-right':
                $css .= ".klaro .cookie-notice { position: fixed; top: 20px; right: 20px; left: auto; bottom: auto; max-width: 400px; }\n";
                break;
            case 'top-left':
                $css .= ".klaro .cookie-notice { position: fixed; top: 20px; left: 20px; right: auto; bottom: auto; max-width: 400px; }\n";
                break;
        }

        return $css;
    }

    /**
     * Get available purposes for settings page
     */
    public function get_available_purposes(): array {
        $settings = $this->get_settings();
        return $settings['purposes'] ?? [];
    }

    /**
     * Get enabled services for settings page
     */
    public function get_enabled_services(): array {
        $settings = $this->get_settings();
        return array_filter($settings['services'] ?? [], function($s) {
            return !empty($s['enabled']);
        });
    }
}
