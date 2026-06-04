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
    }

    /**
     * Override de AbstractModule::save_settings pour déclencher la synchro
     * du CPT singleton après chaque enregistrement.
     */
    public function save_settings(array $data): bool {
        $result = parent::save_settings($data);
        if ($result) {
            Cpt::sync_from_settings($this->get_settings());
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

            // Pages légales (HTML enrichi avec variables {company.x})
            'legal_mentions'  => '',
            'legal_privacy'   => '',
            'legal_cgv'       => '',
        ];
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

            'legal_mentions'  => wp_kses_post((string) ($data['legal_mentions'] ?? $current['legal_mentions'])),
            'legal_privacy'   => wp_kses_post((string) ($data['legal_privacy'] ?? $current['legal_privacy'])),
            'legal_cgv'       => wp_kses_post((string) ($data['legal_cgv'] ?? $current['legal_cgv'])),
        ];

        return $sanitized;
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

        $logo_id = (int) ($settings['logo_id'] ?? 0);
        $settings['logo_url'] = '';

        if ($logo_id > 0) {
            $url = wp_get_attachment_image_url($logo_id, 'full');
            if (is_string($url) && $url !== '') {
                $settings['logo_url'] = $url;
            }
        }

        return $settings;
    }
}
