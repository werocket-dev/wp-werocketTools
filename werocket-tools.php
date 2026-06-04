<?php
/**
 * Plugin Name: WeRocket Tools
 * Plugin URI: https://werocket.fr
 * Description: Suite d'outils pour agences : gestion des cookies, avis Google, informations entreprise Google Business.
 * Version: 1.2.8
 * Author: WeRocket
 * Author URI: https://werocket.fr
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: werocket-tools
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 */

namespace WeRocket\Tools;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('WEROCKET_TOOLS_VERSION', '1.2.8');
define('WEROCKET_TOOLS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WEROCKET_TOOLS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WEROCKET_TOOLS_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('WEROCKET_TOOLS_DIST_URL', plugin_dir_url(__FILE__) . 'dist/');

// Auto-update depuis GitHub via Plugin Update Checker v5 (repo public, pas d'auth).
require_once WEROCKET_TOOLS_PLUGIN_DIR . 'includes/plugin-update-checker/plugin-update-checker.php';
$werocket_updater = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
    'https://github.com/blablaa-lab/we-wp-werocketTools/',
    __FILE__,
    'werocket-tools'
);
$werocket_updater->getVcsApi()->enableReleaseAssets();

// Autoloader
require_once WEROCKET_TOOLS_PLUGIN_DIR . 'includes/Autoloader.php';
Autoloader::register();

// Initialize plugin
function werocket_tools_init(): void {
    $plugin = Core\Plugin::get_instance();
    $plugin->init();
}
add_action('plugins_loaded', __NAMESPACE__ . '\werocket_tools_init');

// Déclare la compatibilité WooCommerce HPOS (Custom Order Tables).
// Requis car le module Rétractation interagit avec les commandes via l'API WC.
add_action('before_woocommerce_init', static function (): void {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            __FILE__,
            true
        );
    }
});

// Activation hook
register_activation_hook(__FILE__, function(): void {
    Core\Activator::activate();
});

// Deactivation hook
register_deactivation_hook(__FILE__, function(): void {
    Core\Deactivator::deactivate();
});
