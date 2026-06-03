<?php
/**
 * Module Manager - Handles registration and initialization of all modules
 */

namespace WeRocket\Tools\Modules;

use WeRocket\Tools\Modules\Cookies\CookiesModule;
use WeRocket\Tools\Modules\GoogleReviews\GoogleReviewsModule;
use WeRocket\Tools\Modules\Retractation\RetractationModule;

class ModuleManager {

    /** @var ModuleInterface[] */
    private array $modules = [];

    /** @var ModuleInterface[] */
    private array $active_modules = [];

    public function register_modules(): void {
        $this->register(new CookiesModule());
        $this->register(new GoogleReviewsModule());
        $this->register(new RetractationModule());

        // Allow third-party modules registration
        do_action('werocket_tools_register_modules', $this);
    }

    public function register(ModuleInterface $module): void {
        $this->modules[$module->get_id()] = $module;
    }

    public function init_active_modules(): void {
        $options = get_option('werocket_tools_options', []);
        $active_modules = $options['active_modules'] ?? [];

        foreach ($this->modules as $id => $module) {
            if (!empty($active_modules[$id])) {
                $module->init();
                $this->active_modules[$id] = $module;
            }
        }
    }

    /**
     * @return ModuleInterface[]
     */
    public function get_all_modules(): array {
        return $this->modules;
    }

    /**
     * @return ModuleInterface[]
     */
    public function get_active_modules(): array {
        return $this->active_modules;
    }

    public function get_module(string $id): ?ModuleInterface {
        return $this->modules[$id] ?? null;
    }

    public function is_module_active(string $id): bool {
        return isset($this->active_modules[$id]);
    }

    public function activate_module(string $id): bool {
        $options = get_option('werocket_tools_options', []);
        $options['active_modules'][$id] = true;
        return update_option('werocket_tools_options', $options);
    }

    public function deactivate_module(string $id): bool {
        $options = get_option('werocket_tools_options', []);
        $options['active_modules'][$id] = false;
        return update_option('werocket_tools_options', $options);
    }
}
