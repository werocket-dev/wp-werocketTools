<?php
/**
 * Email d'accusé de réception — version HTML.
 *
 * Design éditorial premium, compatible Gmail / Apple Mail / Outlook.
 * Styles inline + table-based layout pour la robustesse clients mail.
 *
 * @var WC_Email $email
 * @var array    $request
 * @var string   $email_heading
 */
defined('ABSPATH') || exit;

$items = !empty($request['items']) ? (json_decode((string) $request['items'], true) ?: []) : [];
$scope_label = ($request['scope'] === 'total') ? __('totale', 'werocket-tools') : __('partielle', 'werocket-tools');
$site_name   = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
$customer    = (string) ($request['customer_name'] ?: $request['customer_email']);

// Date formatée FR à partir du GMT serveur
$created_gmt = strtotime((string) $request['created_at_gmt']);
$created_label = $created_gmt
    ? date_i18n(get_option('date_format') . ' · ' . get_option('time_format'), $created_gmt)
    : (string) $request['created_at_gmt'];

// Couleurs design system (depuis settings — fallback teal werocket)
$wr_settings = get_option('werocket_retractation_settings', []);
$accent      = (string) ($wr_settings['email_color'] ?? '#0F766E');
$accent_soft = \WeRocket\Tools\Modules\Retractation\Frontend::hex_to_rgba($accent, 0.1);
$ink         = '#1A1D1F';
$ink_muted   = '#5F6368';
$ink_subtle  = '#9AA0A6';
$bg_warm     = (string) ($wr_settings['email_bg_color'] ?? '#FAF8F4');
$surface     = (string) ($wr_settings['email_surface_color'] ?? '#FFFFFF');
$bg_alt      = \WeRocket\Tools\Modules\Retractation\Frontend::darken_hex($bg_warm, 0.97); // légère teinte plus profonde pour les zones secondaires
$border      = '#E8EAED';
$logo_url    = (string) ($wr_settings['email_logo_url'] ?? '');

$font_display = "'Fraunces', Georgia, 'Times New Roman', serif";
$font_body    = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

?><!DOCTYPE html>
<html lang="<?php echo esc_attr(get_bloginfo('language')); ?>">
<head>
<meta charset="<?php echo esc_attr(get_bloginfo('charset')); ?>" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title><?php echo esc_html($email_heading); ?></title>
<style>
    @media only screen and (max-width: 620px) {
        .wr-mail-container { width: 100% !important; padding: 0 16px !important; }
        .wr-mail-panel { padding: 28px 22px !important; }
        .wr-mail-title { font-size: 28px !important; }
        .wr-mail-h2 { font-size: 16px !important; }
        .wr-mail-meta-row { display: block !important; }
        .wr-mail-meta-cell { display: block !important; width: 100% !important; padding: 14px 0 !important; border-bottom: 1px solid <?php echo esc_attr($border); ?> !important; }
        .wr-mail-meta-cell:last-child { border-bottom: none !important; }
    }
</style>
</head>
<body style="margin:0;padding:0;background:<?php echo esc_attr($bg_warm); ?>;font-family:<?php echo esc_attr($font_body); ?>;color:<?php echo esc_attr($ink); ?>;">

