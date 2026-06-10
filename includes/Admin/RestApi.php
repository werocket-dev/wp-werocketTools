<?php
/**
 * REST API — endpoints sous /wp-json/werocket/v1/
 */

namespace WeRocket\Tools\Admin;

use WeRocket\Tools\Modules\ModuleManager;
use WeRocket\Tools\Modules\Cookies\CookiesModule;
use WeRocket\Tools\Modules\Cookies\Scanner\CookieScanner;
use WeRocket\Tools\Modules\Cookies\Scanner\ScanStorage;
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

        // POST /reviews/refresh (admin only)
        register_rest_route($namespace, '/reviews/refresh', [
            'methods'             => 'POST',
            'callback'            => [$this, 'refresh_reviews'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // GET /reviews/sync-status (admin only)
        register_rest_route($namespace, '/reviews/sync-status', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_sync_status'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // ──────────────────────────────────────────────────────────
        // Cookie Scanner endpoints
        // ──────────────────────────────────────────────────────────

        // POST /cookies/scan/start
        register_rest_route($namespace, '/cookies/scan/start', [
            'methods'             => 'POST',
            'callback'            => [$this, 'cookies_scan_start'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // POST /cookies/scan/report
        register_rest_route($namespace, '/cookies/scan/report', [
            'methods'             => 'POST',
            'callback'            => [$this, 'cookies_scan_report'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // POST /cookies/scan/finalize
        register_rest_route($namespace, '/cookies/scan/finalize', [
            'methods'             => 'POST',
            'callback'            => [$this, 'cookies_scan_finalize'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // GET /cookies/scan/history
        register_rest_route($namespace, '/cookies/scan/history', [
            'methods'             => 'GET',
            'callback'            => [$this, 'cookies_scan_history'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // POST /cookies/scan/import
        register_rest_route($namespace, '/cookies/scan/import', [
            'methods'             => 'POST',
            'callback'            => [$this, 'cookies_scan_import'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        // DELETE /cookies/scan/{id}
        register_rest_route($namespace, '/cookies/scan/(?P<id>scan_[a-z0-9-]+)', [
            'methods'             => 'DELETE',
            'callback'            => [$this, 'cookies_scan_delete'],
            'permission_callback' => [$this, 'require_admin'],
            'args'                => [
                'id' => ['sanitize_callback' => fn($v) => preg_replace('/[^a-z0-9_-]/', '', (string)$v)],
            ],
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

        // Wrap dans try/catch pour capturer toute exception fatale (ex: un
        // plugin tiers qui filtre update_option, un wp_kses qui bug, un
        // override CPT qui crashe). Sans ce wrapper, PHP renvoie un 500
        // opaque — avec, l'admin reçoit le détail dans la réponse JSON.
        try {
            $saved = $module->save_settings($data);
        } catch (\Throwable $e) {
            $message = sprintf(
                'Exception PHP pendant le save : %s @ %s:%d',
                $e->getMessage(),
                basename($e->getFile()),
                $e->getLine()
            );
            error_log('[WeRocketTools] ' . $message . "\n" . $e->getTraceAsString());
            return new WP_Error('save_exception', $message, [
                'status' => 500,
                'trace'  => WP_DEBUG ? $e->getTraceAsString() : null,
            ]);
        }

        if ($saved) {
            return rest_ensure_response([
                'settings' => $module->get_settings(),
                'message'  => __('Paramètres enregistrés', 'werocket-tools'),
            ]);
        }

        return new WP_Error('save_failed', __('Erreur lors de l\'enregistrement (save_settings a renvoyé false)', 'werocket-tools'), ['status' => 500]);
    }

    public function get_reviews(WP_REST_Request $request): WP_REST_Response {
        $module = $this->module_manager->get_module('google_reviews');

        if (!$module || !$this->module_manager->is_module_active('google_reviews')) {
            return rest_ensure_response(['reviews' => [], 'settings' => [], 'meta' => null]);
        }

        /** @var \WeRocket\Tools\Modules\GoogleReviews\GoogleReviewsModule $module */
        $settings = $module->get_settings();
        // Endpoint public : ne jamais exposer la clé API
        unset($settings['google_api_key']);

        return rest_ensure_response([
            'reviews'  => $module->fetch_reviews(),
            'settings' => $settings,
            'meta'     => $module->get_meta(),
        ]);
    }

    public function refresh_reviews(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $module = $this->module_manager->get_module('google_reviews');

        if (!$module) {
            return new WP_Error('module_not_found', __('Module non trouvé', 'werocket-tools'), ['status' => 404]);
        }

        /** @var \WeRocket\Tools\Modules\GoogleReviews\GoogleReviewsModule $module */
        $result = $module->force_refresh();
        $next   = wp_next_scheduled(\WeRocket\Tools\Modules\GoogleReviews\GoogleReviewsModule::CRON_HOOK);

        return rest_ensure_response([
            'last_sync'     => $result,
            'next_sync_ts'  => $next ?: null,
        ]);
    }

    public function get_sync_status(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $module = $this->module_manager->get_module('google_reviews');

        if (!$module) {
            return new WP_Error('module_not_found', __('Module non trouvé', 'werocket-tools'), ['status' => 404]);
        }

        /** @var \WeRocket\Tools\Modules\GoogleReviews\GoogleReviewsModule $module */
        return rest_ensure_response([
            'last_sync'    => $module->get_last_sync(),
            'next_sync_ts' => wp_next_scheduled(\WeRocket\Tools\Modules\GoogleReviews\GoogleReviewsModule::CRON_HOOK) ?: null,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // Cookie Scanner
    // ──────────────────────────────────────────────────────────

    private ?CookieScanner $scanner = null;

    private function get_scanner(): CookieScanner|WP_Error {
        if ($this->scanner !== null) return $this->scanner;

        $module = $this->module_manager->get_module('cookies');
        if (!$module instanceof CookiesModule) {
            return new WP_Error('cookies_module_unavailable', __('Module Cookies indisponible.', 'werocket-tools'), ['status' => 500]);
        }

        return $this->scanner = new CookieScanner(new ScanStorage(), $module);
    }

    public function cookies_scan_start(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $scanner = $this->get_scanner();
        if ($scanner instanceof WP_Error) return $scanner;

        $body = $request->get_json_params() ?: [];
        $urls = is_array($body['urls'] ?? null) ? $body['urls'] : [];

        $result = $scanner->start($urls);
        if ($result instanceof WP_Error) return $result;

        return rest_ensure_response($result);
    }

    public function cookies_scan_report(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $scanner = $this->get_scanner();
        if ($scanner instanceof WP_Error) return $scanner;

        $body     = $request->get_json_params() ?: [];
        $scan_id  = sanitize_text_field((string) ($body['scan_id'] ?? ''));
        $token    = sanitize_text_field((string) ($body['token']   ?? ''));
        $url      = (string) ($body['url'] ?? '');

        if ($scan_id === '' || $token === '' || $url === '') {
            return new WP_Error('missing_params', __('Paramètres manquants.', 'werocket-tools'), ['status' => 400]);
        }

        $result = $scanner->record($scan_id, $token, $url, [
            'cookies'        => is_array($body['cookies']        ?? null) ? $body['cookies']        : [],
            'localStorage'   => is_array($body['localStorage']   ?? null) ? $body['localStorage']   : [],
            'sessionStorage' => is_array($body['sessionStorage'] ?? null) ? $body['sessionStorage'] : [],
            'resources'      => is_array($body['resources']      ?? null) ? $body['resources']      : [],
        ]);

        if ($result instanceof WP_Error) return $result;
        return rest_ensure_response($result);
    }

    public function cookies_scan_finalize(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $scanner = $this->get_scanner();
        if ($scanner instanceof WP_Error) return $scanner;

        $body    = $request->get_json_params() ?: [];
        $scan_id = sanitize_text_field((string) ($body['scan_id'] ?? ''));
        $token   = sanitize_text_field((string) ($body['token']   ?? ''));

        if ($scan_id === '' || $token === '') {
            return new WP_Error('missing_params', __('Paramètres manquants.', 'werocket-tools'), ['status' => 400]);
        }

        $result = $scanner->finalize($scan_id, $token);
        if ($result instanceof WP_Error) return $result;

        return rest_ensure_response($result);
    }

    public function cookies_scan_history(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $this->get_scanner(); // ensures cookies module exists
        $storage = new ScanStorage();

        $id = sanitize_text_field((string) $request->get_param('id'));
        if ($id !== '') {
            $scan = $storage->get($id);
            if (!$scan) {
                return new WP_Error('scan_not_found', __('Scan introuvable.', 'werocket-tools'), ['status' => 404]);
            }
            // Never leak the token to the front-end via history reads.
            unset($scan['token']);
            return rest_ensure_response(['scan' => $scan]);
        }

        return rest_ensure_response([
            'scans' => $storage->get_all_lite(),
        ]);
    }

    public function cookies_scan_import(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $scanner = $this->get_scanner();
        if ($scanner instanceof WP_Error) return $scanner;

        $body = $request->get_json_params() ?: [];
        $ids  = is_array($body['service_ids'] ?? null) ? $body['service_ids'] : [];

        $result = $scanner->import_services($ids);
        if ($result instanceof WP_Error) return $result;

        return rest_ensure_response($result);
    }

    public function cookies_scan_delete(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $id = (string) $request->get_param('id');
        if ($id === '') {
            return new WP_Error('missing_id', __('ID manquant.', 'werocket-tools'), ['status' => 400]);
        }

        $storage = new ScanStorage();
        if (!$storage->delete($id)) {
            return new WP_Error('scan_not_found', __('Scan introuvable.', 'werocket-tools'), ['status' => 404]);
        }

        return rest_ensure_response(['deleted' => $id]);
    }
}
