<?php
/**
 * PSR-4 Autoloader for WeRocket Tools
 */

namespace WeRocket\Tools;

class Autoloader {

    private static string $namespace = 'WeRocket\\Tools\\';
    private static string $base_dir = WEROCKET_TOOLS_PLUGIN_DIR . 'includes/';

    public static function register(): void {
        spl_autoload_register([self::class, 'autoload']);
    }

    public static function autoload(string $class): void {
        // Check if the class uses our namespace
        $len = strlen(self::$namespace);
        if (strncmp(self::$namespace, $class, $len) !== 0) {
            return;
        }

        // Get the relative class name
        $relative_class = substr($class, $len);

        // Replace namespace separators with directory separators
        $file = self::$base_dir . str_replace('\\', '/', $relative_class) . '.php';

        // If the file exists, require it
        if (file_exists($file)) {
            require_once $file;
        }
    }
}
