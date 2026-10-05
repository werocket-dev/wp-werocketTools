<?php
/**
 * Routes REST du module Général : vérification de l'adresse de connexion
 * et liste des pages pour la redirection.
 */

namespace WeRocket\Tools\Modules\General;

use WP_REST_Request;
use WP_REST_Response;

class RestApi {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void {
        $permission = static fn(): bool => current_user_can('manage_options');

        register_rest_route('werocket/v1', '/general/login-slug', [
            'methods'             => 'GET',
            'callback'            => [$this, 'check_slug'],
            'permission_callback' => $permission,
            'args'                => ['slug' => ['type' => 'string', 'required' => true]],
        ]);

        register_rest_route('werocket/v1', '/general/pages', [
            'methods'             => 'GET',
            'callback'            => [$this, 'pages'],
            'permission_callback' => $permission,
        ]);
    }

    public function check_slug(WP_REST_Request $request): WP_REST_Response {
        $slug   = sanitize_title((string) $request->get_param('slug'));
        $reason = GeneralModule::validate_login_slug($slug);

        return rest_ensure_response([
            'slug'      => $slug,
            'available' => $reason === '',
            'reason'    => $reason,
        ]);
    }

    public function pages(): WP_REST_Response {
        $pages = get_pages(['post_status' => 'publish', 'sort_column' => 'post_title']);
        return rest_ensure_response(array_map(static fn(\WP_Post $p): array => [
            'id'    => $p->ID,
            'title' => $p->post_title !== '' ? $p->post_title : __('(sans titre)', 'werocket-tools'),
        ], $pages));
    }
}
