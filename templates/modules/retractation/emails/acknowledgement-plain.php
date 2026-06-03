<?php
/**
 * Email d'accusé de réception — version texte brut (mirror structuré).
 *
 * @var WC_Email $email
 * @var array    $request
 * @var string   $email_heading
 */
defined('ABSPATH') || exit;

$items       = !empty($request['items']) ? (json_decode((string) $request['items'], true) ?: []) : [];
$scope_label = ($request['scope'] === 'total') ? __('totale', 'werocket-tools') : __('partielle', 'werocket-tools');
$site_name   = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
$customer    = (string) ($request['customer_name'] ?: $request['customer_email']);

$created_gmt = strtotime((string) $request['created_at_gmt']);
$created_label = $created_gmt
    ? date_i18n(get_option('date_format') . ' · ' . get_option('time_format'), $created_gmt)
    : (string) $request['created_at_gmt'];

$divider = str_repeat('─', 56);

echo strtoupper($site_name) . " — " . esc_html__('ACCUSÉ DE RÉCEPTION', 'werocket-tools') . "\n";
echo $divider . "\n\n";

printf(esc_html__('Bien reçu, %s.', 'werocket-tools') . "\n\n", $customer);

esc_html_e(
    'Nous accusons réception de votre demande de rétractation. Cet email constitue le support durable exigé par l\'article L221-21 du Code de la consommation. Conservez-le précieusement.',
    'werocket-tools'
);
echo "\n\n";

echo "┌" . str_repeat('─', 54) . "┐\n";
echo "│  " . esc_html__('RÉFÉRENCE DEMANDE', 'werocket-tools') . str_repeat(' ', 54 - 4 - mb_strlen(esc_html__('RÉFÉRENCE DEMANDE', 'werocket-tools'))) . "│\n";
echo "│  #" . (int) $request['id'] . str_repeat(' ', 54 - 3 - strlen((string)(int)$request['id'])) . "│\n";
echo "│" . str_repeat(' ', 54) . "│\n";
echo "│  " . esc_html__('Reçue le', 'werocket-tools') . " : " . $created_label . "\n";
echo "└" . str_repeat('─', 54) . "┘\n\n";

echo "── " . esc_html__('DÉTAILS DE VOTRE DEMANDE', 'werocket-tools') . " ──\n\n";

echo " • " . esc_html__('Commande concernée', 'werocket-tools') . " : #" . (int) $request['order_id'] . "\n";
echo " • " . esc_html__('Portée', 'werocket-tools') . " : " . esc_html__('Rétractation', 'werocket-tools') . ' ' . $scope_label . "\n\n";

if (!empty($items)) {
    echo "── " . esc_html__('ARTICLES CONCERNÉS', 'werocket-tools') . " ──\n\n";
    foreach ($items as $it) {
        $line = ' • ' . (string) ($it['name'] ?? '');
        if (!empty($it['qty'])) {
            $line .= '  × ' . (int) $it['qty'];
        }
        echo $line . "\n";
    }
    echo "\n";
}

if (!empty($request['reason'])) {
    echo "── " . esc_html__('MOTIF COMMUNIQUÉ', 'werocket-tools') . " (" . esc_html__('facultatif', 'werocket-tools') . ") ──\n\n";
    echo trim((string) $request['reason']) . "\n\n";
}

echo "── " . esc_html__('ET MAINTENANT ?', 'werocket-tools') . " ──\n\n";
echo " 01.  " . esc_html__('RÉCEPTION', 'werocket-tools') . " [✓ " . esc_html__('Fait', 'werocket-tools') . "]\n";
echo "      " . esc_html__('Cette demande est désormais enregistrée dans notre système.', 'werocket-tools') . "\n\n";
echo " 02.  " . esc_html__('VÉRIFICATION', 'werocket-tools') . "\n";
echo "      " . esc_html__('Nos équipes examinent l\'éligibilité de votre demande sous 1 à 2 jours ouvrés.', 'werocket-tools') . "\n\n";
echo " 03.  " . esc_html__('MODALITÉS DE RETOUR', 'werocket-tools') . "\n";
echo "      " . esc_html__('Nous reviendrons vers vous avec les instructions de retour des articles concernés.', 'werocket-tools') . "\n\n";
echo " 04.  " . esc_html__('REMBOURSEMENT', 'werocket-tools') . "\n";
echo "      " . esc_html__('Une fois les articles reçus et contrôlés, le remboursement est effectué sous 14 jours sur votre moyen de paiement initial.', 'werocket-tools') . "\n\n";

echo $divider . "\n";
esc_html_e('Vous pouvez répondre directement à cet email pour toute question.', 'werocket-tools');
echo "\n\n— " . esc_html__('L\'équipe', 'werocket-tools') . ' ' . $site_name . "\n\n";

echo $divider . "\n";
esc_html_e('Cet email constitue le support durable mentionné à l\'article L221-21 du Code de la consommation.', 'werocket-tools');
echo "\n";
printf("© %s · %s\n", date_i18n('Y'), $site_name);
