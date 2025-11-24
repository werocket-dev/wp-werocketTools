<?php
/**
 * Module Interface
 */

namespace WeRocket\Tools\Modules;

interface ModuleInterface {

    /**
     * Get module unique identifier
     */
    public function get_id(): string;

    /**
     * Get module display name
     */
    public function get_name(): string;

    /**
     * Get module description
     */
    public function get_description(): string;

    /**
     * Get module icon (Heroicons name or SVG)
     */
    public function get_icon(): string;

    /**
     * Initialize the module
     */
    public function init(): void;

    /**
     * Render module admin settings
     */
    public function render_settings(): void;

    /**
     * Save module settings
     */
    public function save_settings(array $data): bool;

    /**
     * Get module settings
     */
    public function get_settings(): array;
}
