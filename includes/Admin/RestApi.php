<?php
/**
 * REST API — endpoints sous /wp-json/werocket/v1/
 */

namespace WeRocket\Tools\Admin;

use WeRocket\Tools\Modules\ModuleManager;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class RestApi {

    private ModuleManager $module_manager;

    public function __construct(ModuleManager $module_manager) {
        $this->module_manager = $module_manager;
    }

    public function init(): void {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void {
        $namespace = 'werocket/v1';

        // GET /modules
        register_rest_route($namespace, '/modules', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_modules'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // POST /modules/{id}/toggle
        register_rest_route($namespace, '/modules/(?P<id>[a-z0-9_]+)/toggle', [
            'methods'             => 'POST',
            'callback'            => [$this, 'toggle_module'],
            'permission_callback' => [$this, 'require_admin'],
            'args'                => [
                'id' => ['sanitize_callback' => 'sanitize_key'],
            ],
        ]);

        // GET /settings/{module_id}
        register_rest_route($namespace, '/settings/(?P<id>[a-z0-9_]+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_settings'],
            'permission_callback' => [$this, 'require_admin'],
            'args'                => [
                'id' => ['sanitize_callback' => 'sanitize_key'],
            ],
        ]);

        // PUT /settings/{module_id}
        register_rest_route($namespace, '/settings/(?P<id>[a-z0-9_]+)', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'save_settings'],
            'permission_callback' => [$this, 'require_admin'],
            'args'                => [
                'id' => ['sanitize_callback' => 'sanitize_key'],
            ],
        ]);

        // GET /reviews (public)
        register_rest_route($namespace, '/reviews', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_reviews'],
            'permission_callback' => '__return_true',
        ]);

        // GET /business (public)
        register_rest_route($namespace, '/business', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_business'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function require_admin(): bool|WP_Error {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('Permission refusée', 'werocket-tools'), ['status' => 403]);
        }
        return true;
    }

    public function get_modules(WP_REST_Request $request): WP_REST_Response {
        $options = get_option('werocket_tools_options', []);
        $active_modules = $options['active_modules'] ?? [];

        $modules = [];
        foreach ($this->module_manager->get_all_modules() as $module) {
            $modules[] = [
                'id'          => $module->get_id(),
                'name'        => $module->get_name(),
                'description' => $module->get_description(),
                'icon'        => $module->get_icon(),
                'active'      => !empty($active_modules[$module->get_id()]),
            ];
        }

        return rest_ensure_response(['modules' => $modules]);
    }

    public function toggle_module(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $id     = $request->get_param('id');
        $active = (bool) $request->get_param('active');

        if (!$this->module_manager->get_module($id)) {
            return new WP_Error('module_not_found', __('Module non trouvé', 'werocket-tools'), ['status' => 404]);
        }

        if ($active) {
            $this->module_manager->activate_module($id);
        } else {
            $this->module_manager->deactivate_module($id);
        }

        return rest_ensure_response([
            'id'     => $id,
            'active' => $active,
        ]);
    }

    public function get_settings(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $id     = $request->get_param('id');
        $module = $this->module_manager->get_module($id);

        if (!$module) {
            return new WP_Error('module_not_found', __('Module non trouvé', 'werocket-tools'), ['status' => 404]);
        }

        return rest_ensure_response(['settings' => $module->get_settings()]);
    }

    public function save_settings(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $id     = $request->get_param('id');
        $module = $this->module_manager->get_module($id);

        if (!$module) {
            return new WP_Error('module_not_found', __('Module non trouvé', 'werocket-tools'), ['status' => 404]);
        }

        $body = $request->get_json_params();
        $data = $body['settings'] ?? [];

        if ($module->save_settings($data)) {
            return rest_ensure_response([
                'settings' => $module->get_settings(),
                'message'  => __('Paramètres enregistrés', 'werocket-tools'),
            ]);
        }

        return new WP_Error('save_failed', __('Erreur lors de l\'enregistrement', 'werocket-tools'), ['status' => 500]);
    }

    public function get_reviews(WP_REST_Request $request): WP_REST_Response {
        $module = $this->module_manager->get_module('google_reviews');

        if (!$module || !$this->module_manager->is_module_active('google_reviews')) {
            return rest_ensure_response(['reviews' => [], 'settings' => []]);
        }

        /** @var \WeRocket\Tools\Modules\GoogleReviews\GoogleReviewsModule $module */
        return rest_ensure_response([
            'reviews'  => $module->fetch_reviews(),
            'settings' => $module->get_settings(),
        ]);
    }

    public function get_business(WP_REST_Request $request): WP_REST_Response {
        $module = $this->module_manager->get_module('google_business');

        if (!$module || !$this->module_manager->is_module_active('google_business')) {
            return rest_ensure_response(['settings' => []]);
        }

        return rest_ensure_response(['settings' => $module->get_settings()]);
    }
}
