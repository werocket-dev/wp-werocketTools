<?php
/**
 * Abstract Module Base Class
 */

namespace WeRocket\Tools\Modules;

abstract class AbstractModule implements ModuleInterface {

    protected string $id;
    protected string $name;
    protected string $description;
    protected string $icon;
    protected string $option_key;

    public function get_id(): string {
        return $this->id;
    }

    public function get_name(): string {
        return $this->name;
    }

    public function get_description(): string {
        return $this->description;
    }

    public function get_icon(): string {
        return $this->icon;
    }

    public function get_settings(): array {
        return get_option($this->option_key, $this->get_default_settings());
    }

    public function save_settings(array $data): bool {
        $sanitized = $this->sanitize_settings($data);
        return update_option($this->option_key, $sanitized);
    }

    /**
     * Get default settings for the module
     */
    abstract protected function get_default_settings(): array;

    /**
     * Sanitize settings before saving
     */
    abstract protected function sanitize_settings(array $data): array;
}
