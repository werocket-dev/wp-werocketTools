<?php
/**
 * Google Business Module
 */

namespace WeRocket\Tools\Modules\GoogleBusiness;

use WeRocket\Tools\Modules\AbstractModule;

class GoogleBusinessModule extends AbstractModule {

    protected string $id = 'google_business';
    protected string $name = 'Google Business';
    protected string $description = 'Gestion et affichage des informations Google Business Profile';
    protected string $icon = '<svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
    protected string $option_key = 'werocket_google_business_settings';

    public function init(): void {
        add_shortcode('werocket_business_info', [$this, 'render_info_shortcode']);
        add_shortcode('werocket_business_hours', [$this, 'render_hours_shortcode']);
        add_shortcode('werocket_business_map', [$this, 'render_map_shortcode']);

        // Schema.org structured data
        add_action('wp_head', [$this, 'output_structured_data']);
    }

    public function render_settings(): void {
        $settings = $this->get_settings();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/google-business-settings.php';
    }

    protected function get_default_settings(): array {
        return [
            'business_name' => '',
            'business_type' => 'LocalBusiness',
            'description' => '',
            'phone' => '',
            'email' => '',
            'website' => '',
            'address' => [
                'street' => '',
                'city' => '',
                'postal_code' => '',
                'country' => 'FR',
            ],
            'coordinates' => [
                'lat' => '',
                'lng' => '',
            ],
            'opening_hours' => [
                'monday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'tuesday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'wednesday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'thursday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'friday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'saturday' => ['open' => '10:00', 'close' => '17:00', 'closed' => false],
                'sunday' => ['open' => '', 'close' => '', 'closed' => true],
            ],
            'social_links' => [
                'facebook' => '',
                'instagram' => '',
                'linkedin' => '',
                'twitter' => '',
            ],
            'google_maps_api_key' => '',
            'enable_structured_data' => true,
        ];
    }

    protected function sanitize_settings(array $data): array {
        return [
            'business_name' => sanitize_text_field($data['business_name'] ?? ''),
            'business_type' => sanitize_text_field($data['business_type'] ?? 'LocalBusiness'),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'phone' => sanitize_text_field($data['phone'] ?? ''),
            'email' => sanitize_email($data['email'] ?? ''),
            'website' => esc_url_raw($data['website'] ?? ''),
            'address' => $this->sanitize_address($data['address'] ?? []),
            'coordinates' => $this->sanitize_coordinates($data['coordinates'] ?? []),
            'opening_hours' => $this->sanitize_hours($data['opening_hours'] ?? []),
            'social_links' => $this->sanitize_social_links($data['social_links'] ?? []),
            'google_maps_api_key' => sanitize_text_field($data['google_maps_api_key'] ?? ''),
            'enable_structured_data' => !empty($data['enable_structured_data']),
        ];
    }

    private function sanitize_address(array $address): array {
        return [
            'street' => sanitize_text_field($address['street'] ?? ''),
            'city' => sanitize_text_field($address['city'] ?? ''),
            'postal_code' => sanitize_text_field($address['postal_code'] ?? ''),
            'country' => sanitize_text_field($address['country'] ?? 'FR'),
        ];
    }

    private function sanitize_coordinates(array $coords): array {
        return [
            'lat' => floatval($coords['lat'] ?? 0),
            'lng' => floatval($coords['lng'] ?? 0),
        ];
    }

    private function sanitize_hours(array $hours): array {
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $sanitized = [];

        foreach ($days as $day) {
            $sanitized[$day] = [
                'open' => sanitize_text_field($hours[$day]['open'] ?? ''),
                'close' => sanitize_text_field($hours[$day]['close'] ?? ''),
                'closed' => !empty($hours[$day]['closed']),
            ];
        }

        return $sanitized;
    }

    private function sanitize_social_links(array $links): array {
        $sanitized = [];
        foreach ($links as $key => $url) {
            $sanitized[sanitize_key($key)] = esc_url_raw($url);
        }
        return $sanitized;
    }

    public function output_structured_data(): void {
        $settings = $this->get_settings();

        if (empty($settings['enable_structured_data']) || empty($settings['business_name'])) {
            return;
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => $settings['business_type'],
            'name' => $settings['business_name'],
            'description' => $settings['description'],
            'telephone' => $settings['phone'],
            'email' => $settings['email'],
            'url' => $settings['website'] ?: home_url(),
        ];

        if (!empty($settings['address']['street'])) {
            $schema['address'] = [
                '@type' => 'PostalAddress',
                'streetAddress' => $settings['address']['street'],
                'addressLocality' => $settings['address']['city'],
                'postalCode' => $settings['address']['postal_code'],
                'addressCountry' => $settings['address']['country'],
            ];
        }

        if (!empty($settings['coordinates']['lat'])) {
            $schema['geo'] = [
                '@type' => 'GeoCoordinates',
                'latitude' => $settings['coordinates']['lat'],
                'longitude' => $settings['coordinates']['lng'],
            ];
        }

        echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
    }

    public function render_info_shortcode(array $atts = []): string {
        $settings = $this->get_settings();
        ob_start();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/google-business-info.php';
        return ob_get_clean();
    }

    public function render_hours_shortcode(array $atts = []): string {
        $settings = $this->get_settings();
        ob_start();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/google-business-hours.php';
        return ob_get_clean();
    }

    public function render_map_shortcode(array $atts = []): string {
        $settings = $this->get_settings();
        ob_start();
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/modules/google-business-map.php';
        return ob_get_clean();
    }
}
