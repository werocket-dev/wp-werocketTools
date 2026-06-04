<?php
/**
 * Custom Post Type "werocket_company" — singleton qui mirror les settings
 * du module CompanyInfo dans la base de données WordPress.
 *
 * Pourquoi :
 *   Les settings sont déjà stockés dans une option (werocket_company_info_settings),
 *   mais cette forme n'est pas exploitable directement par les page builders
 *   (Elementor, Bricks, Oxygen, Beaver Builder) ni par la majorité des plugins
 *   tiers qui s'attendent à des posts/post_meta. Un CPT singleton permet :
 *
 *   - get_post(werocket_company_post_id())
 *   - get_the_post_thumbnail($post_id)   ← le logo via featured image
 *   - get_post_meta($post_id, '_werocket_siret', true)
 *   - WP_Query / GET /wp-json/wp/v2/werocket_company
 *   - Dynamic content des builders (Elementor Dynamic Tags, etc.)
 *
 * Le CPT est masqué de l'admin (show_ui = false) car l'UI dédiée vit déjà
 * dans le panneau "Infos société". On le rend cependant accessible REST
 * (show_in_rest = true) pour les intégrations externes.
 *
 * Sync : à chaque save_settings(), on (re-)crée/update le post singleton :
 *   - post_title = name
 *   - thumbnail  = logo_id
 *   - post_meta  = un meta `_werocket_<field>` par champ des settings
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

class Cpt {

    public const POST_TYPE = 'werocket_company';
    public const META_PREFIX = '_werocket_';

    /**
     * Champs à exclure du mirroring en post_meta (déjà couverts par
     * post_title / thumbnail, ou trop volumineux pour du meta).
     */
    private const EXCLUDED_FIELDS = [
        'logo_id',         // → set_post_thumbnail()
        'logo_url',        // computed, pas dans les settings stockés
        'legal_mentions',  // → post_content via concat (cf. sync) — éventuellement
        'legal_privacy',
        'legal_cgv',
    ];

    public static function register(): void {
        add_action('init', [self::class, 'register_post_type']);
        // Sync initial (one-shot) après register_post_type, pour rattraper
        // les utilisateurs qui ont déjà rempli les settings avant que ce CPT
        // n'existe.
        add_action('init', [self::class, 'maybe_initial_sync'], 11);
    }

    /**
     * Crée le singleton si les settings existent déjà mais pas le post.
     * Utilise une option pour ne le faire qu'une fois par site.
     *
     * try/catch défensif : un fail ici ne doit JAMAIS casser le hook init
     * (sinon tout le site renvoie 500).
     */
    public static function maybe_initial_sync(): void {
        $done = get_option('werocket_company_cpt_initial_sync', false);
        if ($done) return;

        try {
            $settings = get_option('werocket_company_info_settings', null);
            if (!is_array($settings) || empty($settings)) {
                update_option('werocket_company_cpt_initial_sync', true, true);
                return;
            }

            self::sync_from_settings($settings);
            update_option('werocket_company_cpt_initial_sync', true, true);
        } catch (\Throwable $e) {
            error_log(
                '[WeRocketTools] CPT initial sync failed : '
                . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine()
            );
            // On ne marque PAS comme fait → on retentera au prochain init.
        }
    }

    public static function register_post_type(): void {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name'          => __('Infos société', 'werocket-tools'),
                'singular_name' => __('Infos société', 'werocket-tools'),
            ],
            'public'              => false,
            'show_ui'             => false,        // UI dédiée fournie par le module
            'show_in_menu'        => false,
            'show_in_admin_bar'   => false,
            'show_in_nav_menus'   => false,
            'show_in_rest'        => true,         // accessible via /wp-json/wp/v2/werocket_company
            'rest_base'           => 'werocket_company',
            'has_archive'         => false,
            'rewrite'             => false,
            'capability_type'     => 'post',
            'map_meta_cap'        => true,
            'supports'            => ['title', 'thumbnail', 'custom-fields'],
            'menu_icon'           => 'dashicons-building',
        ]);

        // Expose tous les meta `_werocket_*` en lecture via REST API
        self::register_meta_fields();
    }

    private static function register_meta_fields(): void {
        $fields = [
            'siren', 'siret', 'name', 'commercial_name', 'legal_form',
            'capital', 'rcs', 'vat', 'ape_code', 'ape_label', 'director',
            'creation_date', 'street', 'postal_code', 'city', 'country',
            'phone', 'email', 'website',
        ];

        foreach ($fields as $field) {
            register_post_meta(self::POST_TYPE, self::META_PREFIX . $field, [
                'type'         => 'string',
                'single'       => true,
                'show_in_rest' => true,
                'auth_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ]);
        }
    }

    /**
     * Synchronise les settings vers le post singleton.
     * Appelé depuis CompanyInfoModule::save_settings().
     *
     * Toutes les opérations critiques sont gardées contre les erreurs
     * (wp_insert_post peut renvoyer WP_Error, set_post_thumbnail peut
     * échouer si l'attachment a été supprimé, etc.).
     *
     * @param array<string,mixed> $settings
     */
    public static function sync_from_settings(array $settings): int {
        // Garde-fou : si le post type n'est pas encore enregistré (cas où
        // sync est appelée avant l'action init 10), on bail.
        if (!post_type_exists(self::POST_TYPE)) {
            return 0;
        }

        $post_id = self::get_singleton_id();
        $title   = trim((string) ($settings['name'] ?? ''));
        if ($title === '') {
            $title = trim((string) ($settings['commercial_name'] ?? ''));
        }
        if ($title === '') {
            $title = __('Société', 'werocket-tools');
        }

        $args = [
            'post_type'    => self::POST_TYPE,
            'post_title'   => wp_strip_all_tags($title),
            'post_status'  => 'publish',
            'post_name'    => 'werocket-company-singleton',
        ];

        if ($post_id) {
            $args['ID'] = $post_id;
            $updated = wp_update_post($args, true);
            if (is_wp_error($updated)) {
                error_log('[WeRocketTools] wp_update_post failed: ' . $updated->get_error_message());
                return 0;
            }
        } else {
            $inserted = wp_insert_post($args, true);
            if (is_wp_error($inserted) || (int) $inserted === 0) {
                $msg = is_wp_error($inserted) ? $inserted->get_error_message() : 'unknown';
                error_log('[WeRocketTools] wp_insert_post failed: ' . $msg);
                return 0;
            }
            $post_id = (int) $inserted;
        }

        // Logo → featured image (silent fail si l'attachment a été supprimé)
        $logo_id = (int) ($settings['logo_id'] ?? 0);
        if ($logo_id > 0 && get_post($logo_id)) {
            set_post_thumbnail($post_id, $logo_id);
        } else {
            delete_post_thumbnail($post_id);
        }

        // Tous les autres champs → post_meta. Cast en string pour la
        // sécurité et exclusion explicite des arrays/objects.
        foreach ($settings as $key => $value) {
            if (in_array($key, self::EXCLUDED_FIELDS, true)) continue;
            if (is_array($value) || is_object($value)) continue;
            if (!is_scalar($value) && $value !== null) continue;
            update_post_meta($post_id, self::META_PREFIX . $key, (string) $value);
        }

        return $post_id;
    }

    /**
     * Retourne l'ID du post singleton (en crée un nouveau si absent).
     */
    public static function get_singleton_id(): int {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $posts = get_posts([
            'post_type'      => self::POST_TYPE,
            'post_status'    => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => 1,
            'orderby'        => 'ID',
            'order'          => 'ASC',
            'fields'         => 'ids',
            'no_found_rows'  => true,
        ]);

        $cache = $posts ? (int) $posts[0] : 0;
        return $cache;
    }
}
