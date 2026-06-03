<?php
/**
 * RGPD — exporter + eraser pour les demandes de rétractation.
 *
 * IMPORTANT : l'eraser ANONYMISE (ne supprime pas) car la demande est
 * un document à valeur juridique (preuve). Voir Principe non négociable #5.
 */

namespace WeRocket\Tools\Modules\Retractation;

class Privacy {

    private Repository $repository;

    public function __construct(Repository $repository) {
        $this->repository = $repository;
    }

    public function init(): void {
        add_filter('wp_privacy_personal_data_exporters', [$this, 'register_exporter']);
        add_filter('wp_privacy_personal_data_erasers', [$this, 'register_eraser']);
    }

    public function register_exporter(array $exporters): array {
        $exporters['wr-retractation'] = [
            'exporter_friendly_name' => __('Demandes de rétractation', 'werocket-tools'),
            'callback'               => [$this, 'export'],
        ];
        return $exporters;
    }

    public function register_eraser(array $erasers): array {
        $erasers['wr-retractation'] = [
            'eraser_friendly_name' => __('Demandes de rétractation (anonymisation)', 'werocket-tools'),
            'callback'             => [$this, 'erase'],
        ];
        return $erasers;
    }

    public function export(string $email, int $page = 1): array {
        $rows = $this->repository->get_by_email($email);
        $data = [];

        foreach ($rows as $row) {
            $items = json_decode((string) ($row['items'] ?? ''), true) ?: [];
            $items_summary = '';
            if ($items) {
                $parts = [];
                foreach ($items as $it) {
                    $parts[] = ((string) ($it['name'] ?? '')) . ' x ' . (int) ($it['qty'] ?? 0);
                }
                $items_summary = implode(', ', $parts);
            }

            $data[] = [
                'group_id'    => 'wr-retractation',
                'group_label' => __('Demandes de rétractation', 'werocket-tools'),
                'item_id'     => 'wr-retractation-' . (int) $row['id'],
                'data'        => [
                    ['name' => __('ID', 'werocket-tools'),              'value' => (string) $row['id']],
                    ['name' => __('Commande', 'werocket-tools'),         'value' => (string) $row['order_id']],
                    ['name' => __('Email', 'werocket-tools'),            'value' => (string) $row['customer_email']],
                    ['name' => __('Nom', 'werocket-tools'),              'value' => (string) $row['customer_name']],
                    ['name' => __('Adresse', 'werocket-tools'),          'value' => (string) $row['customer_address']],
                    ['name' => __('Portée', 'werocket-tools'),           'value' => (string) $row['scope']],
                    ['name' => __('Articles', 'werocket-tools'),         'value' => $items_summary],
                    ['name' => __('Motif', 'werocket-tools'),            'value' => (string) ($row['reason'] ?? '')],
                    ['name' => __('Statut', 'werocket-tools'),           'value' => (string) $row['status']],
                    ['name' => __('Reçue (UTC)', 'werocket-tools'),      'value' => (string) $row['created_at_gmt']],
                    ['name' => __('IP', 'werocket-tools'),               'value' => (string) $row['user_ip']],
                ],
            ];
        }

        return [
            'data' => $data,
            'done' => true,
        ];
    }

    public function erase(string $email, int $page = 1): array {
        $affected = $this->repository->anonymize_by_email($email);

        $messages = [];
        if ($affected > 0) {
            $messages[] = sprintf(
                /* translators: %d : nombre de demandes */
                _n(
                    '%d demande de rétractation anonymisée (conservation de la trace pour preuve légale).',
                    '%d demandes de rétractation anonymisées (conservation de la trace pour preuve légale).',
                    $affected,
                    'werocket-tools'
                ),
                $affected
            );
        }

        return [
            'items_removed'  => false,    // pas de suppression
            'items_retained' => $affected, // conservé (anonymisé)
            'messages'       => $messages,
            'done'           => true,
        ];
    }
}
