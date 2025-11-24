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
        add_action('wp_ajax_werocket_save_settings', [$this, 'ajax_save_settings']);
        add_action('wp_ajax_werocket_toggle_module', [$this, 'ajax_toggle_module']);
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

        // Tailwind CSS via CDN (script, not style)
        wp_enqueue_script(
            'werocket-tailwind',
            'https://cdn.tailwindcss.com',
            [],
            WEROCKET_TOOLS_VERSION,
            false // Load in header for Tailwind to process classes
        );

        // Tailwind config to avoid conflicts with WordPress admin
        wp_add_inline_script('werocket-tailwind', "
            tailwind.config = {
                prefix: '',
                important: '#werocket-tools-app',
                corePlugins: {
                    preflight: false,
                }
            }
        ", 'after');

        // Plugin styles
        wp_enqueue_style(
            'werocket-admin',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/css/admin.css',
            [],
            WEROCKET_TOOLS_VERSION
        );

        // Plugin scripts
        wp_enqueue_script(
            'werocket-admin',
            WEROCKET_TOOLS_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery'],
            WEROCKET_TOOLS_VERSION,
            true
        );

        wp_localize_script('werocket-admin', 'werocketTools', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('werocket_tools_nonce'),
            'strings' => [
                'saving' => __('Enregistrement...', 'werocket-tools'),
                'saved' => __('Enregistré !', 'werocket-tools'),
                'error' => __('Erreur lors de l\'enregistrement', 'werocket-tools'),
            ],
        ]);
    }

    public function render_admin_page(): void {
        $modules = $this->module_manager->get_all_modules();
        $current_tab = isset($_GET['tab']) ? sanitize_key($_GET['tab']) : 'dashboard';

        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/admin/main.php';
    }

    public function ajax_save_settings(): void {
        check_ajax_referer('werocket_tools_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Permission refusée', 'werocket-tools')]);
        }

        $module_id = sanitize_key($_POST['module_id'] ?? '');
        $settings = $_POST['settings'] ?? [];

        $module = $this->module_manager->get_module($module_id);

        if (!$module) {
            wp_send_json_error(['message' => __('Module non trouvé', 'werocket-tools')]);
        }

        if ($module->save_settings($settings)) {
            wp_send_json_success(['message' => __('Paramètres enregistrés', 'werocket-tools')]);
        }

        wp_send_json_error(['message' => __('Erreur lors de l\'enregistrement', 'werocket-tools')]);
    }

    public function ajax_toggle_module(): void {
        check_ajax_referer('werocket_tools_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Permission refusée', 'werocket-tools')]);
        }

        $module_id = sanitize_key($_POST['module_id'] ?? '');
        $active = filter_var($_POST['active'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($active) {
            $this->module_manager->activate_module($module_id);
        } else {
            $this->module_manager->deactivate_module($module_id);
        }

        wp_send_json_success(['message' => __('Module mis à jour', 'werocket-tools')]);
    }
}
