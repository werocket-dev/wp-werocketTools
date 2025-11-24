<?php
/**
 * Plugin Deactivator
 */

namespace WeRocket\Tools\Core;

class Deactivator {

    public static function deactivate(): void {
        // Flush rewrite rules
        flush_rewrite_rules();
    }
}
