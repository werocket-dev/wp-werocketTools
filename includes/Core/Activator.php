<?php
/**
 * Plugin Activator
 */

namespace WeRocket\Tools\Core;

class Activator {

    public static function activate(): void {
        // Create default options
        $default_options = [
            'active_modules' => [
                'cookies' => true,
                'google_reviews' => true,
                'google_business' => true,
            ],
        ];

        if (!get_option('werocket_tools_options')) {
            add_option('werocket_tools_options', $default_options);
        }

        // Flush rewrite rules
        flush_rewrite_rules();
    }
}
