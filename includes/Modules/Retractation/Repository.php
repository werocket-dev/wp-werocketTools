<?php
/**
 * Accès données aux demandes de rétractation.
 *
 * Toutes les requêtes passent par $wpdb->prepare().
 * Horodatage GMT côté serveur — jamais le client (Principe non négociable #3).
 */

namespace WeRocket\Tools\Modules\Retractation;

class Repository {

    public const STATUSES = [
        'pending'      => 'En attente',
        'acknowledged' => 'AR envoyé',
        'accepted'     => 'Acceptée',
        'refunded'     => 'Remboursée',
        'rejected'     => 'Refusée',
        'cancelled'    => 'Annulée',
    ];

    private string $table;

    public function __construct() {
        $this->table = Install::table_name();
    }

    /**
     * Insère une nouvelle demande.
     *
     * @param array{
     *   order_id: int,
     *   customer_email: string,
     *   customer_name?: string,
     *   customer_address?: string,
     *   scope?: 'total'|'partial',
     *   items?: array<int, array{order_item_id:int, qty:int, name:string}>,
     *   reason?: string,
     *   user_ip?: string,
     *   user_agent?: string,
     * } $data
     */
    public function insert(array $data): int {
        global $wpdb;

        $now = current_time('mysql', true); // GMT — voir spec.

        $payload = [
            'order_id'         => (int) ($data['order_id'] ?? 0),
            'customer_email'   => substr((string) ($data['customer_email'] ?? ''), 0, 190),
            'customer_name'    => substr((string) ($data['customer_name'] ?? ''), 0, 190),
            'customer_address' => (string) ($data['customer_address'] ?? ''),
            'scope'            => in_array($data['scope'] ?? '', ['total', 'partial'], true) ? $data['scope'] : 'total',
            'items'            => isset($data['items']) ? wp_json_encode($data['items']) : null,
            'reason'           => (string) ($data['reason'] ?? ''),
            'status'           => 'pending',
            'user_ip'          => substr((string) ($data['user_ip'] ?? ''), 0, 64),
            'user_agent'       => substr((string) ($data['user_agent'] ?? ''), 0, 255),
            'created_at_gmt'   => $now,
            'updated_at_gmt'   => $now,
        ];

        $formats = ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'];

        $ok = $wpdb->insert($this->table, $payload, $formats);
        if ($ok === false) {
            return 0;
        }
        return (int) $wpdb->insert_id;
    }

    public function get(int $id): ?array {
        global $wpdb;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$this->table} WHERE id = %d", $id),
            ARRAY_A
        );
        return $row ?: null;
    }

    public function update_status(int $id, string $status): bool {
        global $wpdb;
        if (!array_key_exists($status, self::STATUSES)) {
            return false;
        }
        $now = current_time('mysql', true);
        $rows = $wpdb->update(
            $this->table,
            ['status' => $status, 'updated_at_gmt' => $now],
            ['id' => $id],
            ['%s', '%s'],
            ['%d']
        );
        return (bool) $rows;
    }

    /**
     * Liste paginée des demandes.
     *
     * @param array{status?:string, order_id?:int, search?:string, per_page?:int, paged?:int, orderby?:string, order?:string} $args
     * @return array{rows: array<int, array<string,mixed>>, total: int}
     */
    public function query(array $args = []): array {
        global $wpdb;

        $per_page = max(1, (int) ($args['per_page'] ?? 20));
        $paged    = max(1, (int) ($args['paged'] ?? 1));
        $offset   = ($paged - 1) * $per_page;

        $allowed_order_by = ['id', 'created_at_gmt', 'updated_at_gmt', 'status', 'order_id'];
        $orderby = in_array($args['orderby'] ?? '', $allowed_order_by, true) ? $args['orderby'] : 'created_at_gmt';
        $order   = strtoupper((string) ($args['order'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';

        $where = ['1=1'];
        $params = [];

        if (!empty($args['status']) && array_key_exists($args['status'], self::STATUSES)) {
            $where[] = 'status = %s';
            $params[] = $args['status'];
        }

        if (!empty($args['order_id'])) {
            $where[] = 'order_id = %d';
            $params[] = (int) $args['order_id'];
        }

        if (!empty($args['search'])) {
            $where[] = '(customer_email LIKE %s OR customer_name LIKE %s)';
            $like = '%' . $wpdb->esc_like($args['search']) . '%';
            $params[] = $like;
            $params[] = $like;
        }

        $where_sql = implode(' AND ', $where);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $total = (int) $wpdb->get_var(
            $params
                ? $wpdb->prepare("SELECT COUNT(*) FROM {$this->table} WHERE {$where_sql}", $params)
                : "SELECT COUNT(*) FROM {$this->table} WHERE {$where_sql}"
        );

        $sql = "SELECT * FROM {$this->table} WHERE {$where_sql} ORDER BY {$orderby} {$order} LIMIT %d OFFSET %d";
        $params_with_limit = array_merge($params, [$per_page, $offset]);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL
        $rows = $wpdb->get_results($wpdb->prepare($sql, $params_with_limit), ARRAY_A);

        return [
            'rows'  => $rows ?: [],
            'total' => $total,
        ];
    }

    /** Liste les demandes liées à un email donné — utilisé par Privacy::export(). */
    public function get_by_email(string $email): array {
        global $wpdb;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        return $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM {$this->table} WHERE customer_email = %s ORDER BY id DESC", $email),
            ARRAY_A
        ) ?: [];
    }

    /** Anonymise toutes les demandes d'un email donné — Privacy::erase(). */
    public function anonymize_by_email(string $email): int {
        global $wpdb;
        $rows = $wpdb->update(
            $this->table,
            [
                'customer_email'   => '',
                'customer_name'    => '',
                'customer_address' => '',
                'reason'           => '',
                'user_ip'          => '',
                'user_agent'       => '',
                'updated_at_gmt'   => current_time('mysql', true),
            ],
            ['customer_email' => $email],
            ['%s', '%s', '%s', '%s', '%s', '%s', '%s'],
            ['%s']
        );
        return (int) $rows;
    }

    public function get_table_name(): string {
        return $this->table;
    }
}
