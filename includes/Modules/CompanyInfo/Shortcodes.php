<?php
/**
 * Shortcodes du module Infos société.
 *
 * - [werocket_legal type="mentions|privacy|cgv"]   → page légale (avec variables résolues)
 * - [company_info field="name|siret|..."]         → un champ unique
 * - [company_logo size="medium" class=""]         → balise <img> du logo
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

class Shortcodes {

    private CompanyInfoModule $module;
    private VariableResolver $resolver;

    public function __construct(CompanyInfoModule $module) {
        $this->module   = $module;
        $this->resolver = new VariableResolver($module);

        add_shortcode('werocket_legal', [$this, 'render_legal']);
        add_shortcode('company_info',   [$this, 'render_field']);
        add_shortcode('company_logo',   [$this, 'render_logo']);

        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
    }

    /**
     * Enregistre (sans charger) la feuille de style des pages légales.
     * L'enqueue effectif est conditionnel : il a lieu dans render_legal(),
     * uniquement sur les pages contenant le shortcode.
     */
    public function register_assets(): void {
        wp_register_style(
            'wr-legal',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/css/legal.css',
            [],
            WEROCKET_TOOLS_VERSION
        );
    }

    /**
     * @param array<string,string>|string $atts
     */
    public function render_legal($atts): string {
        $atts = shortcode_atts(['type' => 'mentions'], (array) $atts, 'werocket_legal');
        $allowed = ['mentions' => 'legal_mentions', 'privacy' => 'legal_privacy', 'cgv' => 'legal_cgv'];
        $key = $allowed[$atts['type']] ?? null;
        if (!$key) return '';

        $settings = $this->module->get_settings();
        $content = (string) ($settings[$key] ?? '');
        if ($content === '') return '';

        $rendered = $this->resolver->render($content);
        $allowed_html = wp_kses_allowed_html('post');

        // Charge le style uniquement quand le shortcode est réellement affiché.
        // wp_register_style a déjà tourné sur wp_enqueue_scripts ; en cas
        // d'enqueue tardif (dans le_content), WP imprime la feuille en footer.
        wp_enqueue_style('wr-legal');

        return '<div class="werocket-legal werocket-legal--' . esc_attr($atts['type']) . '">' .
            wp_kses($rendered, $allowed_html) .
            '</div>';
    }

    /**
     * @param array<string,string>|string $atts
     */
    public function render_field($atts): string {
        $atts = shortcode_atts(['field' => 'name'], (array) $atts, 'company_info');
        $field = sanitize_text_field($atts['field']);

        // Permet field="site.name" ou field="name" (par défaut namespace "company")
        if (str_contains($field, '.')) {
            $key = $field;
        } else {
            $key = 'company.' . sanitize_key($field);
        }

        $rendered = $this->resolver->render('{' . $key . '}');

        // Si non résolu (variable inconnue), retourne vide plutôt que la variable littérale.
        if (str_starts_with($rendered, '{')) return '';

        return esc_html($rendered);
    }

    /**
     * @param array<string,string>|string $atts
     */
    public function render_logo($atts): string {
        $atts = shortcode_atts([
            'size'  => 'medium',
            'class' => '',
            'alt'   => '',
        ], (array) $atts, 'company_logo');

        $settings = $this->module->get_settings();
        $id = (int) ($settings['logo_id'] ?? 0);
        if (!$id) return '';

        $alt = $atts['alt'] !== '' ? $atts['alt'] : (string) ($settings['name'] ?? '');
        $classes = trim('werocket-company-logo ' . sanitize_html_class($atts['class']));

        return (string) wp_get_attachment_image($id, sanitize_key($atts['size']) ?: 'medium', false, [
            'class' => $classes,
            'alt'   => esc_attr($alt),
        ]);
    }
}
