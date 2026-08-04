<?php
/**
 * Module Clic & Collect — orchestrateur.
 *
 * Permet de configurer un ou plusieurs lieux de retrait avec leurs horaires
 * d'ouverture (jour par jour), un délai minimum de récupération (delta)
 * et de bloquer les commandes hors créneaux.
 *
 * Toutes les informations de retrait (lieu, date, créneau) sont stockées
 * sur la commande et affichées dans le panier, le checkout, l'email
 * de confirmation et le détail admin.
 */

namespace WeRocket\Tools\Modules\ClickCollect;

use WeRocket\Tools\Modules\AbstractModule;

class ClickCollectModule extends AbstractModule {

    public const SHIPPING_METHOD_ID = 'werocket_click_collect';

    public const META_LOCATION_ID   = '_wr_cc_location_id';
    public const META_LOCATION_NAME = '_wr_cc_location_name';
    public const META_LOCATION_ADDR = '_wr_cc_location_address';
    public const META_PICKUP_DATE   = '_wr_cc_pickup_date';
    public const META_PICKUP_TIME   = '_wr_cc_pickup_time';

    protected string $id = 'click_collect';
    protected string $name = 'Clic & Collect (WooCommerce)';
    protected string $description = 'Configurez vos lieux de retrait, horaires et délais minimum de préparation pour proposer le retrait en magasin.';
    protected string $icon = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7M9 7V5a3 3 0 016 0v2"/></svg>';
    protected string $option_key = 'werocket_click_collect_settings';

    public function init(): void {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', [$this, 'render_woocommerce_missing_notice']);
            return;
        }

        // Méthode d'expédition WC
        add_action('woocommerce_shipping_init', [$this, 'register_shipping_method_class']);
        add_filter('woocommerce_shipping_methods', [$this, 'register_shipping_method']);

        // Pipeline checkout (champs + validation + save + display)
        (new Checkout($this))->init();

