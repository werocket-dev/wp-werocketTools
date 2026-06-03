<?php
/**
 * Vite Asset Helper — lit le manifest.json de build et enqueue les bons fichiers.
 * En dev (fichier dist/.hot présent), bascule sur le serveur Vite HMR.
 */

namespace WeRocket\Tools\Admin;

class ViteAssets {

    private static ?array $manifest = null;
    private static bool $module_filter_added = false;
    private static array $module_handles = [];

    private static function dist_url(): string {
        return WEROCKET_TOOLS_PLUGIN_URL . 'dist/';
    }

    private static function dist_path(): string {
        return WEROCKET_TOOLS_PLUGIN_DIR . 'dist/';
    }

    private static function is_dev(): bool {
        return file_exists(self::dist_path() . '.hot');
    }

    private static function dev_origin(): string {
        $hot = self::dist_path() . '.hot';
        if (file_exists($hot)) {
            $content = trim((string) file_get_contents($hot));
            return $content ?: 'http://localhost:5173';
        }
        return 'http://localhost:5173';
    }

    private static function manifest(): array {
        if (self::$manifest !== null) {
            return self::$manifest;
        }
        $path = self::dist_path() . '.vite/manifest.json';
        if (!file_exists($path)) {
            self::$manifest = [];
            return self::$manifest;
        }
        $decoded = json_decode((string) file_get_contents($path), true);
        self::$manifest = is_array($decoded) ? $decoded : [];
        return self::$manifest;
    }

    /**
     * Enqueue un entry point Vite (JS + CSS associé).
     *
     * @param string $entry  Chemin relatif à src/ (ex: "admin/main.tsx")
     * @param string $handle Handle WordPress pour cet asset
     * @param array  $deps   Dépendances WordPress supplémentaires
     */
    public static function enqueue_entry(string $entry, string $handle, array $deps = []): void {
        if (self::is_dev()) {
            self::enqueue_dev($entry, $handle, $deps);
            return;
        }
        self::enqueue_prod($entry, $handle, $deps);
    }

    private static function enqueue_dev(string $entry, string $handle, array $deps): void {
        $origin = self::dev_origin();

        if (!wp_script_is('vite-client', 'registered')) {
            wp_register_script('vite-client', $origin . '/@vite/client', [], null, false);
            wp_enqueue_script('vite-client');
            self::mark_as_module('vite-client');
        }

        $all_deps = array_merge(['vite-client'], $deps);
        wp_enqueue_script($handle, $origin . '/src/' . $entry, $all_deps, null, true);
        self::mark_as_module($handle);
    }

    private static function enqueue_prod(string $entry, string $handle, array $deps): void {
        $manifest = self::manifest();
        $key = 'src/' . $entry;

        if (!isset($manifest[$key])) {
            return;
        }

        $chunk = $manifest[$key];

        // CSS associé au bundle
        if (!empty($chunk['css'])) {
            foreach ($chunk['css'] as $i => $css_file) {
                wp_enqueue_style($handle . '-css-' . $i, self::dist_url() . $css_file, [], null);
            }
        }

        // Chunks importés (code splitting)
        if (!empty($chunk['imports'])) {
            foreach ($chunk['imports'] as $import_key) {
                if (isset($manifest[$import_key])) {
                    $import_handle = 'werocket-chunk-' . sanitize_key(basename($import_key, '.tsx'));
                    if (!wp_script_is($import_handle, 'registered')) {
                        wp_register_script(
                            $import_handle,
                            self::dist_url() . $manifest[$import_key]['file'],
                            [],
                            null,
                            true
                        );
                        self::mark_as_module($import_handle);
                    }
                    $deps[] = $import_handle;
                }
            }
        }

        wp_enqueue_script($handle, self::dist_url() . $chunk['file'], $deps, null, true);
        self::mark_as_module($handle);
    }

    private static function mark_as_module(string $handle): void {
        self::$module_handles[] = $handle;

        if (!self::$module_filter_added) {
            add_filter('script_loader_tag', [self::class, 'add_module_type_attr'], 10, 2);
            self::$module_filter_added = true;
        }
    }

    public static function add_module_type_attr(string $tag, string $handle): string {
        if (in_array($handle, self::$module_handles, true)) {
            $tag = str_replace(' src=', ' type="module" crossorigin src=', $tag);
        }
        return $tag;
    }
}