<!-- preheader (invisible mais utilisé par Gmail/Apple Mail en preview) -->
<div style="display:none;font-size:1px;color:<?php echo esc_attr($bg_warm); ?>;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    <?php
    printf(
        /* translators: %d : numéro de demande */
        esc_html__('Votre demande de rétractation #%d a bien été reçue. Cet email tient lieu de support durable.', 'werocket-tools'),
        (int) $request['id']
    );
    ?>
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:<?php echo esc_attr($bg_warm); ?>;">
    <tr>
        <td align="center" style="padding:40px 16px;">

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wr-mail-container" style="width:600px;max-width:600px;">

                <!-- ── Brand row ── -->
                <tr>
                    <td style="padding:0 4px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                                <td align="left" valign="middle">
                                    <?php if (!empty($logo_url)) : ?>
                                        <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr($site_name); ?>" style="display:block;max-height:42px;width:auto;border:0;outline:none;text-decoration:none;" />
                                    <?php else : ?>
                                        <span style="font-family:<?php echo esc_attr($font_body); ?>;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_muted); ?>;">
                                            <?php echo esc_html($site_name); ?>
                                        </span>
                                    <?php endif; ?>
                                </td>
                                <td align="right" valign="middle" style="font-family:<?php echo esc_attr($font_body); ?>;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;">
                                    <?php esc_html_e('Accusé de réception', 'werocket-tools'); ?>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- ── Main panel ── -->
                <tr>
                    <td class="wr-mail-panel" style="background:<?php echo esc_attr($surface); ?>;border:1px solid <?php echo esc_attr($border); ?>;border-radius:24px;padding:42px 40px;box-shadow:0 24px 64px -32px rgba(26,29,31,0.12);">

                        <!-- Top accent bar -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                                <td style="padding-bottom:24px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="background:<?php echo esc_attr($accent); ?>;width:40px;height:3px;border-radius:2px;line-height:3px;font-size:0;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <!-- Hero serif -->
                        <h1 class="wr-mail-title" style="font-family:<?php echo esc_attr($font_display); ?>;font-size:34px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;color:<?php echo esc_attr($ink); ?>;margin:0 0 12px;">
                            <?php
                            printf(
                                /* translators: %s : prénom client */
                                esc_html__('Bien reçu, %s.', 'werocket-tools'),
                                esc_html($customer)
                            );
                            ?>
                        </h1>

                        <p style="font-family:<?php echo esc_attr($font_body); ?>;font-size:15.5px;line-height:1.6;color:<?php echo esc_attr($ink_muted); ?>;margin:0 0 28px;">
                            <?php esc_html_e('Nous accusons réception de votre demande de rétractation. Cet email constitue le support durable exigé par l\'article L221-21 du Code de la consommation. Conservez-le précieusement.', 'werocket-tools'); ?>
                        </p>

                        <!-- ── Ticket reference stub ── -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 32px;">
                            <tr>
                                <td style="background:<?php echo esc_attr($bg_alt); ?>;border:1px dashed <?php echo esc_attr($ink_subtle); ?>;border-radius:14px;padding:20px 22px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td>
                                                <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:10.5px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;margin-bottom:4px;">
                                                    <?php esc_html_e('Référence demande', 'werocket-tools'); ?>
                                                </div>
                                                <div style="font-family:<?php echo esc_attr($font_display); ?>;font-size:30px;font-weight:500;letter-spacing:-0.01em;color:<?php echo esc_attr($accent); ?>;line-height:1.05;">
                                                    #<?php echo esc_html((string) $request['id']); ?>
                                                </div>
                                            </td>
                                            <td align="right" valign="bottom">
                                                <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:10.5px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;margin-bottom:4px;">
                                                    <?php esc_html_e('Date de réception', 'werocket-tools'); ?>
                                                </div>
                                                <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:14px;color:<?php echo esc_attr($ink); ?>;">
                                                    <?php echo esc_html($created_label); ?>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <!-- ── Meta info ── -->
                        <h2 class="wr-mail-h2" style="font-family:<?php echo esc_attr($font_display); ?>;font-size:18px;font-weight:500;letter-spacing:-0.01em;color:<?php echo esc_attr($ink); ?>;margin:0 0 14px;">
                            <?php esc_html_e('Détails de votre demande', 'werocket-tools'); ?>
                        </h2>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="wr-mail-meta-row" style="margin:0 0 28px;">
                            <tr>
                                <td class="wr-mail-meta-cell" valign="top" style="width:50%;padding:0 14px 0 0;">
                                    <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;margin-bottom:4px;">
                                        <?php esc_html_e('Commande concernée', 'werocket-tools'); ?>
                                    </div>
                                    <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:14.5px;color:<?php echo esc_attr($ink); ?>;font-weight:500;">
                                        #<?php echo esc_html((string) $request['order_id']); ?>
                                    </div>
                                </td>
                                <td class="wr-mail-meta-cell" valign="top" style="width:50%;padding:0 0 0 14px;">
                                    <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;margin-bottom:4px;">
                                        <?php esc_html_e('Portée', 'werocket-tools'); ?>
                                    </div>
                                    <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:14.5px;color:<?php echo esc_attr($ink); ?>;font-weight:500;">
                                        <?php
                                        printf(
                                            esc_html__('Rétractation %s', 'werocket-tools'),
                                            '<span style="color:' . esc_attr($accent) . ';">' . esc_html($scope_label) . '</span>'
                                        );
                                        ?>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <?php if (!empty($items)) : ?>
                            <h2 class="wr-mail-h2" style="font-family:<?php echo esc_attr($font_display); ?>;font-size:18px;font-weight:500;letter-spacing:-0.01em;color:<?php echo esc_attr($ink); ?>;margin:0 0 14px;">
                                <?php esc_html_e('Articles concernés', 'werocket-tools'); ?>
                            </h2>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:<?php echo esc_attr($surface); ?>;border:1px solid <?php echo esc_attr($border); ?>;border-radius:14px;margin:0 0 28px;">
                                <?php foreach ($items as $i => $it) : ?>
                                    <tr>
                                        <td style="padding:13px 18px;<?php echo $i > 0 ? 'border-top:1px solid ' . esc_attr($border) . ';' : ''; ?>">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td valign="top" style="padding-right:12px;">
                                                        <span style="display:inline-block;width:6px;height:6px;background:<?php echo esc_attr($accent); ?>;border-radius:999px;vertical-align:middle;margin-right:8px;"></span>
                                                        <span style="font-family:<?php echo esc_attr($font_body); ?>;font-size:14.5px;color:<?php echo esc_attr($ink); ?>;line-height:1.45;"><?php echo esc_html((string) ($it['name'] ?? '')); ?></span>
                                                    </td>
                                                    <td align="right" valign="top" style="font-family:<?php echo esc_attr($font_body); ?>;font-size:13px;color:<?php echo esc_attr($ink_subtle); ?>;font-variant-numeric:tabular-nums;white-space:nowrap;">
                                                        <?php
                                                        /* translators: %d : quantité */
                                                        printf(esc_html__('× %d', 'werocket-tools'), (int) ($it['qty'] ?? 0));
                                                        ?>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </table>
                        <?php endif; ?>

                        <?php if (!empty($request['reason'])) : ?>
                            <h2 class="wr-mail-h2" style="font-family:<?php echo esc_attr($font_display); ?>;font-size:18px;font-weight:500;letter-spacing:-0.01em;color:<?php echo esc_attr($ink); ?>;margin:0 0 14px;">
                                <?php esc_html_e('Motif communiqué', 'werocket-tools'); ?>
                                <span style="font-family:<?php echo esc_attr($font_body); ?>;font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;color:<?php echo esc_attr($ink_subtle); ?>;background:<?php echo esc_attr($bg_alt); ?>;padding:2px 8px;border-radius:4px;margin-left:6px;vertical-align:middle;">
                                    <?php esc_html_e('Facultatif', 'werocket-tools'); ?>
                                </span>
                            </h2>
                            <div style="font-family:<?php echo esc_attr($font_body); ?>;font-style:italic;font-size:14.5px;line-height:1.6;color:<?php echo esc_attr($ink_muted); ?>;border-left:3px solid <?php echo esc_attr($accent_soft); ?>;padding:4px 0 4px 16px;margin:0 0 28px;">
                                <?php echo nl2br(esc_html((string) $request['reason'])); ?>
                            </div>
                        <?php endif; ?>

                        <!-- ── Timeline "Que se passe-t-il maintenant ?" ── -->
                        <h2 class="wr-mail-h2" style="font-family:<?php echo esc_attr($font_display); ?>;font-size:18px;font-weight:500;letter-spacing:-0.01em;color:<?php echo esc_attr($ink); ?>;margin:0 0 14px;">
                            <?php esc_html_e('Et maintenant ?', 'werocket-tools'); ?>
                        </h2>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 32px;">
                            <?php
                            $timeline = [
                                ['01', __('Réception', 'werocket-tools'),         __('Cette demande est désormais enregistrée dans notre système.', 'werocket-tools'), true],
                                ['02', __('Vérification', 'werocket-tools'),     __('Nos équipes examinent l\'éligibilité de votre demande sous 1 à 2 jours ouvrés.', 'werocket-tools'), false],
                                ['03', __('Modalités de retour', 'werocket-tools'), __('Nous reviendrons vers vous avec les instructions de retour des articles concernés.', 'werocket-tools'), false],
                                ['04', __('Remboursement', 'werocket-tools'),     __('Une fois les articles reçus et contrôlés, le remboursement est effectué sous 14 jours sur votre moyen de paiement initial.', 'werocket-tools'), false],
                            ];
                            foreach ($timeline as $idx => $step) :
                                [$num, $title, $desc, $is_current] = $step;
                                ?>
                                <tr>
                                    <td valign="top" style="width:36px;padding:0 14px 18px 0;">
                                        <div style="width:30px;height:30px;border-radius:999px;background:<?php echo $is_current ? esc_attr($accent) : esc_attr($bg_alt); ?>;color:<?php echo $is_current ? '#FFFFFF' : esc_attr($ink_subtle); ?>;font-family:<?php echo esc_attr($font_display); ?>;font-size:11.5px;font-weight:600;letter-spacing:0.04em;text-align:center;line-height:30px;">
                                            <?php echo esc_html($num); ?>
                                        </div>
                                    </td>
                                    <td valign="top" style="padding:0 0 18px 0;">
                                        <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:14.5px;font-weight:600;color:<?php echo esc_attr($ink); ?>;margin-bottom:2px;line-height:1.3;">
                                            <?php echo esc_html($title); ?>
                                            <?php if ($is_current) : ?>
                                                <span style="display:inline-block;margin-left:6px;padding:1px 7px;background:<?php echo esc_attr($accent_soft); ?>;color:<?php echo esc_attr($accent); ?>;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;vertical-align:middle;">
                                                    <?php esc_html_e('Fait', 'werocket-tools'); ?>
                                                </span>
                                            <?php endif; ?>
                                        </div>
                                        <div style="font-family:<?php echo esc_attr($font_body); ?>;font-size:13.5px;color:<?php echo esc_attr($ink_muted); ?>;line-height:1.55;">
                                            <?php echo esc_html($desc); ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </table>

                        <!-- ── Sign-off ── -->
                        <p style="font-family:<?php echo esc_attr($font_body); ?>;font-size:14.5px;line-height:1.6;color:<?php echo esc_attr($ink_muted); ?>;margin:0 0 8px;">
                            <?php esc_html_e('Vous pouvez répondre directement à cet email pour toute question.', 'werocket-tools'); ?>
                        </p>
                        <p style="font-family:<?php echo esc_attr($font_display); ?>;font-style:italic;font-size:15px;color:<?php echo esc_attr($ink); ?>;margin:14px 0 0;">
                            — <?php echo esc_html__('L\'équipe', 'werocket-tools') . ' ' . esc_html($site_name); ?>
                        </p>

                    </td>
                </tr>

                <!-- ── Legal footer ── -->
                <tr>
                    <td style="padding:24px 24px 8px;text-align:center;">
                        <p style="font-family:<?php echo esc_attr($font_body); ?>;font-size:11.5px;line-height:1.6;color:<?php echo esc_attr($ink_subtle); ?>;margin:0 0 8px;">
                            <?php esc_html_e('Cet email constitue le support durable mentionné à l\'article L221-21 du Code de la consommation.', 'werocket-tools'); ?>
                        </p>
                        <p style="font-family:<?php echo esc_attr($font_body); ?>;font-size:11.5px;line-height:1.5;color:<?php echo esc_attr($ink_subtle); ?>;margin:0;">
                            <?php
                            printf(
                                /* translators: %s : nom site */
                                esc_html__('© %1$s · %2$s', 'werocket-tools'),
                                esc_html(date_i18n('Y')),
                                esc_html($site_name)
                            );
                            ?>
                        </p>
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
