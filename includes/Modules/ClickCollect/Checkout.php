<?php
/**
 * Pipeline checkout Clic & Collect.
 *
 * - Affiche les champs (lieu, date, créneau) sous la sélection d'expédition.
 * - Valide côté serveur lors du placement de la commande.
 * - Sauvegarde les méta-données sur la commande (HPOS-aware via API WC).
 * - Affiche les infos dans panier, page commande, emails et détail admin.
 */

namespace WeRocket\Tools\Modules\ClickCollect;

class Checkout {

    private ClickCollectModule $module;

    public function __construct(ClickCollectModule $module) {
        $this->module = $module;
    }

    public function init(): void {
        // Checkout legacy (shortcode) : injection juste après les méthodes d'expédition dans le review.
        add_action('woocommerce_review_order_after_shipping', [$this, 'render_checkout_fields']);

        // Checkout block (Gutenberg) : on rend un <template> caché dans le footer et JS l'injecte au bon endroit.
        add_action('wp_footer', [$this, 'render_block_template']);

        // Sauvegarde dans la session WC quand le client modifie (AJAX).
        add_action('wp_ajax_wr_cc_update_session', [$this, 'ajax_update_session']);
        add_action('wp_ajax_nopriv_wr_cc_update_session', [$this, 'ajax_update_session']);

        // Restitution depuis $_POST au checkout review (parsing du form).
        add_action('woocommerce_checkout_update_order_review', [$this, 'capture_post_data']);

        // Validation lors du placement — checkout legacy.
        add_action('woocommerce_after_checkout_validation', [$this, 'validate_checkout'], 10, 2);

        // Validation lors du placement — checkout block / Store API.
        add_action('woocommerce_store_api_checkout_update_order_from_request', [$this, 'validate_store_api'], 10, 2);

        // Sauvegarde sur la commande (fonctionne pour les deux flux).
        add_action('woocommerce_checkout_create_order', [$this, 'save_to_order'], 10, 2);
        add_action('woocommerce_store_api_checkout_update_order_from_request', [$this, 'save_store_api'], 20, 2);

        // Affichage frontend (Thank you / My Account order detail).
        add_action('woocommerce_order_details_after_order_table', [$this, 'render_order_details_block']);

        // Affichage emails.
        add_action('woocommerce_email_order_meta', [$this, 'render_email_block'], 10, 4);

        // Affichage dans le récap panier (note ligne d'expédition).
        add_filter('woocommerce_cart_shipping_method_full_label', [$this, 'append_pickup_label_in_cart'], 10, 2);

        // Enqueue assets sur checkout / cart.
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);

