<?php
/**
 * Google Reviews Module
 */

namespace WeRocket\Tools\Modules\GoogleReviews;

use WeRocket\Tools\Admin\ViteAssets;
use WeRocket\Tools\Modules\AbstractModule;

class GoogleReviewsModule extends AbstractModule {

    public const CRON_HOOK = 'werocket_google_reviews_weekly_sync';
    public const LAST_SYNC_OPTION = 'werocket_google_reviews_last_sync';
    public const META_OPTION = 'werocket_google_reviews_meta';

    protected string $id = 'google_reviews';
    protected string $name = 'Avis Google';
    protected string $description = 'Affichage et gestion des avis Google My Business';
    protected string $icon = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>';
    protected string $option_key = 'werocket_google_reviews_settings';

    public function init(): void {
        add_shortcode('werocket_reviews', [$this, 'render_shortcode']);
        add_shortcode('werocket_reviews_badge', [$this, 'render_badge_shortcode']);

        // Cron hook callback (toujours enregistré pour que WP-Cron puisse l'appeler)
        add_action(self::CRON_HOOK, [$this, 'force_refresh']);

        // Planifier le cron si pas encore programmé
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + HOUR_IN_SECONDS, 'weekly', self::CRON_HOOK);
        }

        if (!is_admin()) {
            add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        }
    }

    public static function unschedule_cron(): void {
        $timestamp = wp_next_scheduled(self::CRON_HOOK);
        if ($timestamp !== false) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
        }
        wp_clear_scheduled_hook(self::CRON_HOOK);
    }

    public function render_settings(): void {}

    private const TEMPLATES = ['minimal', 'classic', 'card', 'quote', 'google'];
    private const SHADOWS = ['none', 'subtle', 'medium', 'strong'];

    /** Clé API Google Places de l'agence, fournie par défaut sur chaque site. */
    private const DEFAULT_GOOGLE_API_KEY = 'AIzaSyAdbeN4FGLGh4DsP63i5DYyQCsSVQ8Zjsw';

    protected function get_default_settings(): array {
        return [
            'google_place_id' => '',
            'google_api_key' => self::DEFAULT_GOOGLE_API_KEY,
            'template' => 'classic',
            'display_style' => 'grid',
            'reviews_count' => 5,
            'min_rating' => 4,
            'show_rating' => true,
            'show_date' => true,
            'show_avatar' => true,
            'cache_duration' => 3600,
            'custom_css' => '',

            'grid_columns'    => ['desktop' => 3,  'tablet' => 2,  'mobile' => 1],
            'grid_gap'        => ['desktop' => 16, 'tablet' => 12, 'mobile' => 8],
            'card_padding'    => ['desktop' => 24, 'tablet' => 20, 'mobile' => 16],
            'carousel_slides' => ['desktop' => 3,  'tablet' => 2,  'mobile' => 1],

            'card_radius' => 12,
            'card_shadow' => 'subtle',

            // Personnalisation ('' = couleur par défaut du template)
            'card_bg_color' => '',
            'text_color' => '',
            'star_color' => '',
            'avatar_size' => 40,
            'show_google_badge' => true,

            // Badge note Google ([werocket_reviews_badge])
            'badge_show_logo' => true,
            'badge_show_rating' => true,
            'badge_show_stars' => true,
            'badge_show_count' => true,
            'badge_card' => true,  // false = transparent : sans fond, bordure ni padding
            'badge_rating_color' => '',
            'badge_star_color' => '',
            'badge_count_color' => '',

            'carousel_autoplay' => false,
            'carousel_autoplay_speed' => 5,
            'carousel_loop' => true,
            'carousel_show_arrows' => true,
            'carousel_show_dots' => true,
        ];
    }

    private function sanitize_responsive($data, int $min, int $max, array $defaults): array {
        if (!is_array($data)) {
            // Migration de l'ancien format plat (number ou string)
            if (is_numeric($data)) {
                $val = max($min, min($max, (int) $data));
                return ['desktop' => $val, 'tablet' => $val, 'mobile' => $val];
            }
            return $defaults;
        }
        return [
            'desktop' => max($min, min($max, (int) ($data['desktop'] ?? $defaults['desktop']))),
            'tablet'  => max($min, min($max, (int) ($data['tablet']  ?? $defaults['tablet']))),
            'mobile'  => max($min, min($max, (int) ($data['mobile']  ?? $defaults['mobile']))),
        ];
    }

    protected function sanitize_settings(array $data): array {
        $template = $data['template'] ?? 'classic';
        if (!in_array($template, self::TEMPLATES, true)) {
            $template = 'classic';
        }

        $shadow = $data['card_shadow'] ?? 'subtle';
        if (!in_array($shadow, self::SHADOWS, true)) {
            $shadow = 'subtle';
        }

        // Migration "old" grid_gap (sm/md/lg) → numérique
        $old_gap_map = ['sm' => 8, 'md' => 16, 'lg' => 24];
        if (isset($data['grid_gap']) && is_string($data['grid_gap']) && isset($old_gap_map[$data['grid_gap']])) {
            $v = $old_gap_map[$data['grid_gap']];
            $data['grid_gap'] = ['desktop' => $v, 'tablet' => $v, 'mobile' => max(8, $v - 4)];
        }

        $autoplay_speed = (int) ($data['carousel_autoplay_speed'] ?? 5);
        $autoplay_speed = max(2, min(30, $autoplay_speed));

        $card_radius = (int) ($data['card_radius'] ?? 12);
        $card_radius = max(0, min(32, $card_radius));

        $avatar_size = (int) ($data['avatar_size'] ?? 40);
        $avatar_size = max(24, min(72, $avatar_size));

        // '' = couleur auto (défaut du template), sinon hex valide obligatoire
        $sanitize_color = static function ($value): string {
            $value = trim((string) $value);
            if ($value === '') {
                return '';
            }
            return sanitize_hex_color($value) ?: '';
        };

        // Champ vidé = retour à la clé agence par défaut (jamais de clé vide)
        $api_key = sanitize_text_field($data['google_api_key'] ?? '');
        if ($api_key === '') {
            $api_key = self::DEFAULT_GOOGLE_API_KEY;
        }

        return [
            'google_place_id' => sanitize_text_field($data['google_place_id'] ?? ''),
            'google_api_key' => $api_key,
            'template' => $template,
            'display_style' => sanitize_key($data['display_style'] ?? 'grid'),
            'reviews_count' => absint($data['reviews_count'] ?? 5),
            'min_rating' => absint($data['min_rating'] ?? 4),
            'show_rating' => !empty($data['show_rating']),
            'show_date' => !empty($data['show_date']),
            'show_avatar' => !empty($data['show_avatar']),
            'cache_duration' => absint($data['cache_duration'] ?? 3600),
            // Plus d'UI pour custom_css : on préserve l'existant si absent du payload
            'custom_css' => sanitize_textarea_field($data['custom_css'] ?? ($this->get_settings()['custom_css'] ?? '')),

            'grid_columns'    => $this->sanitize_responsive($data['grid_columns']    ?? null, 1, 4,  ['desktop' => 3,  'tablet' => 2,  'mobile' => 1]),
            'grid_gap'        => $this->sanitize_responsive($data['grid_gap']        ?? null, 0, 48, ['desktop' => 16, 'tablet' => 12, 'mobile' => 8]),
            'card_padding'    => $this->sanitize_responsive($data['card_padding']    ?? null, 8, 40, ['desktop' => 24, 'tablet' => 20, 'mobile' => 16]),
            'carousel_slides' => $this->sanitize_responsive($data['carousel_slides'] ?? null, 1, 4,  ['desktop' => 3,  'tablet' => 2,  'mobile' => 1]),

            'card_radius' => $card_radius,
            'card_shadow' => $shadow,

            'card_bg_color' => $sanitize_color($data['card_bg_color'] ?? ''),
            'text_color' => $sanitize_color($data['text_color'] ?? ''),
            'star_color' => $sanitize_color($data['star_color'] ?? ''),
            'avatar_size' => $avatar_size,
            'show_google_badge' => !empty($data['show_google_badge']),

            'badge_show_logo' => !empty($data['badge_show_logo']),
            'badge_show_rating' => !empty($data['badge_show_rating']),
            'badge_show_stars' => !empty($data['badge_show_stars']),
            'badge_show_count' => !empty($data['badge_show_count']),
            'badge_card' => !empty($data['badge_card']),
            'badge_rating_color' => $sanitize_color($data['badge_rating_color'] ?? ''),
            'badge_star_color' => $sanitize_color($data['badge_star_color'] ?? ''),
            'badge_count_color' => $sanitize_color($data['badge_count_color'] ?? ''),

            'carousel_autoplay' => !empty($data['carousel_autoplay']),
            'carousel_autoplay_speed' => $autoplay_speed,
            'carousel_loop' => !empty($data['carousel_loop']),
            'carousel_show_arrows' => !empty($data['carousel_show_arrows']),
            'carousel_show_dots' => !empty($data['carousel_show_dots']),
        ];
    }

    public function enqueue_frontend_assets(): void {
        ViteAssets::enqueue_entry('frontend/reviews/main.tsx', 'werocket-reviews');

        // REST URL pour le widget
        wp_add_inline_script(
            'werocket-reviews',
            'window.werocketFrontend = window.werocketFrontend || {}; window.werocketFrontend.restUrl = ' . wp_json_encode(rest_url('werocket/v1/')) . ';',
            'before'
        );
    }

    public function render_shortcode(array $atts = []): string {
        $settings = $this->get_settings();
        $atts = shortcode_atts([
            'count' => $settings['reviews_count'] ?? 5,
            'style' => $settings['display_style'] ?? 'grid',
            'template' => $settings['template'] ?? 'classic',
        ], $atts);

        $template = in_array($atts['template'], self::TEMPLATES, true) ? $atts['template'] : 'classic';

        return sprintf(
            '<div class="werocket-reviews-mount" data-count="%d" data-style="%s" data-template="%s">%s</div>',
            absint($atts['count']),
            esc_attr($atts['style']),
            esc_attr($template),
            $this->mount_placeholder(__('Avis Google', 'werocket-tools'))
        );
    }

    /**
     * Contenu de secours affiché dans la div de montage tant que le widget
     * React n'a pas pris la main (builder sans nos scripts, JS bloqué…).
     * React remplace ce contenu au mount — invisible en usage normal.
     */
    private function mount_placeholder(string $label): string {
        return sprintf(
            '<div style="padding:20px;border:1px dashed #D0D5DD;border-radius:12px;color:#98A2B3;font:500 13px/1.4 system-ui,-apple-system,sans-serif;text-align:center;">%s</div>',
            esc_html($label)
        );
    }

    /**
     * [werocket_reviews_badge] — logo Google + note + étoiles + nombre d'avis.
     * Chaque élément est désactivable par attribut : logo, note, etoiles, avis
     * (valeurs "true"/"false"). Sans attribut, le réglage admin s'applique.
     * Ex : [werocket_reviews_badge logo="false" avis="false"]
     */
    public function render_badge_shortcode(array $atts = []): string {
        $atts = shortcode_atts([
            'logo'    => '',
            'note'    => '',
            'etoiles' => '',
            'avis'    => '',
            'carte'   => '',
        ], $atts);

        // '' = défaut réglages, sinon "1"/"0" tranché côté widget React
        $tri = static function (string $value): string {
            if ($value === '') {
                return '';
            }
            return in_array(strtolower($value), ['false', '0', 'no', 'non', 'off'], true) ? '0' : '1';
        };

        return sprintf(
            '<div class="werocket-badge-mount" data-logo="%s" data-note="%s" data-etoiles="%s" data-avis="%s" data-carte="%s">%s</div>',
            esc_attr($tri($atts['logo'])),
            esc_attr($tri($atts['note'])),
            esc_attr($tri($atts['etoiles'])),
            esc_attr($tri($atts['avis'])),
            esc_attr($tri($atts['carte'])),
            $this->mount_placeholder(__('Badge note Google', 'werocket-tools'))
        );
    }

    /** Note globale + nombre total d'avis (mis à jour à chaque appel API réussi). */
    public function get_meta(): ?array {
        $meta = get_option(self::META_OPTION, null);
        return is_array($meta) && isset($meta['rating']) ? $meta : null;
    }

    public function fetch_reviews(): array {
        $settings = $this->get_settings();
        $cache_key = $this->get_cache_key($settings);

        $cached = get_transient($cache_key);
        if ($cached !== false) {
            return $cached;
        }

        $reviews = [];

        if (!empty($settings['google_place_id']) && !empty($settings['google_api_key'])) {
            $result = $this->call_google_api($settings);
            $reviews = is_wp_error($result) ? [] : $result;
        }

        if (!empty($reviews)) {
            set_transient($cache_key, $reviews, $settings['cache_duration']);
        }

        return $reviews;
    }

    /**
     * Force refresh: clear cache + re-fetch from Google API. Returns array with
     * 'success', 'count', 'timestamp', 'error' (if any).
     */
    public function force_refresh(): array {
        $settings = $this->get_settings();

        if (empty($settings['google_place_id']) || empty($settings['google_api_key'])) {
            return [
                'success'   => false,
                'count'     => 0,
                'timestamp' => time(),
                'error'     => __('Place ID ou clé API Google Places manquant.', 'werocket-tools'),
            ];
        }

        $cache_key = $this->get_cache_key($settings);
        delete_transient($cache_key);

        $reviews = $this->call_google_api($settings);

        $result = [
            'success'   => !is_wp_error($reviews),
            'count'     => is_wp_error($reviews) ? 0 : count($reviews),
            'timestamp' => time(),
            'error'     => is_wp_error($reviews) ? $reviews->get_error_message() : null,
        ];

        if (!is_wp_error($reviews) && !empty($reviews)) {
            set_transient($cache_key, $reviews, (int) ($settings['cache_duration'] ?? 3600));
        }

        update_option(self::LAST_SYNC_OPTION, $result);

        return $result;
    }

    public function get_last_sync(): ?array {
        $stored = get_option(self::LAST_SYNC_OPTION, null);
        return is_array($stored) ? $stored : null;
    }

    private function get_cache_key(array $settings): string {
        return 'werocket_google_reviews_' . md5($settings['google_place_id'] ?? '');
    }

    /**
     * @return array|\WP_Error Liste d'avis, ou WP_Error détaillant l'échec
     *                         (réseau, HTTP, ou status Google ≠ OK).
     */
    private function call_google_api(array $settings) {
        $url = add_query_arg([
            'place_id' => $settings['google_place_id'],
            'fields' => 'reviews,rating,user_ratings_total',
            'language' => substr(get_locale(), 0, 2) ?: 'fr',
            'key' => $settings['google_api_key'],
        ], 'https://maps.googleapis.com/maps/api/place/details/json');

        $response = wp_remote_get($url, ['timeout' => 15]);

        if (is_wp_error($response)) {
            return new \WP_Error('http_error', sprintf(
                /* translators: %s: error message */
                __('Impossible de contacter l\'API Google : %s', 'werocket-tools'),
                $response->get_error_message()
            ));
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200 || !is_array($body)) {
            return new \WP_Error('http_error', sprintf(
                /* translators: %d: HTTP status code */
                __('Réponse inattendue de l\'API Google (HTTP %d).', 'werocket-tools'),
                (int) $code
            ));
        }

        $status = $body['status'] ?? 'UNKNOWN';

        if ($status !== 'OK') {
            $hints = [
                'REQUEST_DENIED'   => __('Requête refusée : vérifiez que l\'API « Places API » est activée sur votre projet Google Cloud et que la clé n\'est pas restreinte par référent HTTP (les restrictions par site web bloquent les appels serveur — utilisez une restriction par adresse IP ou par API).', 'werocket-tools'),
                'INVALID_REQUEST'  => __('Requête invalide : le Place ID semble mal formé.', 'werocket-tools'),
                'NOT_FOUND'        => __('Place ID introuvable : vérifiez l\'identifiant de votre établissement.', 'werocket-tools'),
                'OVER_QUERY_LIMIT' => __('Quota Google dépassé : vérifiez la facturation de votre projet Google Cloud.', 'werocket-tools'),
                'ZERO_RESULTS'     => __('Aucun résultat pour ce Place ID.', 'werocket-tools'),
            ];

            $message = $hints[$status] ?? sprintf(
                /* translators: %s: Google API status */
                __('Erreur Google API : %s', 'werocket-tools'),
                $status
            );

            if (!empty($body['error_message'])) {
                $message .= ' — ' . sanitize_text_field($body['error_message']);
            }

            return new \WP_Error('google_api_' . strtolower($status), $message);
        }

        // Note globale + total d'avis pour le badge [werocket_reviews_badge]
        if (isset($body['result']['rating'])) {
            update_option(self::META_OPTION, [
                'rating'  => round((float) $body['result']['rating'], 1),
                'total'   => (int) ($body['result']['user_ratings_total'] ?? 0),
                'updated' => time(),
            ]);
        }

        return $body['result']['reviews'] ?? [];
    }
}
