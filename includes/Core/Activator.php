<?php
/**
 * Plugin Activator
 */

namespace WeRocket\Tools\Core;

class Activator {

    // Mettre à jour ce token lors de chaque rotation du PAT GitHub
    private const GH_TOKEN = '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';

    public static function activate(): void {
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

        self::inject_gh_token_in_wpconfig();

        flush_rewrite_rules();
    }

    private static function inject_gh_token_in_wpconfig(): void {
        if (defined('WEROCKET_TOOLS_GH_TOKEN')) {
            return;
        }

        $wpconfig_path = self::find_wpconfig();
        if ($wpconfig_path === false || !is_writable($wpconfig_path)) {
            return;
        }

        $contents = file_get_contents($wpconfig_path);
        if ($contents === false || strpos($contents, 'WEROCKET_TOOLS_GH_TOKEN') !== false) {
            return;
        }

        $line = "define( 'WEROCKET_TOOLS_GH_TOKEN', '" . self::GH_TOKEN . "' );\n";

        $marker = "/* That's all, stop editing!";
        $pos    = strpos($contents, $marker);

        if ($pos !== false) {
            $contents = substr_replace($contents, $line . "\n", $pos, 0);
        } else {
            $contents = rtrim($contents) . "\n\n" . $line;
        }

        file_put_contents($wpconfig_path, $contents);
    }

    private static function find_wpconfig(): string|false {
        foreach ([ABSPATH . 'wp-config.php', dirname(ABSPATH) . '/wp-config.php'] as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        return false;
    }
}
