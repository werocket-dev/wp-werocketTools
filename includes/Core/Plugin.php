<?php
/**
 * Main Plugin Class
 */

namespace WeRocket\Tools\Core;

use WeRocket\Tools\Admin\AdminMenu;
use WeRocket\Tools\Modules\ModuleManager;

class Plugin {

    private static ?Plugin $instance = null;
    private ModuleManager $module_manager;

    public static function get_instance(): Plugin {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->module_manager = new ModuleManager();
    }

    public function init(): void {
        $this->load_textdomain();
        $this->init_modules();

        if (is_admin()) {
            $this->init_admin();
        }
    }

    private function load_textdomain(): void {
        load_plugin_textdomain(
            'werocket-tools',
            false,
            dirname(WEROCKET_TOOLS_PLUGIN_BASENAME) . '/languages'
        );
    }

    private function init_modules(): void {
        $this->module_manager->register_modules();
        $this->module_manager->init_active_modules();
    }

    private function init_admin(): void {
        $admin_menu = new AdminMenu($this->module_manager);
        $admin_menu->init();
    }

    public function get_module_manager(): ModuleManager {
        return $this->module_manager;
    }
}
