<?php
/**
 * Admin : submenu WooCommerce, métabox commande (HPOS-aware), changement de statut.
 */

namespace WeRocket\Tools\Modules\Retractation;

class Admin {

    private Repository $repository;

    public function __construct(Repository $repository) {
        $this->repository = $repository;
    }

    public function init(): void {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_post_wr_update_status', [$this, 'handle_update_status']);
        add_action('add_meta_boxes', [$this, 'register_metabox']);
    }

    public function register_menu(): void {
        add_submenu_page(
            'woocommerce',
            __('Rétractations', 'werocket-tools'),
            __('Rétractations', 'werocket-tools'),
            'manage_woocommerce',
            'wr-retractations',
            [$this, 'render_page']
        );
    }

    public function render_page(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Permission refusée.', 'werocket-tools'));
        }

        $view_id = isset($_GET['view']) ? absint(wp_unslash($_GET['view'])) : 0;
        if ($view_id > 0) {
            $this->render_single($view_id);
            return;
        }

        require_once __DIR__ . '/ListTable.php';
        $list = new ListTable($this->repository);
        $list->prepare_items();

        echo '<div class="wrap"><h1 class="wp-heading-inline">' . esc_html__('Demandes de rétractation', 'werocket-tools') . '</h1>';
        echo '<hr class="wp-header-end" />';
        echo '<form method="get">';
        echo '<input type="hidden" name="page" value="wr-retractations" />';
        $list->search_box(__('Rechercher', 'werocket-tools'), 'wr-search');
        $list->display();
        echo '</form></div>';
    }

    private function render_single(int $id): void {
        $req = $this->repository->get($id);
        if (!$req) {
            wp_die(esc_html__('Demande introuvable.', 'werocket-tools'));
        }

        $order = wc_get_order((int) $req['order_id']);
        $items = json_decode((string) ($req['items'] ?? ''), true) ?: [];

        $update_url = wp_nonce_url(
            admin_url('admin-post.php?action=wr_update_status&id=' . $id),
            'wr_update_status_' . $id
        );

        echo '<div class="wrap">';
        echo '<h1>' . sprintf(
            /* translators: %d : id de la demande */
            esc_html__('Demande de rétractation #%d', 'werocket-tools'),
            $id
        ) . '</h1>';

        echo '<p><a href="' . esc_url(admin_url('admin.php?page=wr-retractations')) . '">&laquo; ' . esc_html__('Retour à la liste', 'werocket-tools') . '</a></p>';

        echo '<table class="form-table"><tbody>';
        $rows = [
            __('Commande', 'werocket-tools')           => $order ? '<a href="' . esc_url($order->get_edit_order_url()) . '">#' . esc_html($order->get_order_number()) . '</a>' : '#' . (int) $req['order_id'],
            __('Client', 'werocket-tools')             => esc_html((string) $req['customer_name']),
            __('Email', 'werocket-tools')              => '<a href="mailto:' . esc_attr((string) $req['customer_email']) . '">' . esc_html((string) $req['customer_email']) . '</a>',
            __('Adresse', 'werocket-tools')            => nl2br(esc_html((string) $req['customer_address'])),
            __('Portée', 'werocket-tools')             => esc_html(ucfirst((string) $req['scope'])),
            __('Reçue (UTC)', 'werocket-tools')        => esc_html((string) $req['created_at_gmt']),
            __('Statut actuel', 'werocket-tools')      => esc_html(Repository::STATUSES[$req['status']] ?? $req['status']),
            __('IP', 'werocket-tools')                 => esc_html((string) $req['user_ip']),
        ];
        foreach ($rows as $label => $value) {
            echo '<tr><th>' . esc_html($label) . '</th><td>' . wp_kses_post((string) $value) . '</td></tr>';
        }
        echo '</tbody></table>';

        if ($items) {
            echo '<h2>' . esc_html__('Articles concernés', 'werocket-tools') . '</h2><ul>';
            foreach ($items as $it) {
                echo '<li>' . esc_html((string) ($it['name'] ?? '')) . ' × ' . esc_html((string) ($it['qty'] ?? '')) . '</li>';
            }
            echo '</ul>';
        }

        if (!empty($req['reason'])) {
            echo '<h2>' . esc_html__('Motif', 'werocket-tools') . '</h2>';
            echo '<p>' . nl2br(esc_html((string) $req['reason'])) . '</p>';
        }

        // Form changement de statut
        echo '<h2>' . esc_html__('Mettre à jour le statut', 'werocket-tools') . '</h2>';
        echo '<form method="post" action="' . esc_url($update_url) . '">';
        echo '<select name="status">';
        foreach (Repository::STATUSES as $key => $label) {
            $sel = selected($key, $req['status'], false);
            echo '<option value="' . esc_attr($key) . '" ' . $sel . '>' . esc_html($label) . '</option>';
        }
        echo '</select> ';
        echo '<button type="submit" class="button button-primary">' . esc_html__('Enregistrer', 'werocket-tools') . '</button>';
        echo '</form>';
        echo '</div>';
    }

    public function handle_update_status(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Permission refusée.', 'werocket-tools'));
        }
        $id = isset($_GET['id']) ? absint(wp_unslash($_GET['id'])) : 0;
        check_admin_referer('wr_update_status_' . $id);
        $status = isset($_POST['status']) ? sanitize_key(wp_unslash($_POST['status'])) : '';

        if ($id > 0 && $status) {
            $this->repository->update_status($id, $status);

            // Note WC sur la commande si possible.
            $req = $this->repository->get($id);
            if ($req && ($order = wc_get_order((int) $req['order_id']))) {
                $order->add_order_note(sprintf(
                    /* translators: %1$d demande, %2$s statut */
                    __('Demande de rétractation #%1$d : statut → %2$s.', 'werocket-tools'),
                    $id,
                    Repository::STATUSES[$status] ?? $status
                ));
            }
        }

        wp_safe_redirect(admin_url('admin.php?page=wr-retractations&view=' . $id . '&updated=1'));
        exit;
    }

    /** Métabox sur la fiche commande (HPOS-aware). */
    public function register_metabox(): void {
        $screen = class_exists('\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController')
            && wc_get_container()->get(\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController::class)->custom_orders_table_usage_is_enabled()
            ? wc_get_page_screen_id('shop-order')
            : 'shop_order';

        add_meta_box(
            'wr_retractation_metabox',
            __('Rétractation', 'werocket-tools'),
            [$this, 'render_metabox'],
            $screen,
            'side',
            'default'
        );
    }

    public function render_metabox(\WP_Post|\WC_Order $post_or_order): void {
        $order = ($post_or_order instanceof \WC_Order)
            ? $post_or_order
            : wc_get_order($post_or_order->ID);

        if (!$order) {
            echo '<p>' . esc_html__('Aucune commande.', 'werocket-tools') . '</p>';
            return;
        }

        $request_id = (int) $order->get_meta('_wr_retractation_id');
        if (!$request_id) {
            echo '<p>' . esc_html__('Aucune demande de rétractation pour cette commande.', 'werocket-tools') . '</p>';
            return;
        }

        $req = $this->repository->get($request_id);
        if (!$req) {
            echo '<p>' . esc_html__('Demande introuvable (peut-être supprimée).', 'werocket-tools') . '</p>';
            return;
        }

        $status_label = Repository::STATUSES[$req['status']] ?? $req['status'];
        $url = admin_url('admin.php?page=wr-retractations&view=' . $request_id);
        $scope = $req['scope'] === 'total' ? __('totale', 'werocket-tools') : __('partielle', 'werocket-tools');

        echo '<p><strong>' . esc_html__('Demande', 'werocket-tools') . '</strong> : #' . (int) $request_id . '</p>';
        echo '<p><strong>' . esc_html__('Portée', 'werocket-tools') . '</strong> : ' . esc_html($scope) . '</p>';
        echo '<p><strong>' . esc_html__('Statut', 'werocket-tools') . '</strong> : ' . esc_html($status_label) . '</p>';
        echo '<p><strong>' . esc_html__('Reçue (UTC)', 'werocket-tools') . '</strong> : ' . esc_html((string) $req['created_at_gmt']) . '</p>';
        echo '<p><a class="button button-primary" href="' . esc_url($url) . '">' . esc_html__('Ouvrir la demande', 'werocket-tools') . '</a></p>';
    }
}