        // Admin order metabox
        if (is_admin()) {
            (new Admin($this))->init();
        }
    }

    public function register_shipping_method_class(): void {
        if (!class_exists('WC_Shipping_Method')) {
            return;
        }
        require_once __DIR__ . '/ShippingMethod.php';
    }

    public function register_shipping_method(array $methods): array {
        $methods[self::SHIPPING_METHOD_ID] = ShippingMethod::class;
        return $methods;
    }

    public function render_settings(): void {}

    public function render_woocommerce_missing_notice(): void {
        echo '<div class="notice notice-warning"><p>';
        esc_html_e('Le module Clic & Collect de WeRocket Tools nécessite WooCommerce.', 'werocket-tools');
        echo '</p></div>';
    }

    /**
     * Retourne uniquement les lieux activés.
     *
     * @return array<int, array<string, mixed>>
     */
    public function get_enabled_locations(): array {
        $settings = $this->get_settings();
        $locations = $settings['locations'] ?? [];
        return array_values(array_filter($locations, static fn($loc) => !empty($loc['enabled'])));
    }

    public function get_location_by_id(string $location_id): ?array {
        foreach ($this->get_enabled_locations() as $location) {
            if ((string) ($location['id'] ?? '') === $location_id) {
                return $location;
            }
        }
        return null;
    }

    /**
     * Renvoie la liste des jours ouverts (clés mon..sun) pour un lieu donné.
     *
     * @return array<string, array{enabled: bool, slots: array<int, array{start:string,end:string}>}>
     */
    public function get_location_schedule(array $location): array {
        $defaults = [];
        foreach (['mon','tue','wed','thu','fri','sat','sun'] as $d) {
            $defaults[$d] = ['enabled' => false, 'slots' => []];
        }
        $schedule = $location['schedule'] ?? [];
        if (!is_array($schedule)) {
            $schedule = [];
        }
        return array_replace($defaults, $schedule);
    }

    protected function get_default_settings(): array {
        return [
            'method_title'         => __('Clic & Collect', 'werocket-tools'),
            'method_description'   => __('Retirez votre commande gratuitement dans le lieu de votre choix.', 'werocket-tools'),
            'cost'                 => 0.0,
            'tax_status'           => 'none', // none | taxable
            'enable_lead_time'     => true,
            'min_lead_time_hours'  => 24,
            'max_days_ahead'       => 30,
            'require_time_slot'    => true,
            'slot_interval_minutes' => 30,
            'block_unavailable'    => true,
            'show_in_cart'         => true,
            'show_in_order'        => true,
            'show_in_emails'       => true,
            'instructions'         => __('Présentez votre numéro de commande et une pièce d\'identité lors du retrait.', 'werocket-tools'),
            'accent_color'         => '#0F766E',
            'accent_text_color'    => '#FFFFFF',
            'panel_bg_color'       => '#FAF8F4',
            'panel_border_color'   => '#E7E1D5',
            'text_color'           => '#1F2A37',
            'locations'            => [
                [
                    'id'       => 'main',
                    'name'     => __('Boutique principale', 'werocket-tools'),
                    'address'  => '',
                    'phone'    => '',
                    'email'    => '',
                    'enabled'  => true,
                    'cost'     => 0.0,
                    'schedule' => [
                        'mon' => ['enabled' => true, 'slots' => [['start' => '09:00', 'end' => '12:00'], ['start' => '14:00', 'end' => '18:00']]],
                        'tue' => ['enabled' => true, 'slots' => [['start' => '09:00', 'end' => '12:00'], ['start' => '14:00', 'end' => '18:00']]],
                        'wed' => ['enabled' => true, 'slots' => [['start' => '09:00', 'end' => '12:00'], ['start' => '14:00', 'end' => '18:00']]],
                        'thu' => ['enabled' => true, 'slots' => [['start' => '09:00', 'end' => '12:00'], ['start' => '14:00', 'end' => '18:00']]],
                        'fri' => ['enabled' => true, 'slots' => [['start' => '09:00', 'end' => '12:00'], ['start' => '14:00', 'end' => '18:00']]],
                        'sat' => ['enabled' => true, 'slots' => [['start' => '10:00', 'end' => '18:00']]],
                        'sun' => ['enabled' => false, 'slots' => []],
                    ],
                    'closed_dates' => [],
                ],
            ],
        ];
    }

    protected function sanitize_settings(array $data): array {
        $clean = [
            'method_title'         => sanitize_text_field($data['method_title'] ?? 'Clic & Collect'),
            'method_description'   => sanitize_textarea_field($data['method_description'] ?? ''),
            'cost'                 => self::sanitize_float($data['cost'] ?? 0),
            'tax_status'           => in_array(($data['tax_status'] ?? 'none'), ['none','taxable'], true) ? ($data['tax_status'] ?? 'none') : 'none',
            'enable_lead_time'     => !empty($data['enable_lead_time']),
            'min_lead_time_hours'  => max(0, (int) ($data['min_lead_time_hours'] ?? 24)),
            'max_days_ahead'       => max(1, (int) ($data['max_days_ahead'] ?? 30)),
            'require_time_slot'    => !empty($data['require_time_slot']),
            'slot_interval_minutes' => max(5, (int) ($data['slot_interval_minutes'] ?? 30)),
            'block_unavailable'    => !empty($data['block_unavailable']),
            'show_in_cart'         => !empty($data['show_in_cart']),
            'show_in_order'        => !empty($data['show_in_order']),
            'show_in_emails'       => !empty($data['show_in_emails']),
            'instructions'         => sanitize_textarea_field($data['instructions'] ?? ''),
            'accent_color'         => self::sanitize_hex_color($data['accent_color'] ?? '#0F766E', '#0F766E'),
            'accent_text_color'    => self::sanitize_hex_color($data['accent_text_color'] ?? '#FFFFFF', '#FFFFFF'),
            'panel_bg_color'       => self::sanitize_hex_color($data['panel_bg_color'] ?? '#FAF8F4', '#FAF8F4'),
            'panel_border_color'   => self::sanitize_hex_color($data['panel_border_color'] ?? '#E7E1D5', '#E7E1D5'),
            'text_color'           => self::sanitize_hex_color($data['text_color'] ?? '#1F2A37', '#1F2A37'),
            'locations'            => $this->sanitize_locations($data['locations'] ?? []),
        ];
        return $clean;
    }

    private function sanitize_locations($raw): array {
        if (!is_array($raw)) {
            return [];
        }
        $clean = [];
        $used_ids = [];
        foreach ($raw as $loc) {
            if (!is_array($loc)) {
                continue;
            }
            $id = sanitize_key($loc['id'] ?? '');
            if ($id === '' || isset($used_ids[$id])) {
                $id = 'loc_' . substr(md5((string) wp_rand() . microtime(true)), 0, 8);
            }
            $used_ids[$id] = true;

            $schedule_raw = is_array($loc['schedule'] ?? null) ? $loc['schedule'] : [];
            $schedule = [];
            foreach (['mon','tue','wed','thu','fri','sat','sun'] as $d) {
                $day = is_array($schedule_raw[$d] ?? null) ? $schedule_raw[$d] : [];
                $slots = [];
                $raw_slots = is_array($day['slots'] ?? null) ? $day['slots'] : [];
                foreach ($raw_slots as $slot) {
                    if (!is_array($slot)) continue;
                    $start = self::sanitize_time($slot['start'] ?? '');
                    $end   = self::sanitize_time($slot['end'] ?? '');
                    if ($start === '' || $end === '' || $start >= $end) continue;
                    $slots[] = ['start' => $start, 'end' => $end];
                }
                $schedule[$d] = [
                    'enabled' => !empty($day['enabled']) && !empty($slots),
                    'slots'   => $slots,
                ];
            }

            $closed_dates_raw = is_array($loc['closed_dates'] ?? null) ? $loc['closed_dates'] : [];
            $closed_dates = [];
            foreach ($closed_dates_raw as $d) {
                $d = sanitize_text_field((string) $d);
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
                    $closed_dates[] = $d;
                }
            }

            $clean[] = [
                'id'           => $id,
                'name'         => sanitize_text_field($loc['name'] ?? __('Lieu de retrait', 'werocket-tools')),
                'address'      => sanitize_textarea_field($loc['address'] ?? ''),
                'phone'        => sanitize_text_field($loc['phone'] ?? ''),
                'email'        => is_email($loc['email'] ?? '') ? sanitize_email($loc['email']) : '',
                'enabled'      => !empty($loc['enabled']),
                'cost'         => self::sanitize_float($loc['cost'] ?? 0),
                'schedule'     => $schedule,
                'closed_dates' => array_values(array_unique($closed_dates)),
            ];
        }
        return $clean;
    }

    private static function sanitize_time(string $time): string {
        $time = trim($time);
        if (!preg_match('/^\d{1,2}:\d{2}$/', $time)) {
            return '';
        }
        [$h, $m] = explode(':', $time);
        $h = (int) $h;
        $m = (int) $m;
        if ($h < 0 || $h > 23 || $m < 0 || $m > 59) {
            return '';
        }
        return sprintf('%02d:%02d', $h, $m);
    }

    private static function sanitize_float($value): float {
        if (is_string($value)) {
            $value = str_replace(',', '.', $value);
        }
        return (float) $value;
    }

}