        // Inject config JS.
        add_action('wp_enqueue_scripts', [$this, 'localize_config'], 11);
    }

    public function enqueue_assets(): void {
        if (!function_exists('is_checkout')) {
            return;
        }
        if (!is_checkout() && !is_cart() && !is_wc_endpoint_url('order-pay')) {
            return;
        }
        wp_enqueue_style(
            'wr-clickcollect',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/css/clickcollect.css',
            [],
            WEROCKET_TOOLS_VERSION
        );
        // wc-checkout n'est pas chargé sur le checkout block — on n'en dépend pas.
        wp_enqueue_script(
            'wr-clickcollect',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/js/clickcollect-checkout.js',
            ['jquery'],
            WEROCKET_TOOLS_VERSION,
            true
        );
    }

    public function localize_config(): void {
        if (!wp_script_is('wr-clickcollect', 'enqueued')) {
            return;
        }
        $settings  = $this->module->get_settings();
        $locations = $this->module->get_enabled_locations();
        $payload   = [
            'shippingMethodId' => ClickCollectModule::SHIPPING_METHOD_ID,
            'ajaxUrl'          => admin_url('admin-ajax.php'),
            'nonce'            => wp_create_nonce('wr_cc_session'),
            'config'           => [
                'minLeadTimeHours' => (int) ($settings['enable_lead_time'] ? $settings['min_lead_time_hours'] : 0),
                'maxDaysAhead'     => (int) $settings['max_days_ahead'],
                'requireTimeSlot'  => (bool) $settings['require_time_slot'],
                'slotIntervalMin'  => (int) $settings['slot_interval_minutes'],
                'accent'           => (string) $settings['accent_color'],
                'accentText'       => (string) ($settings['accent_text_color'] ?? '#FFFFFF'),
                'panelBg'          => (string) ($settings['panel_bg_color'] ?? '#FAF8F4'),
                'panelBorder'      => (string) ($settings['panel_border_color'] ?? '#E7E1D5'),
                'textColor'        => (string) ($settings['text_color'] ?? '#1F2A37'),
                'title'            => (string) $settings['method_title'],
            ],
            'locations'        => $this->prepare_locations_for_js($locations),
            'i18n'             => [
                'chooseLocation' => __('Lieu de retrait', 'werocket-tools'),
                'chooseDate'     => __('Date de retrait', 'werocket-tools'),
                'chooseTime'     => __('Créneau horaire', 'werocket-tools'),
                'noSlots'        => __('Aucun créneau disponible ce jour-là.', 'werocket-tools'),
                'pickADay'       => __('— Sélectionnez une date —', 'werocket-tools'),
                'pickASlot'      => __('— Sélectionnez un créneau —', 'werocket-tools'),
                'pickALocation'  => __('— Sélectionnez un lieu —', 'werocket-tools'),
                'closed'         => __('Fermé', 'werocket-tools'),
                'leadHelp'       => __('Délai minimum de préparation : %d h.', 'werocket-tools'),
                'months'         => [
                    __('janvier', 'werocket-tools'),  __('février', 'werocket-tools'),
                    __('mars', 'werocket-tools'),     __('avril', 'werocket-tools'),
                    __('mai', 'werocket-tools'),      __('juin', 'werocket-tools'),
                    __('juillet', 'werocket-tools'),  __('août', 'werocket-tools'),
                    __('septembre', 'werocket-tools'),__('octobre', 'werocket-tools'),
                    __('novembre', 'werocket-tools'), __('décembre', 'werocket-tools'),
                ],
                'weekdaysShort'  => [
                    __('lun', 'werocket-tools'), __('mar', 'werocket-tools'),
                    __('mer', 'werocket-tools'), __('jeu', 'werocket-tools'),
                    __('ven', 'werocket-tools'), __('sam', 'werocket-tools'),
                    __('dim', 'werocket-tools'),
                ],
                'weekdaysLong'   => [
                    __('lundi', 'werocket-tools'),    __('mardi', 'werocket-tools'),
                    __('mercredi', 'werocket-tools'), __('jeudi', 'werocket-tools'),
                    __('vendredi', 'werocket-tools'),__('samedi', 'werocket-tools'),
                    __('dimanche', 'werocket-tools'),
                ],
                'pickupOn'       => __('Retrait le %s', 'werocket-tools'),
            ],
            'current'          => $this->read_session(),
        ];
        wp_localize_script('wr-clickcollect', 'WR_CC', $payload);
    }

    /**
     * @param array<int, array<string, mixed>> $locations
     */
    private function prepare_locations_for_js(array $locations): array {
        $out = [];
        foreach ($locations as $loc) {
            $out[] = [
                'id'          => (string) $loc['id'],
                'name'        => (string) $loc['name'],
                'address'     => (string) $loc['address'],
                'phone'       => (string) ($loc['phone'] ?? ''),
                'email'       => (string) ($loc['email'] ?? ''),
                'cost'        => (float) ($loc['cost'] ?? 0),
                'schedule'    => $this->module->get_location_schedule($loc),
                'closedDates' => array_values($loc['closed_dates'] ?? []),
            ];
        }
        return $out;
    }

    public function render_checkout_fields(): void {
        // Checkout legacy : wrap dans une ligne du tableau du review.
        ?>
        <tr class="wr-cc-wrapper" style="display:none;">
            <td colspan="2" style="padding:0;">
                <?php $this->render_fields_html(); ?>
            </td>
        </tr>
        <?php
    }

    public function render_block_template(): void {
        if (!function_exists('is_checkout')) {
            return;
        }
        if (!is_checkout() && !is_wc_endpoint_url('order-pay')) {
            return;
        }
        ?>
        <template id="wr-cc-fields-template">
            <div class="wr-cc-wrapper wr-cc-wrapper-block" style="display:none;">
                <?php $this->render_fields_html(); ?>
            </div>
        </template>
        <?php
    }

    private function render_fields_html(): void {
        ?>
        <div id="wr-cc-fields" class="wr-cc-fields">
            <header class="wr-cc-header">
                <span class="wr-cc-eyebrow"><?php esc_html_e('Retrait en magasin', 'werocket-tools'); ?></span>
                <h4 class="wr-cc-title"><?php esc_html_e('Choisissez votre créneau', 'werocket-tools'); ?></h4>
            </header>

            <div class="wr-cc-field">
                <label for="wr_cc_location" class="wr-cc-label">
                    <span class="wr-cc-label-num">01</span>
                    <?php esc_html_e('Lieu de retrait', 'werocket-tools'); ?>
                </label>
                <select name="wr_cc_location" id="wr_cc_location" class="wr-cc-select">
                    <option value=""><?php esc_html_e('— Sélectionnez un lieu —', 'werocket-tools'); ?></option>
                </select>
                <div class="wr-cc-location-info" id="wr_cc_location_info" hidden></div>
            </div>

            <div class="wr-cc-field wr-cc-field-date" id="wr_cc_field_date" hidden>
                <label class="wr-cc-label">
                    <span class="wr-cc-label-num">02</span>
                    <?php esc_html_e('Date de retrait', 'werocket-tools'); ?>
                </label>

                <div class="wr-cc-calendar" id="wr_cc_calendar" aria-label="<?php esc_attr_e('Calendrier de retrait', 'werocket-tools'); ?>">
                    <div class="wr-cc-cal-head">
                        <button type="button" class="wr-cc-cal-nav" data-dir="-1" aria-label="<?php esc_attr_e('Mois précédent', 'werocket-tools'); ?>">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <div class="wr-cc-cal-title" id="wr_cc_cal_title"></div>
                        <button type="button" class="wr-cc-cal-nav" data-dir="1" aria-label="<?php esc_attr_e('Mois suivant', 'werocket-tools'); ?>">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                    <div class="wr-cc-cal-weekdays" aria-hidden="true"></div>
                    <div class="wr-cc-cal-grid" id="wr_cc_cal_grid" role="grid"></div>
                    <div class="wr-cc-cal-legend">
                        <span><i class="wr-cc-lg wr-cc-lg-avail"></i><?php esc_html_e('Disponible', 'werocket-tools'); ?></span>
                        <span><i class="wr-cc-lg wr-cc-lg-sel"></i><?php esc_html_e('Sélectionné', 'werocket-tools'); ?></span>
                        <span><i class="wr-cc-lg wr-cc-lg-closed"></i><?php esc_html_e('Fermé', 'werocket-tools'); ?></span>
                    </div>
                </div>

                <input type="hidden" name="wr_cc_date" id="wr_cc_date" value="">
                <p class="wr-cc-selected-date" id="wr_cc_selected_date" hidden></p>
            </div>

            <div class="wr-cc-field wr-cc-field-time" id="wr_cc_field_time" hidden>
                <label class="wr-cc-label">
                    <span class="wr-cc-label-num">03</span>
                    <?php esc_html_e('Créneau horaire', 'werocket-tools'); ?>
                </label>
                <div class="wr-cc-slots" id="wr_cc_slots" role="radiogroup" aria-label="<?php esc_attr_e('Créneaux disponibles', 'werocket-tools'); ?>"></div>
                <p class="wr-cc-slots-empty" id="wr_cc_slots_empty" hidden><?php esc_html_e('Aucun créneau disponible ce jour-là.', 'werocket-tools'); ?></p>
                <input type="hidden" name="wr_cc_time" id="wr_cc_time" value="">
            </div>

            <p class="wr-cc-lead-help" id="wr_cc_lead_help"></p>
        </div>
        <?php
    }

    public function capture_post_data(string $post_data): void {
        parse_str($post_data, $parsed);
        $location = isset($parsed['wr_cc_location']) ? sanitize_key((string) $parsed['wr_cc_location']) : '';
        $date     = isset($parsed['wr_cc_date']) ? sanitize_text_field((string) $parsed['wr_cc_date']) : '';
        $time     = isset($parsed['wr_cc_time']) ? sanitize_text_field((string) $parsed['wr_cc_time']) : '';

        $this->write_session([
            'location' => $location,
            'date'     => $date,
            'time'     => $time,
        ]);
    }

    public function ajax_update_session(): void {
        check_ajax_referer('wr_cc_session', 'nonce');
        $data = [
            'location' => isset($_POST['location']) ? sanitize_key((string) wp_unslash($_POST['location'])) : '',
            'date'     => isset($_POST['date']) ? sanitize_text_field((string) wp_unslash($_POST['date'])) : '',
            'time'     => isset($_POST['time']) ? sanitize_text_field((string) wp_unslash($_POST['time'])) : '',
        ];
        $this->write_session($data);
        wp_send_json_success($data);
    }

    private function write_session(array $data): void {
        if (!function_exists('WC') || !WC()->session) {
            return;
        }
        WC()->session->set('wr_cc_selection', $data);
    }

    private function read_session(): array {
        if (!function_exists('WC') || !WC()->session) {
            return ['location' => '', 'date' => '', 'time' => ''];
        }
        $data = WC()->session->get('wr_cc_selection');
        if (!is_array($data)) {
            return ['location' => '', 'date' => '', 'time' => ''];
        }
        return [
            'location' => (string) ($data['location'] ?? ''),
            'date'     => (string) ($data['date'] ?? ''),
            'time'     => (string) ($data['time'] ?? ''),
        ];
    }

    public function validate_checkout($data, $errors): void {
        $chosen = (array) WC()->session->get('chosen_shipping_methods', []);
        $is_cc  = false;
        foreach ($chosen as $method) {
            if (strpos((string) $method, ClickCollectModule::SHIPPING_METHOD_ID) === 0) {
                $is_cc = true;
                break;
            }
        }
        if (!$is_cc) {
            return;
        }

        $settings  = $this->module->get_settings();
        $selection = $this->read_session();

        $location  = $selection['location'];
        $date      = $selection['date'];
        $time      = $selection['time'];
        $require_time = !empty($settings['require_time_slot']);
        $block     = !empty($settings['block_unavailable']);

        if ($location === '') {
            $errors->add('wr_cc_location', __('Veuillez choisir un lieu de retrait.', 'werocket-tools'));
            return;
        }
        $location_data = $this->module->get_location_by_id($location);
        if (!$location_data) {
            $errors->add('wr_cc_location', __('Le lieu de retrait sélectionné n\'est plus disponible.', 'werocket-tools'));
            return;
        }
        if ($date === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $errors->add('wr_cc_date', __('Veuillez choisir une date de retrait valide.', 'werocket-tools'));
            return;
        }
        if ($require_time && ($time === '' || !preg_match('/^\d{2}:\d{2}$/', $time))) {
            $errors->add('wr_cc_time', __('Veuillez choisir un créneau horaire.', 'werocket-tools'));
            return;
        }

        if ($block && !$this->is_pickup_valid($location_data, $date, $require_time ? $time : '', $settings)) {
            $errors->add('wr_cc_slot', __('Le créneau de retrait choisi n\'est plus disponible. Merci d\'en choisir un autre.', 'werocket-tools'));
        }
    }

    /**
     * Validation pour le checkout Block / Store API.
     * Doit lever une exception pour bloquer le placement.
     */
    public function validate_store_api(\WC_Order $order, $request): void {
        if (!self::order_uses_click_collect($order)) {
            return;
        }

        $settings  = $this->module->get_settings();
        $selection = $this->read_session();
        $location  = $selection['location'];
        $date      = $selection['date'];
        $time      = $selection['time'];
        $require_time = !empty($settings['require_time_slot']);
        $block        = !empty($settings['block_unavailable']);

        $exception_class = '\\Automattic\\WooCommerce\\StoreApi\\Exceptions\\RouteException';
        if (!class_exists($exception_class)) {
            return; // ancien WC sans Store API : on laisse passer (rare).
        }

        $fail = static function (string $msg) use ($exception_class) {
            throw new $exception_class('wr_cc_invalid', $msg, 400);
        };

        if ($location === '') {
            $fail(__('Veuillez choisir un lieu de retrait.', 'werocket-tools'));
        }
        $location_data = $this->module->get_location_by_id($location);
        if (!$location_data) {
            $fail(__('Le lieu de retrait sélectionné n\'est plus disponible.', 'werocket-tools'));
        }
        if ($date === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $fail(__('Veuillez choisir une date de retrait valide.', 'werocket-tools'));
        }
        if ($require_time && ($time === '' || !preg_match('/^\d{2}:\d{2}$/', $time))) {
            $fail(__('Veuillez choisir un créneau horaire.', 'werocket-tools'));
        }
        if ($block && !$this->is_pickup_valid($location_data, $date, $require_time ? $time : '', $settings)) {
            $fail(__('Le créneau de retrait choisi n\'est plus disponible. Merci d\'en choisir un autre.', 'werocket-tools'));
        }
    }

    /**
     * Persiste les méta-données pour le checkout Block.
     * `woocommerce_checkout_create_order` peut ne pas être déclenché correctement
     * sur le flux Store API ; on duplique ici par sécurité.
     */
    public function save_store_api(\WC_Order $order, $request): void {
        if (!self::order_uses_click_collect($order)) {
            return;
        }

        // Si les méta-données existent déjà (legacy hook), pas de doublon.
        if ($order->get_meta(ClickCollectModule::META_LOCATION_ID)) {
            return;
        }

        $selection = $this->read_session();
        $location  = $this->module->get_location_by_id($selection['location']);
        if (!$location) {
            return;
        }
        $order->update_meta_data(ClickCollectModule::META_LOCATION_ID, (string) $location['id']);
        $order->update_meta_data(ClickCollectModule::META_LOCATION_NAME, (string) $location['name']);
        $order->update_meta_data(ClickCollectModule::META_LOCATION_ADDR, (string) $location['address']);
        $order->update_meta_data(ClickCollectModule::META_PICKUP_DATE, (string) $selection['date']);
        $order->update_meta_data(ClickCollectModule::META_PICKUP_TIME, (string) $selection['time']);
    }

    private function is_pickup_valid(array $location, string $date, string $time, array $settings): bool {
        // Date <= aujourd'hui ? => invalid sauf delta = 0 et jour-même autorisé
        try {
            $tz = wp_timezone();
            $now = new \DateTimeImmutable('now', $tz);
            $pickup_day = new \DateTimeImmutable($date . ' 00:00:00', $tz);
        } catch (\Exception $e) {
            return false;
        }

        // Date dans la fenêtre [aujourd'hui, max_days_ahead]
        $today_midnight = $now->setTime(0, 0, 0);
        $max_date = $today_midnight->modify('+' . max(1, (int) $settings['max_days_ahead']) . ' days');
        if ($pickup_day < $today_midnight || $pickup_day > $max_date) {
            return false;
        }

        // Fermetures
        if (in_array($date, $location['closed_dates'] ?? [], true)) {
            return false;
        }

        // Jour de la semaine ouvert ?
        $day_key = $this->day_key_of($pickup_day);
        $schedule = $this->module->get_location_schedule($location);
        $day = $schedule[$day_key] ?? null;
        if (!$day || empty($day['enabled']) || empty($day['slots'])) {
            return false;
        }

        // Lead time
        $min_lead = !empty($settings['enable_lead_time']) ? (int) $settings['min_lead_time_hours'] : 0;
        if ($min_lead > 0) {
            $earliest = $now->modify('+' . $min_lead . ' hours');
            if ($time !== '') {
                $pickup_dt = new \DateTimeImmutable($date . ' ' . $time . ':00', $tz);
                if ($pickup_dt < $earliest) {
                    return false;
                }
            } else {
                // pas de créneau imposé : on prend la fin de la dernière plage du jour
                $last_slot = end($day['slots']);
                if (!$last_slot) return false;
                $last_dt = new \DateTimeImmutable($date . ' ' . $last_slot['end'] . ':00', $tz);
                if ($last_dt < $earliest) {
                    return false;
                }
            }
        }

        // Créneau ⊂ plages d'ouverture
        if ($time !== '') {
            $in_range = false;
            foreach ($day['slots'] as $slot) {
                if ($time >= $slot['start'] && $time < $slot['end']) {
                    $in_range = true;
                    break;
                }
            }
            if (!$in_range) {
                return false;
            }
        }

        return true;
    }

    private function day_key_of(\DateTimeImmutable $date): string {
        $map = ['Mon' => 'mon','Tue' => 'tue','Wed' => 'wed','Thu' => 'thu','Fri' => 'fri','Sat' => 'sat','Sun' => 'sun'];
        return $map[$date->format('D')] ?? 'mon';
    }

    /**
     * La commande passe-t-elle par le mode d'expédition Clic & Collect ?
     * Utilisé comme garde d'entrée par les trois hooks de persistance
     * (checkout classique, Store API validate, Store API save).
     */
    private static function order_uses_click_collect(\WC_Order $order): bool {
        foreach ($order->get_shipping_methods() as $sm) {
            if ($sm->get_method_id() === ClickCollectModule::SHIPPING_METHOD_ID) {
                return true;
            }
        }
        return false;
    }

    public function save_to_order(\WC_Order $order, array $data): void {
        if (!self::order_uses_click_collect($order)) {
            return;
        }

        $selection = $this->read_session();
        $location  = $this->module->get_location_by_id($selection['location']);
        if (!$location) {
            return;
        }

        $order->update_meta_data(ClickCollectModule::META_LOCATION_ID, (string) $location['id']);
        $order->update_meta_data(ClickCollectModule::META_LOCATION_NAME, (string) $location['name']);
        $order->update_meta_data(ClickCollectModule::META_LOCATION_ADDR, (string) $location['address']);
        $order->update_meta_data(ClickCollectModule::META_PICKUP_DATE, (string) $selection['date']);
        $order->update_meta_data(ClickCollectModule::META_PICKUP_TIME, (string) $selection['time']);
    }

    public function append_pickup_label_in_cart(string $label, $method): string {
        $settings = $this->module->get_settings();
        if (empty($settings['show_in_cart'])) {
            return $label;
        }
        if (!is_object($method) || !method_exists($method, 'get_method_id')) {
            return $label;
        }
        if ($method->get_method_id() !== ClickCollectModule::SHIPPING_METHOD_ID) {
            return $label;
        }
        $sel = $this->read_session();
        if ($sel['location'] === '') {
            return $label;
        }
        $location = $this->module->get_location_by_id($sel['location']);
        if (!$location) {
            return $label;
        }
        $parts = [];
        $parts[] = esc_html($location['name']);
        if ($sel['date']) {
            $parts[] = esc_html($this->format_date($sel['date']));
        }
        if ($sel['time']) {
            $parts[] = esc_html($sel['time']);
        }
        return $label . '<br><small class="wr-cc-cart-pickup">' . implode(' • ', $parts) . '</small>';
    }

    public function render_order_details_block(\WC_Order $order): void {
        $settings = $this->module->get_settings();
        if (empty($settings['show_in_order'])) {
            return;
        }
        $payload = $this->get_order_pickup_data($order);
        if (!$payload) {
            return;
        }
        $this->render_pickup_block($payload, $settings);
    }

    public function render_email_block($order, $sent_to_admin, $plain_text, $email): void {
        $settings = $this->module->get_settings();
        if (empty($settings['show_in_emails'])) {
            return;
        }
        if (!$order instanceof \WC_Order) {
            return;
        }
        $payload = $this->get_order_pickup_data($order);
        if (!$payload) {
            return;
        }
        if ($plain_text) {
            echo "\n--- " . esc_html__('Retrait en magasin', 'werocket-tools') . " ---\n";
            echo esc_html($payload['name']) . "\n";
            if (!empty($payload['address'])) echo esc_html($payload['address']) . "\n";
            echo esc_html__('Date', 'werocket-tools') . ' : ' . esc_html($this->format_date($payload['date'])) . "\n";
            if (!empty($payload['time'])) {
                echo esc_html__('Créneau', 'werocket-tools') . ' : ' . esc_html($payload['time']) . "\n";
            }
            return;
        }
        $this->render_pickup_block($payload, $settings, true);
    }

    private function get_order_pickup_data(\WC_Order $order): ?array {
        $location_id = $order->get_meta(ClickCollectModule::META_LOCATION_ID);
        if (!$location_id) {
            return null;
        }
        return [
            'id'      => (string) $location_id,
            'name'    => (string) $order->get_meta(ClickCollectModule::META_LOCATION_NAME),
            'address' => (string) $order->get_meta(ClickCollectModule::META_LOCATION_ADDR),
            'date'    => (string) $order->get_meta(ClickCollectModule::META_PICKUP_DATE),
            'time'    => (string) $order->get_meta(ClickCollectModule::META_PICKUP_TIME),
        ];
    }

    private function render_pickup_block(array $payload, array $settings, bool $is_email = false): void {
        $accent = $settings['accent_color'] ?? '#0F766E';
        $instr  = (string) ($settings['instructions'] ?? '');
        ?>
        <div class="wr-cc-pickup-block" style="border:1px solid <?php echo esc_attr($accent); ?>33;border-left:4px solid <?php echo esc_attr($accent); ?>;padding:16px 20px;margin:24px 0;background:#fff;border-radius:8px;">
            <h2 style="margin:0 0 12px;font-size:16px;color:<?php echo esc_attr($accent); ?>;">
                <?php esc_html_e('Retrait en magasin', 'werocket-tools'); ?>
            </h2>
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="padding:4px 0;width:40%;color:#555;"><?php esc_html_e('Lieu', 'werocket-tools'); ?></td>
                    <td style="padding:4px 0;font-weight:600;"><?php echo esc_html($payload['name']); ?></td>
                </tr>
                <?php if (!empty($payload['address'])): ?>
                <tr>
                    <td style="padding:4px 0;color:#555;vertical-align:top;"><?php esc_html_e('Adresse', 'werocket-tools'); ?></td>
                    <td style="padding:4px 0;"><?php echo nl2br(esc_html($payload['address'])); ?></td>
                </tr>
                <?php endif; ?>
                <tr>
                    <td style="padding:4px 0;color:#555;"><?php esc_html_e('Date', 'werocket-tools'); ?></td>
                    <td style="padding:4px 0;font-weight:600;"><?php echo esc_html($this->format_date($payload['date'])); ?></td>
                </tr>
                <?php if (!empty($payload['time'])): ?>
                <tr>
                    <td style="padding:4px 0;color:#555;"><?php esc_html_e('Créneau', 'werocket-tools'); ?></td>
                    <td style="padding:4px 0;font-weight:600;"><?php echo esc_html($payload['time']); ?></td>
                </tr>
                <?php endif; ?>
            </table>
            <?php if ($instr !== ''): ?>
                <p style="margin:12px 0 0;padding:10px;background:<?php echo esc_attr($accent); ?>0d;border-radius:6px;font-size:13px;color:#333;">
                    <?php echo esc_html($instr); ?>
                </p>
            <?php endif; ?>
        </div>
        <?php
    }

    private function format_date(string $iso_date): string {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $iso_date)) {
            return $iso_date;
        }
        $ts = strtotime($iso_date);
        if (!$ts) return $iso_date;
        return wp_date(get_option('date_format', 'd/m/Y'), $ts);
    }
}
