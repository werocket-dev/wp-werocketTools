<?php
/**
 * Company Info Module - Identité & pages légales (mentions, privacy, CGV)
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

use WeRocket\Tools\Modules\AbstractModule;

class CompanyInfoModule extends AbstractModule {

    protected string $id = 'company_info';
    protected string $name = 'Infos société';
    protected string $description = 'Récupère les infos société via SIRET (API gouv.fr) et gère mentions légales / politique de confidentialité / CGV avec variables.';
    protected string $icon = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
    protected string $option_key = 'werocket_company_info_settings';

    public function init(): void {
        new Shortcodes($this);
        new RestApi($this);

        // Enregistre le CPT singleton "werocket_company" mirror des settings.
        // Le post est créé/mis à jour automatiquement à chaque save (cf.
        // override save_settings ci-dessous).
        Cpt::register();

        // Charge les template tags publics (werocket_company_logo, etc.)
        require_once __DIR__ . '/template-tags.php';

        // Intégration native Breakdance — expose nos champs dans le
        // Dynamic Data chooser sous "Infos société". No-op si Breakdance
        // n'est pas actif sur le site.
        BreakdanceIntegration::register();

        // Personnalisation wp-login.php (no-op si désactivé dans les settings).
        new LoginCustomizer($this);
    }

    /**
     * Override de AbstractModule::save_settings pour déclencher la synchro
     * du CPT singleton après chaque enregistrement.
     *
     * La sync est encapsulée dans try/catch pour ne JAMAIS faire échouer
     * la sauvegarde principale (le settings option est déjà persisté à ce
     * stade). Une erreur de sync (post_type non enregistré, attachment
     * supprimé, conflit de slug, etc.) est loggée puis ignorée.
     */
    public function save_settings(array $data): bool {
        // Log la taille du payload pour debug en prod
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                '[WeRocketTools] company_info save : %d keys, %d bytes payload',
                count($data),
                strlen((string) wp_json_encode($data))
            ));
        }

        try {
            $result = parent::save_settings($data);
        } catch (\Throwable $e) {
            error_log(
                '[WeRocketTools] parent::save_settings threw : '
                . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine()
            );
            throw $e; // remonte au handler REST qui le formate en JSON
        }

        if ($result) {
            try {
                Cpt::sync_from_settings($this->get_settings());
            } catch (\Throwable $e) {
                error_log(
                    '[WeRocketTools] CPT sync failed during company_info save : '
                    . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine()
                );
                // Pas de re-throw : le save principal a réussi, le CPT
                // pourra être re-synchronisé au prochain save.
            }
        }
        return $result;
    }

    protected function get_default_settings(): array {
        return [
            // Identité légale
            'siren'           => '',
            'siret'           => '',
            'name'            => '',          // raison sociale
            'commercial_name' => '',          // enseigne
            'legal_form'      => '',          // SARL, SAS...
            'capital'         => '',          // capital social
            'rcs'             => '',          // RCS Ville + numéro
            'vat'             => '',          // TVA intracom
            'ape_code'        => '',
            'ape_label'       => '',
            'director'        => '',          // nom dirigeant
            'creation_date'   => '',

            // Coordonnées
            'street'          => '',
            'postal_code'     => '',
            'city'            => '',
            'country'         => 'France',
            'phone'           => '',
            'email'           => '',
            'website'         => '',
            'logo_id'         => 0,           // ID média WP

            // Personnalisation page de connexion WordPress
            'login_enabled'      => false,
            'login_show_logo'    => true,
            'login_cover_id'     => 0,        // ID média WP (image cover colonne droite)
            'login_logo_size'    => 64,       // hauteur du logo en px (32–160)
            'login_button_bg_color'   => '',  // '' = couleur WordPress par défaut
            'login_button_text_color' => '',

            // Pages légales (HTML enrichi avec variables {company.x}) —
            // templates agence pré-remplis, modifiables ensuite dans l'admin
            'legal_mentions'  => $this->default_legal_content('mentions'),
            'legal_privacy'   => $this->default_legal_content('privacy'),
            'legal_cgv'       => '',
        ];
    }

    /**
     * Contenu légal par défaut, stocké en HTML dans legal-defaults/ pour ne
     * pas alourdir la classe. Les variables {company.x} / {site.x} sont
     * résolues à l'affichage, donc le même template sert à tous les sites.
     */
    private function default_legal_content(string $type): string {
        $file = __DIR__ . '/legal-defaults/' . $type . '.html';
        return is_readable($file) ? (string) file_get_contents($file) : '';
    }

    protected function sanitize_settings(array $data): array {
        $current = $this->get_settings();

        $sanitized = [
            'siren'           => $this->sanitize_digits($data['siren'] ?? '', 9),
            'siret'           => $this->sanitize_digits($data['siret'] ?? '', 14),
            'name'            => sanitize_text_field((string) ($data['name'] ?? '')),
            'commercial_name' => sanitize_text_field((string) ($data['commercial_name'] ?? '')),
            'legal_form'      => sanitize_text_field((string) ($data['legal_form'] ?? '')),
            'capital'         => sanitize_text_field((string) ($data['capital'] ?? '')),
            'rcs'             => sanitize_text_field((string) ($data['rcs'] ?? '')),
            'vat'             => sanitize_text_field((string) ($data['vat'] ?? '')),
            'ape_code'        => sanitize_text_field((string) ($data['ape_code'] ?? '')),
            'ape_label'       => sanitize_text_field((string) ($data['ape_label'] ?? '')),
            'director'        => sanitize_text_field((string) ($data['director'] ?? '')),
            'creation_date'   => sanitize_text_field((string) ($data['creation_date'] ?? '')),

            'street'          => sanitize_text_field((string) ($data['street'] ?? '')),
            'postal_code'     => sanitize_text_field((string) ($data['postal_code'] ?? '')),
            'city'            => sanitize_text_field((string) ($data['city'] ?? '')),
            'country'         => sanitize_text_field((string) ($data['country'] ?? 'France')),
            'phone'           => sanitize_text_field((string) ($data['phone'] ?? '')),
            'email'           => sanitize_email((string) ($data['email'] ?? '')),
            'website'         => esc_url_raw((string) ($data['website'] ?? '')),
            'logo_id'         => absint($data['logo_id'] ?? 0),

            'login_enabled'   => !empty($data['login_enabled']),
            'login_show_logo' => !array_key_exists('login_show_logo', $data) ? true : !empty($data['login_show_logo']),
            'login_cover_id'  => absint($data['login_cover_id'] ?? 0),
            'login_logo_size' => max(32, min(160, absint($data['login_logo_size'] ?? 64))),
            'login_button_bg_color'   => $this->sanitize_optional_hex($data['login_button_bg_color'] ?? ''),
            'login_button_text_color' => $this->sanitize_optional_hex($data['login_button_text_color'] ?? ''),

            'legal_mentions'  => $this->safe_kses($data['legal_mentions'] ?? $current['legal_mentions'] ?? ''),
            'legal_privacy'   => $this->safe_kses($data['legal_privacy']  ?? $current['legal_privacy']  ?? ''),
            'legal_cgv'       => $this->safe_kses($data['legal_cgv']      ?? $current['legal_cgv']      ?? ''),
        ];

        return $sanitized;
    }

    /**
     * Wrapper wp_kses_post tolérant : si la fonction throw (très rare mais
     * possible sur certains environnements avec mod_security ou un kses
     * patché par un plugin tiers), on tombe sur strip_tags en fallback
     * plutôt que de faire planter tout le save.
     */
    private function safe_kses(mixed $value): string {
        $value = is_scalar($value) ? (string) $value : '';
        try {
            return wp_kses_post($value);
        } catch (\Throwable $e) {
            error_log('[WeRocketTools] wp_kses_post failed, fallback strip_tags : ' . $e->getMessage());
            return strip_tags($value, '<p><br><h1><h2><h3><h4><strong><em><u><s><a><ul><ol><li><blockquote><code><pre><hr>');
        }
    }

    /** '' = valeur par défaut (pas d'override), sinon hex valide obligatoire. */
    private function sanitize_optional_hex(mixed $value): string {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }
        return sanitize_hex_color($value) ?: '';
    }

    private function sanitize_digits(string $value, int $expected_length): string {
        $digits = preg_replace('/\D/', '', $value);
        if ($digits === '') return '';
        return strlen($digits) === $expected_length ? $digits : $digits;
    }

    /**
     * Liste des variables disponibles pour l'UI (insertion dans les pages légales).
     */
    public function get_available_variables(): array {
        return [
            ['key' => 'company.name',            'label' => 'Raison sociale',          'group' => 'Identité'],
            ['key' => 'company.commercial_name', 'label' => 'Nom commercial',          'group' => 'Identité'],
            ['key' => 'company.legal_form',      'label' => 'Forme juridique',         'group' => 'Identité'],
            ['key' => 'company.siren',           'label' => 'SIREN',                   'group' => 'Identité'],
            ['key' => 'company.siret',           'label' => 'SIRET',                   'group' => 'Identité'],
            ['key' => 'company.capital',         'label' => 'Capital social',          'group' => 'Identité'],
            ['key' => 'company.rcs',             'label' => 'RCS',                     'group' => 'Identité'],
            ['key' => 'company.vat',             'label' => 'TVA intracommunautaire',  'group' => 'Identité'],
            ['key' => 'company.ape_code',        'label' => 'Code APE',                'group' => 'Identité'],
            ['key' => 'company.ape_label',       'label' => 'Libellé APE',             'group' => 'Identité'],
            ['key' => 'company.director',        'label' => 'Dirigeant',               'group' => 'Identité'],
            ['key' => 'company.creation_date',   'label' => 'Date de création',        'group' => 'Identité'],

            ['key' => 'company.address',         'label' => 'Adresse complète',        'group' => 'Coordonnées'],
            ['key' => 'company.street',          'label' => 'Rue',                     'group' => 'Coordonnées'],
            ['key' => 'company.postal_code',     'label' => 'Code postal',             'group' => 'Coordonnées'],
            ['key' => 'company.city',            'label' => 'Ville',                   'group' => 'Coordonnées'],
            ['key' => 'company.country',         'label' => 'Pays',                    'group' => 'Coordonnées'],
            ['key' => 'company.phone',           'label' => 'Téléphone',               'group' => 'Coordonnées'],
            ['key' => 'company.email',           'label' => 'Email',                   'group' => 'Coordonnées'],
            ['key' => 'company.website',         'label' => 'Site web',                'group' => 'Coordonnées'],
            ['key' => 'company.logo',            'label' => 'Logo (URL)',              'group' => 'Coordonnées'],

            ['key' => 'site.name',               'label' => 'Nom du site',             'group' => 'Site WordPress'],
            ['key' => 'site.url',                'label' => 'URL du site',             'group' => 'Site WordPress'],
            ['key' => 'site.tagline',            'label' => 'Slogan du site',          'group' => 'Site WordPress'],
            ['key' => 'site.admin_email',        'label' => 'Email admin',             'group' => 'Site WordPress'],
        ];
    }

    public function render_settings(): void {
        // Délégué à l'UI React via #werocket-admin-root
    }

    /**
     * Override pour exposer le champ calculé `logo_url` (résolu via
     * wp_get_attachment_image_url depuis logo_id) directement dans la
     * réponse REST. Évite à l'UI React de devoir appeler /wp/v2/media/{id}
     * qui peut échouer silencieusement selon les permissions ou réécritures
     * d'URL du site (CDN, sous-dossiers WP, etc.).
     *
     * Le champ logo_url est en lecture seule : il ne fait pas partie du
     * payload de sanitize_settings(), donc ré-écrire dessus depuis l'UI
     * n'a aucun effet (recalculé à chaque get).
     */
    public function get_settings(): array {
        $settings = parent::get_settings();

        $settings['logo_url']        = $this->resolve_attachment_url((int) ($settings['logo_id'] ?? 0));
        $settings['login_cover_url'] = $this->resolve_attachment_url((int) ($settings['login_cover_id'] ?? 0));

        return $settings;
    }

    private function resolve_attachment_url(int $attachment_id): string {
        if ($attachment_id <= 0) {
            return '';
        }
        $url = wp_get_attachment_image_url($attachment_id, 'full');
        return is_string($url) ? $url : '';
    }
}
