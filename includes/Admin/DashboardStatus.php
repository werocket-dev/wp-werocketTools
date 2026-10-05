<?php
/**
 * État du tableau de bord admin : environnement (versions, WooCommerce,
 * mise à jour disponible) et liste « À traiter » calculée à partir des
 * réglages réels de chaque module actif.
 */

namespace WeRocket\Tools\Admin;

use WeRocket\Tools\Modules\Cookies\Scanner\ScanStorage;
use WeRocket\Tools\Modules\ModuleManager;

class DashboardStatus {

    /** Un scan resté « running » au-delà de ce délai est considéré bloqué. */
    private const STUCK_SCAN_AFTER = HOUR_IN_SECONDS;

    private ModuleManager $module_manager;

    public function __construct(ModuleManager $module_manager) {
        $this->module_manager = $module_manager;
    }

    public function get(): array {
        $all    = $this->module_manager->get_all_modules();
        $active = $this->module_manager->get_active_modules();

        return [
            'user'        => wp_get_current_user()->display_name,
            'plugin'      => [
                'version' => WEROCKET_TOOLS_VERSION,
                'update'  => $this->available_update(),
            ],
            'wordpress'   => get_bloginfo('version'),
            'woocommerce' => defined('WC_VERSION') ? WC_VERSION : null,
            'modules'     => [
                'active' => count($active),
                'total'  => count($all),
            ],
            'alerts'      => $this->alerts(array_keys($active)),
        ];
    }

    /** Version disponible détectée par Plugin Update Checker, ou null. */
    private function available_update(): ?string {
        $updates = get_site_transient('update_plugins');
        $item    = is_object($updates) ? ($updates->response[WEROCKET_TOOLS_PLUGIN_BASENAME] ?? null) : null;
        $version = is_object($item) ? (string) ($item->new_version ?? '') : '';
        return $version !== '' && version_compare($version, WEROCKET_TOOLS_VERSION, '>') ? $version : null;
    }

    /**
     * @param string[] $active_ids
     * @return array<int, array{id:string, module:string, title:string, hint:string, action:string, section:string}>
     */
    private function alerts(array $active_ids): array {
        $alerts = [];
        $is = static fn(string $id): bool => in_array($id, $active_ids, true);

        if ($is('cookies')) {
            array_push($alerts, ...$this->cookies_alerts($is('company_info')));
        }
        if ($is('google_reviews')) {
            $place_id = $this->settings('google_reviews')['google_place_id'] ?? '';
            if (trim((string) $place_id) === '') {
                $alerts[] = $this->alert('reviews_place_id', 'google_reviews',
                    __('Renseignez l\'identifiant de votre fiche Google', 'werocket-tools'),
                    __('Sans Place ID, aucun avis ne peut être affiché.', 'werocket-tools'),
                    __('Configurer', 'werocket-tools'));
            }
        }
        if ($is('company_info')) {
            $company = $this->settings('company_info');
            if (trim((string) ($company['siret'] ?? '')) === '' || trim((string) ($company['name'] ?? '')) === '') {
                $alerts[] = $this->alert('company_identity', 'company_info',
                    __('Complétez les informations de votre société', 'werocket-tools'),
                    __('Elles alimentent les mentions légales et la politique de confidentialité.', 'werocket-tools'),
                    __('Compléter', 'werocket-tools'));
            }
        }

        $woo_active = class_exists('WooCommerce');
        foreach (['retractation', 'click_collect'] as $id) {
            if ($is($id) && !$woo_active) {
                $alerts[] = $this->alert($id . '_woocommerce', $id,
                    __('WooCommerce n\'est pas actif', 'werocket-tools'),
                    __('Ce module reste inopérant tant que WooCommerce n\'est pas activé.', 'werocket-tools'),
                    __('Voir', 'werocket-tools'));
            }
        }
        if ($is('click_collect') && $woo_active) {
            $locations = $this->settings('click_collect')['locations'] ?? [];
            $enabled   = array_filter((array) $locations, static fn($l) => is_array($l) && !empty($l['enabled']));
            if (!$enabled) {
                $alerts[] = $this->alert('click_collect_locations', 'click_collect',
                    __('Ajoutez un lieu de retrait actif', 'werocket-tools'),
                    __('Le Clic & Collect n\'est pas proposé au checkout sans lieu actif.', 'werocket-tools'),
                    __('Ajouter', 'werocket-tools'));
            }
        }

        return $alerts;
    }

    private function cookies_alerts(bool $company_info_active): array {
        $alerts   = [];
        $settings = $this->settings('cookies');
        $texts    = (array) ($settings['texts'] ?? []);

        if (trim((string) ($texts['privacy_policy_url'] ?? '')) === '' || trim((string) ($texts['imprint_url'] ?? '')) === '') {
            $alerts[] = $this->alert('cookies_legal_links', 'cookies',
                __('Liez votre politique de confidentialité et vos mentions légales au bandeau', 'werocket-tools'),
                $company_info_active
                    ? __('Les pages peuvent être générées depuis Infos société.', 'werocket-tools')
                    : __('Renseignez leurs URL dans les textes du bandeau.', 'werocket-tools'),
                __('Lier les pages', 'werocket-tools'), 'texts');
        }

        $stuck = array_filter(
            (new ScanStorage())->get_all_lite(),
            static fn(array $s): bool => ($s['status'] ?? '') === ScanStorage::STATUS_RUNNING
                && (int) ($s['started_at'] ?? 0) < time() - self::STUCK_SCAN_AFTER
        );
        if ($stuck) {
            $oldest = min(array_map(static fn(array $s): int => (int) $s['started_at'], $stuck));
            $alerts[] = $this->alert('cookies_stuck_scans', 'cookies',
                sprintf(
                    /* translators: 1: number of scans, 2: date */
                    _n('%1$d scan de cookies est resté bloqué depuis le %2$s', '%1$d scans de cookies sont restés bloqués depuis le %2$s', count($stuck), 'werocket-tools'),
                    count($stuck),
                    wp_date('j F', $oldest)
                ),
                __('Relancez un scan pour détecter les nouveaux traceurs.', 'werocket-tools'),
                __('Relancer', 'werocket-tools'), 'services');
        }

        $prechecked = array_filter(
            (array) ($settings['services'] ?? []),
            static fn($s) => is_array($s) && !empty($s['enabled']) && empty($s['required']) && !empty($s['default'])
        );
        if (!empty($settings['default']) || $prechecked) {
            $alerts[] = $this->alert('cookies_prechecked', 'cookies',
                __('Les services sont pré-cochés par défaut', 'werocket-tools'),
                __('Le RGPD exige un consentement actif du visiteur.', 'werocket-tools'),
                __('Corriger', 'werocket-tools'), !empty($settings['default']) ? 'behavior' : 'services');
        }

        return $alerts;
    }

    private function settings(string $module_id): array {
        $module = $this->module_manager->get_module($module_id);
        return $module ? $module->get_settings() : [];
    }

    /** $section : sous-onglet de la page du module à ouvrir (paramètre ?section=). */
    private function alert(string $id, string $module, string $title, string $hint, string $action, string $section = ''): array {
        return compact('id', 'module', 'title', 'hint', 'action', 'section');
    }
}
