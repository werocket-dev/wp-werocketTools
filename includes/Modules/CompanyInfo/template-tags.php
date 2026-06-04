<?php
/**
 * Template tags publics du module CompanyInfo.
 *
 * Fonctions accessibles globalement depuis n'importe quel thème ou plugin :
 *
 *   <?php echo werocket_company_logo('full', ['class' => 'logo']); ?>
 *   <?php echo werocket_company_logo_url('medium'); ?>
 *   <?php echo werocket_company_field('siret'); ?>
 *   <?php echo werocket_company_address(); ?>
 *
 *   $post_id = werocket_company_post_id();   // utilisable avec get_post_meta()
 *   $post    = werocket_company_post();      // WP_Post du singleton
 */

use WeRocket\Tools\Modules\CompanyInfo\Cpt;

if (!function_exists('werocket_company_post_id')) {
    /**
     * Retourne l'ID du post singleton CompanyInfo (CPT werocket_company).
     * Utile pour combiner avec get_post_meta(), get_the_post_thumbnail(), etc.
     */
    function werocket_company_post_id(): int {
        return Cpt::get_singleton_id();
    }
}

if (!function_exists('werocket_company_post')) {
    /**
     * Retourne le WP_Post du singleton (ou null si pas encore créé).
     */
    function werocket_company_post(): ?WP_Post {
        $id = Cpt::get_singleton_id();
        return $id ? get_post($id) : null;
    }
}

if (!function_exists('werocket_company_logo')) {
    /**
     * Retourne la balise <img> du logo (featured image du CPT).
     *
     * @param string|array<int,int> $size   Taille WP (full, medium, thumbnail) ou [w, h]
     * @param array<string,string>  $attr   Attributs HTML supplémentaires (class, alt…)
     */
    function werocket_company_logo($size = 'full', array $attr = []): string {
        $id = Cpt::get_singleton_id();
        if (!$id) return '';
        $html = get_the_post_thumbnail($id, $size, $attr);
        return $html ?: '';
    }
}

if (!function_exists('werocket_company_logo_url')) {
    /**
     * Retourne l'URL du logo (ou '' si pas de logo).
     */
    function werocket_company_logo_url($size = 'full'): string {
        $id = Cpt::get_singleton_id();
        if (!$id) return '';
        $url = get_the_post_thumbnail_url($id, $size);
        return $url ?: '';
    }
}

if (!function_exists('werocket_company_logo_id')) {
    /**
     * Retourne l'ID média WordPress du logo (ou 0 si pas de logo).
     */
    function werocket_company_logo_id(): int {
        $id = Cpt::get_singleton_id();
        if (!$id) return 0;
        return (int) get_post_thumbnail_id($id);
    }
}

if (!function_exists('werocket_company_field')) {
    /**
     * Retourne la valeur d'un champ : name, siret, siren, phone, email, etc.
     *
     * @param string $field  Nom du champ (sans le préfixe _werocket_)
     * @param string $default Valeur par défaut si absent
     */
    function werocket_company_field(string $field, string $default = ''): string {
        $id = Cpt::get_singleton_id();
        if (!$id) return $default;
        $value = get_post_meta($id, Cpt::META_PREFIX . $field, true);
        return $value !== '' ? (string) $value : $default;
    }
}

if (!function_exists('werocket_company_address')) {
    /**
     * Retourne l'adresse complète formatée (rue, CP ville, pays).
     */
    function werocket_company_address(string $separator = ', '): string {
        $parts = array_filter([
            werocket_company_field('street'),
            trim(werocket_company_field('postal_code') . ' ' . werocket_company_field('city')),
            werocket_company_field('country'),
        ], fn($v) => trim($v) !== '');
        return implode($separator, $parts);
    }
}

if (!function_exists('werocket_company_info')) {
    /**
     * Retourne un tableau de tous les champs (lecture en bulk).
     * @return array<string,mixed>
     */
    function werocket_company_info(): array {
        $id = Cpt::get_singleton_id();
        if (!$id) return [];

        $fields = [
            'siren', 'siret', 'name', 'commercial_name', 'legal_form',
            'capital', 'rcs', 'vat', 'ape_code', 'ape_label', 'director',
            'creation_date', 'street', 'postal_code', 'city', 'country',
            'phone', 'email', 'website',
        ];

        $info = [
            'post_id'   => $id,
            'logo_id'   => werocket_company_logo_id(),
            'logo_url'  => werocket_company_logo_url('full'),
            'address'   => werocket_company_address(),
        ];

        foreach ($fields as $field) {
            $info[$field] = werocket_company_field($field);
        }

        return $info;
    }
}
