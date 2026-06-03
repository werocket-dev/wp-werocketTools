<?php
/**
 * WP_List_Table des demandes de rétractation.
 */

namespace WeRocket\Tools\Modules\Retractation;

if (!class_exists('WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class ListTable extends \WP_List_Table {

    private Repository $repository;

    public function __construct(Repository $repository) {
        parent::__construct([
            'singular' => 'wr_retractation',
            'plural'   => 'wr_retractations',
            'ajax'     => false,
        ]);
        $this->repository = $repository;
    }

    public function get_columns(): array {
        return [
            'cb'         => '<input type="checkbox" />',
            'id'         => __('#', 'werocket-tools'),
            'order'      => __('Commande', 'werocket-tools'),
            'customer'   => __('Client', 'werocket-tools'),
            'scope'      => __('Portée', 'werocket-tools'),
            'status'     => __('Statut', 'werocket-tools'),
            'created'    => __('Reçue (UTC)', 'werocket-tools'),
        ];
    }

    protected function get_sortable_columns(): array {
        return [
            'id'      => ['id', false],
            'order'   => ['order_id', false],
            'status'  => ['status', false],
            'created' => ['created_at_gmt', true],
        ];
    }

    public function prepare_items(): void {
        $per_page = 20;
        $paged    = max(1, (int) ($_GET['paged'] ?? 1));
        $orderby  = isset($_GET['orderby']) ? sanitize_key((string) $_GET['orderby']) : 'created_at_gmt';
        $order    = isset($_GET['order']) ? sanitize_key((string) $_GET['order']) : 'desc';
        $search   = isset($_GET['s']) ? sanitize_text_field(wp_unslash((string) $_GET['s'])) : '';

        $columns = $this->get_columns();
        $hidden  = [];
        $sortable = $this->get_sortable_columns();
        $this->_column_headers = [$columns, $hidden, $sortable];

        $result = $this->repository->query([
            'per_page' => $per_page,
            'paged'    => $paged,
            'orderby'  => $orderby,
            'order'    => $order,
            'search'   => $search,
        ]);

        $this->items = $result['rows'];

        $this->set_pagination_args([
            'total_items' => $result['total'],
            'per_page'    => $per_page,
            'total_pages' => (int) ceil($result['total'] / $per_page),
        ]);
    }

    protected function column_cb($item): string {
        return '<input type="checkbox" name="ids[]" value="' . esc_attr((string) $item['id']) . '" />';
    }

    protected function column_id($item): string {
        $url = admin_url('admin.php?page=wr-retractations&view=' . (int) $item['id']);
        return '<strong><a href="' . esc_url($url) . '">#' . (int) $item['id'] . '</a></strong>';
    }

    protected function column_order($item): string {
        $order = wc_get_order((int) $item['order_id']);
        if ($order) {
            return '<a href="' . esc_url($order->get_edit_order_url()) . '">#' . esc_html($order->get_order_number()) . '</a>';
        }
        return '#' . (int) $item['order_id'];
    }

    protected function column_customer($item): string {
        $name = $item['customer_name'] ?: '—';
        $email = $item['customer_email'] ?: '';
        $html = '<strong>' . esc_html($name) . '</strong>';
        if ($email) {
            $html .= '<br /><a href="mailto:' . esc_attr($email) . '">' . esc_html($email) . '</a>';
        }
        return $html;
    }

    protected function column_scope($item): string {
        return $item['scope'] === 'total'
            ? '<span style="color:#137333;">' . esc_html__('Totale', 'werocket-tools') . '</span>'
            : '<span style="color:#b06000;">' . esc_html__('Partielle', 'werocket-tools') . '</span>';
    }

    protected function column_status($item): string {
        $label = Repository::STATUSES[$item['status']] ?? $item['status'];
        return '<span class="wr-status wr-status-' . esc_attr((string) $item['status']) . '">' . esc_html((string) $label) . '</span>';
    }

    protected function column_created($item): string {
        return esc_html((string) $item['created_at_gmt']);
    }

    protected function column_default($item, $column_name): string {
        return esc_html((string) ($item[$column_name] ?? ''));
    }

    public function no_items(): void {
        esc_html_e('Aucune demande de rétractation pour le moment.', 'werocket-tools');
    }
}
