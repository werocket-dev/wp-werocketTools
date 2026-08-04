<?php
/**
 * REST endpoint additionnel : lookup SIRET via API gouv.fr.
 * Les endpoints de settings (GET/PUT) sont déjà fournis par Admin\RestApi.
 *
 * Route : POST /wp-json/werocket/v1/company-info/lookup
 *   body { identifier: "SIREN_ou_SIRET" }
 *   response { found: bool, data: {...} | null }
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class RestApi {

    private CompanyInfoModule $module;

    public function __construct(CompanyInfoModule $module) {
        $this->module = $module;
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void {
        register_rest_route('werocket/v1', '/company-info/lookup', [
            'methods'             => 'POST',
            'callback'            => [$this, 'lookup'],
            'permission_callback' => [$this, 'require_admin'],
            'args'                => [
                'identifier' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        register_rest_route('werocket/v1', '/company-info/variables', [
            'methods'             => 'GET',
            'callback'            => [$this, 'variables'],
            'permission_callback' => [$this, 'require_admin'],
        ]);
    }

    public function lookup(WP_REST_Request $request): WP_REST_Response {
        $identifier = (string) $request->get_param('identifier');
        $client = new SireneClient();
        $data = $client->lookup($identifier);

        return new WP_REST_Response([
            'found' => $data !== null,
            'data'  => $data,
        ], 200);
    }

    public function variables(): WP_REST_Response {
        return new WP_REST_Response([
            'variables' => $this->module->get_available_variables(),
        ], 200);
    }

    /** Même contrat d'erreur que Admin\RestApi::require_admin(). */
    public function require_admin(): bool|WP_Error {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', __('Permission refusée', 'werocket-tools'), ['status' => 403]);
        }
        return true;
    }
}
