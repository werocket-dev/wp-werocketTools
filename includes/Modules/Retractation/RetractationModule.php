<?php
/**
 * Module Rétractation — orchestrateur.
 *
 * Formulaire de rétractation en ligne (obligation B2C, ~2026).
 * Le module enregistre la demande, envoie un AR sur support durable
 * (email), notifie le marchand et trace la demande sur la commande.
 *
 * AUCUN remboursement automatique. Le remboursement reste manuel.
 */

namespace WeRocket\Tools\Modules\Retractation;

use WeRocket\Tools\Modules\AbstractModule;

class RetractationModule extends AbstractModule {

    protected string $id = 'retractation';
    protected string $name = 'Rétractation (WooCommerce)';
    protected string $description = 'Formulaire de rétractation en ligne conforme à l\'obligation B2C 2026, avec accusé de réception sur support durable.';
    protected string $icon = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6"/></svg>';
    protected string $option_key = 'werocket_retractation_settings';

    public function init(): void {
        // Compat WooCommerce : graceful degradation si WC absent.
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', [$this, 'render_woocommerce_missing_notice']);
            return;
        }

        // Crée / migre la table custom si nécessaire (version-checked).
        Install::maybe_run();

        $repository = new Repository();

        // Frontend (endpoint My Account + shortcode + handler PRG).
        (new Frontend($repository))->init();

        // Emails (enregistre WC_Email + dispatch sur l'action wr_retractation_received).
        (new Emails($repository))->init();

        // RGPD — exporter + eraser (anonymisation).
        (new Privacy($repository))->init();

        if (is_admin()) {
            (new Admin($repository))->init();
        }
    }

    public function render_settings(): void {}

    protected function get_default_settings(): array {
        return [
            'page_title'         => __('Demande de rétractation', 'werocket-tools'),
            'endpoint_slug'      => 'retractation',
            'merchant_notify'    => true,
            'merchant_email'     => '', // si vide => admin_email
            'show_legal_notice'  => true,
            'frontend_color'     => '#0F766E',
            'email_color'        => '#0F766E',
            'email_bg_color'     => '#FAF8F4',
            'email_surface_color' => '#FFFFFF',
            'email_logo_id'      => 0,
            'email_logo_url'     => '',
        ];
    }

    protected function sanitize_settings(array $data): array {
        return [
            'page_title'        => sanitize_text_field($data['page_title'] ?? __('Demande de rétractation', 'werocket-tools')),
            'endpoint_slug'     => sanitize_title($data['endpoint_slug'] ?? 'retractation'),
            'merchant_notify'   => !empty($data['merchant_notify']),
            'merchant_email'    => is_email($data['merchant_email'] ?? '') ? sanitize_email($data['merchant_email']) : '',
            'show_legal_notice' => !empty($data['show_legal_notice']),
            'frontend_color'      => self::sanitize_hex_color($data['frontend_color'] ?? '#0F766E', '#0F766E'),
            'email_color'         => self::sanitize_hex_color($data['email_color'] ?? '#0F766E', '#0F766E'),
            'email_bg_color'      => self::sanitize_hex_color($data['email_bg_color'] ?? '#FAF8F4', '#FAF8F4'),
            'email_surface_color' => self::sanitize_hex_color($data['email_surface_color'] ?? '#FFFFFF', '#FFFFFF'),
            'email_logo_id'       => absint($data['email_logo_id'] ?? 0),
            'email_logo_url'      => esc_url_raw($data['email_logo_url'] ?? ''),
        ];
    }

    private static function sanitize_hex_color(string $hex, string $fallback = '#0F766E'): string {
        $hex = trim($hex);
        if (preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $hex)) {
            return strtolower($hex);
        }
        return $fallback;
    }

    public function render_woocommerce_missing_notice(): void {
        echo '<div class="notice notice-warning"><p>';
        esc_html_e('Le module Rétractation de WeRocket Tools nécessite WooCommerce 8.2+.', 'werocket-tools');
        echo '</p></div>';
    }

    /** Appelé à la désactivation du plugin. */
    public static function on_plugin_deactivate(): void {
        flush_rewrite_rules();
    }
}
