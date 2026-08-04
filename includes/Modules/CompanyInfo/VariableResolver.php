<?php
/**
 * Remplace les variables {company.x} dans un contenu HTML.
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

class VariableResolver {

    private CompanyInfoModule $module;

    public function __construct(CompanyInfoModule $module) {
        $this->module = $module;
    }

    /**
     * Remplace les variables {company.x} et {site.x} par leur valeur.
     * - company.* : depuis les settings du module
     * - site.*    : depuis WordPress (get_bloginfo / get_option)
     */
    public function render(string $content): string {
        $settings = $this->module->get_settings();
        $company  = $this->build_values($settings);
        $site     = $this->build_site_values();

        return preg_replace_callback(
            '/\{(company|site)\.([a-z_]+)\}/i',
            function ($matches) use ($company, $site) {
                $namespace = strtolower($matches[1]);
                $key       = strtolower($matches[2]);
                if ($namespace === 'site') {
                    return $site[$key] ?? $matches[0];
                }
                return $company[$key] ?? $matches[0];
            },
            $content
        ) ?? $content;
    }

    /**
     * Variables {site.x} récupérées depuis WordPress (pas depuis le module).
     * @return array<string,string>
     */
    private function build_site_values(): array {
        return [
            'name'        => (string) get_bloginfo('name'),
            'url'         => (string) home_url('/'),
            'tagline'     => (string) get_bloginfo('description'),
            'admin_email' => (string) get_bloginfo('admin_email'),
        ];
    }

    /**
     * Construit la table des valeurs (avec adresse composite et logo URL).
     * @param array<string,mixed> $s
     * @return array<string,string>
     */
    private function build_values(array $s): array {
        $address_full = implode(', ', array_filter([
            trim((string) ($s['street'] ?? '')),
            trim(((string) ($s['postal_code'] ?? '')) . ' ' . ((string) ($s['city'] ?? ''))),
            trim((string) ($s['country'] ?? '')),
        ]));

        $logo_url = '';
        if (!empty($s['logo_id'])) {
            $url = wp_get_attachment_image_url((int) $s['logo_id'], 'full');
            if ($url) $logo_url = $url;
        }

        return [
            'name'            => (string) ($s['name'] ?? ''),
            'commercial_name' => (string) ($s['commercial_name'] ?? ''),
            'legal_form'      => (string) ($s['legal_form'] ?? ''),
            'siren'           => (string) ($s['siren'] ?? ''),
            'siret'           => (string) ($s['siret'] ?? ''),
            'capital'         => (string) ($s['capital'] ?? ''),
            'rcs'             => (string) ($s['rcs'] ?? ''),
            'vat'             => (string) ($s['vat'] ?? ''),
            'ape_code'        => (string) ($s['ape_code'] ?? ''),
            'ape_label'       => (string) ($s['ape_label'] ?? ''),
            'director'        => (string) ($s['director'] ?? ''),
            'creation_date'   => (string) ($s['creation_date'] ?? ''),
            'address'         => $address_full,
            'street'          => (string) ($s['street'] ?? ''),
            'postal_code'     => (string) ($s['postal_code'] ?? ''),
            'city'            => (string) ($s['city'] ?? ''),
            'country'         => (string) ($s['country'] ?? ''),
            'phone'           => (string) ($s['phone'] ?? ''),
            'email'           => (string) ($s['email'] ?? ''),
            'website'         => (string) ($s['website'] ?? ''),
            'logo'            => $logo_url,
        ];
    }
}
