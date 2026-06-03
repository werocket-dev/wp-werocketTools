<?php
/**
 * Admin Menu Handler
 */

namespace WeRocket\Tools\Admin;

use WeRocket\Tools\Modules\ModuleManager;

class AdminMenu {

    private ModuleManager $module_manager;
    private string $hook_suffix = '';

    public function __construct(ModuleManager $module_manager) {
        $this->module_manager = $module_manager;
    }

    public function init(): void {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function register_menu(): void {
        $this->hook_suffix = add_menu_page(
            __('WeRocket Tools', 'werocket-tools'),
            __('WeRocket Tools', 'werocket-tools'),
            'manage_options',
            'werocket-tools',
            [$this, 'render_admin_page'],
            'dashicons-rocket',
            30
        );
    }

    public function enqueue_assets(string $hook): void {
        if ($hook !== $this->hook_suffix) {
            return;
        }

        // Permet d'utiliser wp.media() depuis React (module Rétractation : logo email).
        wp_enqueue_media();

        ViteAssets::enqueue_entry('admin/main.tsx', 'werocket-admin');
    }

    public function render_admin_page(): void {
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/admin/main.php';
    }
}
