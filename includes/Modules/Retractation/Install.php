<?php
/**
 * Création et migration de la table custom wp_wr_retractations.
 *
 * NB : la table n'est PAS droppée à la désinstallation (rétention légale).
 * Voir uninstall comportement dans le README du module.
 */

namespace WeRocket\Tools\Modules\Retractation;

class Install {

    public const DB_VERSION = '1.0.0';
    public const VERSION_OPTION = 'werocket_retractation_db_version';

    public static function table_name(): string {
        global $wpdb;
        return $wpdb->prefix . 'wr_retractations';
    }

    /** Exécute la migration uniquement si la version stockée diffère. */
    public static function maybe_run(): void {
        if (get_option(self::VERSION_OPTION) === self::DB_VERSION) {
            return;
        }
        self::run();
        update_option(self::VERSION_OPTION, self::DB_VERSION);
    }

    public static function run(): void {
        global $wpdb;

        $table  = self::table_name();
        $charset = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$table} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id BIGINT UNSIGNED NOT NULL,
            customer_email VARCHAR(190) NOT NULL,
            customer_name VARCHAR(190) NOT NULL DEFAULT '',
            customer_address TEXT NULL,
            scope VARCHAR(16) NOT NULL DEFAULT 'total',
            items LONGTEXT NULL,
            reason TEXT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            user_ip VARCHAR(64) NOT NULL DEFAULT '',
            user_agent VARCHAR(255) NOT NULL DEFAULT '',
            created_at_gmt DATETIME NOT NULL,
            updated_at_gmt DATETIME NOT NULL,
            PRIMARY KEY  (id),
            KEY order_id (order_id),
            KEY status (status),
            KEY created_at_gmt (created_at_gmt),
            KEY customer_email (customer_email)
        ) {$charset};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }
}
