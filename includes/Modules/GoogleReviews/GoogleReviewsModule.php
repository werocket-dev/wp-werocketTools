<?php
/**
 * Google Reviews Module
 */

namespace WeRocket\Tools\Modules\GoogleReviews;

use WeRocket\Tools\Modules\AbstractModule;

class GoogleReviewsModule extends AbstractModule {

    protected string $id = 'google_reviews';
    protected string $name = 'Avis Google';
    protected string $description = 'Affichage et gestion des avis Google My Business';
    protected string $icon = '<svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>';
    protected string $option_key = 'werocket_google_reviews_settings';

    public function init(): void {
        add_shortcode('werocket_reviews', [$this, 'render_shortcode']);

        if (!is_admin()) {
            add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        }
    }

    public function render_settings(): void {
        $settings = $this->get_settings();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/google-reviews-settings.php';
    }

    protected function get_default_settings(): array {
        return [
            'google_place_id' => '',
            'google_api_key' => '',
            'display_style' => 'grid',
            'reviews_count' => 5,
            'min_rating' => 4,
            'show_rating' => true,
            'show_date' => true,
            'show_avatar' => true,
            'cache_duration' => 3600,
            'custom_css' => '',
        ];
    }

    protected function sanitize_settings(array $data): array {
        return [
            'google_place_id' => sanitize_text_field($data['google_place_id'] ?? ''),
            'google_api_key' => sanitize_text_field($data['google_api_key'] ?? ''),
            'display_style' => sanitize_key($data['display_style'] ?? 'grid'),
            'reviews_count' => absint($data['reviews_count'] ?? 5),
            'min_rating' => absint($data['min_rating'] ?? 4),
            'show_rating' => !empty($data['show_rating']),
            'show_date' => !empty($data['show_date']),
            'show_avatar' => !empty($data['show_avatar']),
            'cache_duration' => absint($data['cache_duration'] ?? 3600),
            'custom_css' => sanitize_textarea_field($data['custom_css'] ?? ''),
        ];
    }

    public function enqueue_frontend_assets(): void {
        wp_enqueue_style(
            'werocket-google-reviews',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/css/google-reviews.css',
            [],
            WEROCKET_TOOLS_VERSION
        );
    }

    public function render_shortcode(array $atts = []): string {
        $atts = shortcode_atts([
            'count' => null,
            'style' => null,
        ], $atts);

        $settings = $this->get_settings();
        $reviews = $this->fetch_reviews();

        ob_start();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/google-reviews-display.php';
        return ob_get_clean();
    }

    public function fetch_reviews(): array {
        $settings = $this->get_settings();
        $cache_key = 'werocket_google_reviews_' . md5($settings['google_place_id']);

        $cached = get_transient($cache_key);
        if ($cached !== false) {
            return $cached;
        }

        // TODO: Implement actual Google Places API call
        // For now, return empty array - API implementation will be added
        $reviews = [];

        if (!empty($settings['google_place_id']) && !empty($settings['google_api_key'])) {
            $reviews = $this->call_google_api($settings);
        }

        if (!empty($reviews)) {
            set_transient($cache_key, $reviews, $settings['cache_duration']);
        }

        return $reviews;
    }

    private function call_google_api(array $settings): array {
        $url = add_query_arg([
            'place_id' => $settings['google_place_id'],
            'fields' => 'reviews',
            'key' => $settings['google_api_key'],
        ], 'https://maps.googleapis.com/maps/api/place/details/json');

        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            return [];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        return $body['result']['reviews'] ?? [];
    }
}
