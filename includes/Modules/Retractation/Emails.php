<?php
/**
 * Enregistre les emails WC et dispatch :
 *  - AR client (support durable) — WC_Email subclass.
 *  - Notif marchand (email HTML envoyé à merchant_email ou admin_email).
 */

namespace WeRocket\Tools\Modules\Retractation;

class Emails {

    private Repository $repository;

    public function __construct(Repository $repository) {
        $this->repository = $repository;
    }

    public function init(): void {
        add_filter('woocommerce_email_classes', [$this, 'register_wc_emails']);
        add_action('wr_retractation_received', [$this, 'on_retractation_received']);
    }

    public function register_wc_emails(array $emails): array {
        $emails['WR_Email_Acknowledgement'] = new EmailAcknowledgement();
        return $emails;
    }

    /** Hook callback : envoie AR client + notif marchand. */
    public function on_retractation_received(int $request_id): void {
        $request = $this->repository->get($request_id);
        if (!$request) {
            return;
        }

        // ── AR client via WC_Email ──
        $mailer = WC()->mailer();
        $emails = $mailer->get_emails();
        if (isset($emails['WR_Email_Acknowledgement'])) {
            /** @var EmailAcknowledgement $email */
            $email = $emails['WR_Email_Acknowledgement'];
            $email->trigger($request);
        }

        // ── Notif marchand ──
        $settings = get_option('werocket_retractation_settings', []);

        // Default true si le setting n'existe pas encore (premier déploiement).
        $notify = array_key_exists('merchant_notify', (array) $settings)
            ? !empty($settings['merchant_notify'])
            : true;

        if (!$notify) {
            return;
        }

        $to = !empty($settings['merchant_email']) && is_email($settings['merchant_email'])
            ? (string) $settings['merchant_email']
            : (string) get_option('admin_email');

        if (!is_email($to)) {
            return;
        }

        $site_name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
        $subject   = sprintf(
            /* translators: %1$s site, %2$d id de la demande */
            __('[%1$s] Nouvelle demande de rétractation #%2$d', 'werocket-tools'),
            $site_name,
            $request_id
        );

        $html = $this->render_merchant_email_html($request);

        // Headers HTML
        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $site_name . ' <' . get_option('admin_email') . '>',
        ];

        if (!empty($request['customer_email']) && is_email($request['customer_email'])) {
            $headers[] = 'Reply-To: ' . $request['customer_email'];
        }

        wp_mail($to, $subject, $html, $headers);
    }

    /** Rendu HTML compact (table-based, inline styles) — pour Gmail/Outlook etc. */
    private function render_merchant_email_html(array $request): string {
        $items = !empty($request['items']) ? (json_decode((string) $request['items'], true) ?: []) : [];
        $scope_label = ($request['scope'] === 'total')
            ? __('Totale', 'werocket-tools')
            : __('Partielle', 'werocket-tools');

        $admin_url = admin_url('admin.php?page=wr-retractations&view=' . (int) $request['id']);
        $order = wc_get_order((int) $request['order_id']);
        $order_url = $order ? $order->get_edit_order_url() : '';

        $created_gmt = strtotime((string) $request['created_at_gmt']);
        $created_label = $created_gmt
            ? date_i18n(get_option('date_format') . ' · ' . get_option('time_format'), $created_gmt)
            : (string) $request['created_at_gmt'];

        // Palette (depuis settings)
        $settings    = get_option('werocket_retractation_settings', []);
        $accent      = (string) ($settings['email_color'] ?? '#0F766E');
        $accent_soft = Frontend::hex_to_rgba($accent, 0.1);
        $logo_url    = (string) ($settings['email_logo_url'] ?? '');
        $ink         = '#1A1D1F';
        $ink_muted   = '#5F6368';
        $ink_subtle  = '#9AA0A6';
        $bg_warm     = (string) ($settings['email_bg_color'] ?? '#FAF8F4');
        $surface     = (string) ($settings['email_surface_color'] ?? '#FFFFFF');
        $bg_alt      = Frontend::darken_hex($bg_warm, 0.97);
        $border      = '#E8EAED';

        $font_display = "'Fraunces', Georgia, 'Times New Roman', serif";
        $font_body    = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

        ob_start();
        ?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr(get_bloginfo('language')); ?>">
<head>
<meta charset="<?php echo esc_attr(get_bloginfo('charset')); ?>" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title><?php esc_html_e('Nouvelle demande de rétractation', 'werocket-tools'); ?></title>
</head>
<body style="margin:0;padding:0;background:<?php echo esc_attr($bg_warm); ?>;font-family:<?php echo esc_attr($font_body); ?>;color:<?php echo esc_attr($ink); ?>;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:<?php echo esc_attr($bg_warm); ?>;">
    <tr>
        <td align="center" style="padding:32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">

                <!-- Brand row -->
                <tr>
                    <td style="padding:0 4px 16px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                                <td align="left" valign="middle">
                                    <?php if (!empty($logo_url)) : ?>
                                        <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr(wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES)); ?>" style="display:block;max-height:36px;width:auto;border:0;outline:none;text-decoration:none;" />
                                    <?php else : ?>
                                        <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_muted); ?>;">
                                            <?php echo esc_html(wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES)); ?>
                                        </span>
                                    <?php endif; ?>
                                </td>
                                <td align="right" valign="middle">
                                    <span style="display:inline-block;padding:3px 9px;background:<?php echo esc_attr($accent); ?>;color:#FFFFFF;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                                        <?php esc_html_e('Action requise', 'werocket-tools'); ?>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Panel -->
                <tr>
                    <td style="background:<?php echo esc_attr($surface); ?>;border:1px solid <?php echo esc_attr($border); ?>;border-radius:20px;padding:32px 34px;box-shadow:0 12px 32px -16px rgba(26,29,31,0.10);">

                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="40">
                            <tr>
                                <td style="background:<?php echo esc_attr($accent); ?>;width:40px;height:3px;border-radius:2px;line-height:3px;font-size:0;">&nbsp;</td>
                            </tr>
                        </table>

                        <h1 style="font-family:<?php echo esc_attr($font_display); ?>;font-size:26px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;color:<?php echo esc_attr($ink); ?>;margin:18px 0 6px;">
                            <?php esc_html_e('Nouvelle demande de rétractation', 'werocket-tools'); ?>
                        </h1>

                        <p style="font-size:14px;line-height:1.55;color:<?php echo esc_attr($ink_muted); ?>;margin:0 0 22px;">
                            <?php esc_html_e('Un client vient de soumettre une demande de rétractation. L\'accusé de réception lui a été envoyé automatiquement.', 'werocket-tools'); ?>
                        </p>

                        <!-- Quick reference card -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">
                            <tr>
                                <td style="background:<?php echo esc_attr($bg_alt); ?>;border:1px solid <?php echo esc_attr($border); ?>;border-radius:12px;padding:14px 18px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td valign="top" style="width:33%;">
                                                <div style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;margin-bottom:3px;">
                                                    <?php esc_html_e('Demande', 'werocket-tools'); ?>
                                                </div>
                                                <div style="font-family:<?php echo esc_attr($font_display); ?>;font-size:20px;font-weight:500;color:<?php echo esc_attr($accent); ?>;line-height:1;">
                                                    #<?php echo esc_html((string) $request['id']); ?>
                                                </div>
                                            </td>
                                            <td valign="top" style="width:33%;">
                                                <div style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;margin-bottom:3px;">
                                                    <?php esc_html_e('Commande', 'werocket-tools'); ?>
                                                </div>
                                                <?php if ($order_url) : ?>
                                                    <a href="<?php echo esc_url($order_url); ?>" style="font-family:<?php echo esc_attr($font_display); ?>;font-size:20px;font-weight:500;color:<?php echo esc_attr($ink); ?>;line-height:1;text-decoration:none;">
                                                        #<?php echo esc_html((string) ($order ? $order->get_order_number() : (string) $request['order_id'])); ?>
                                                    </a>
                                                <?php else : ?>
                                                    <span style="font-family:<?php echo esc_attr($font_display); ?>;font-size:20px;font-weight:500;color:<?php echo esc_attr($ink); ?>;line-height:1;">
                                                        #<?php echo esc_html((string) $request['order_id']); ?>
                                                    </span>
                                                <?php endif; ?>
                                            </td>
                                            <td valign="top" style="width:34%;">
                                                <div style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:<?php echo esc_attr($ink_subtle); ?>;margin-bottom:3px;">
                                                    <?php esc_html_e('Portée', 'werocket-tools'); ?>
                                                </div>
                                                <div style="font-family:<?php echo esc_attr($font_display); ?>;font-size:20px;font-weight:500;color:<?php echo $request['scope'] === 'total' ? esc_attr($accent) : '#B06000'; ?>;line-height:1;">
                                                    <?php echo esc_html($scope_label); ?>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <!-- Customer info -->
                        <h2 style="font-family:<?php echo esc_attr($font_display); ?>;font-size:15px;font-weight:500;color:<?php echo esc_attr($ink); ?>;margin:0 0 8px;">
                            <?php esc_html_e('Client', 'werocket-tools'); ?>
                        </h2>
                        <p style="font-size:14px;color:<?php echo esc_attr($ink); ?>;margin:0 0 4px;">
                            <strong><?php echo esc_html((string) $request['customer_name']); ?></strong>
                        </p>
                        <p style="font-size:14px;margin:0 0 18px;">
                            <a href="mailto:<?php echo esc_attr((string) $request['customer_email']); ?>" style="color:<?php echo esc_attr($accent); ?>;text-decoration:none;border-bottom:1px solid <?php echo esc_attr($accent_soft); ?>;">
                                <?php echo esc_html((string) $request['customer_email']); ?>
                            </a>
                        </p>

                        <?php if (!empty($items)) : ?>
                            <h2 style="font-family:<?php echo esc_attr($font_display); ?>;font-size:15px;font-weight:500;color:<?php echo esc_attr($ink); ?>;margin:0 0 8px;">
                                <?php esc_html_e('Articles concernés', 'werocket-tools'); ?>
                            </h2>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:<?php echo esc_attr($surface); ?>;border:1px solid <?php echo esc_attr($border); ?>;border-radius:10px;margin:0 0 18px;">
                                <?php foreach ($items as $i => $it) : ?>
                                    <tr>
                                        <td style="padding:10px 14px;<?php echo $i > 0 ? 'border-top:1px solid ' . esc_attr($border) . ';' : ''; ?>font-size:13.5px;color:<?php echo esc_attr($ink); ?>;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td><?php echo esc_html((string) ($it['name'] ?? '')); ?></td>
                                                    <td align="right" style="color:<?php echo esc_attr($ink_subtle); ?>;font-variant-numeric:tabular-nums;">× <?php echo esc_html((string) ($it['qty'] ?? 0)); ?></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </table>
                        <?php endif; ?>

                        <?php if (!empty($request['reason'])) : ?>
                            <h2 style="font-family:<?php echo esc_attr($font_display); ?>;font-size:15px;font-weight:500;color:<?php echo esc_attr($ink); ?>;margin:0 0 8px;">
                                <?php esc_html_e('Motif communiqué', 'werocket-tools'); ?>
                            </h2>
                            <div style="font-style:italic;font-size:13.5px;line-height:1.6;color:<?php echo esc_attr($ink_muted); ?>;border-left:3px solid <?php echo esc_attr($accent_soft); ?>;padding:2px 0 2px 14px;margin:0 0 22px;">
                                <?php echo nl2br(esc_html((string) $request['reason'])); ?>
                            </div>
                        <?php endif; ?>

                        <!-- Meta -->
                        <p style="font-size:12px;color:<?php echo esc_attr($ink_subtle); ?>;margin:18px 0 22px;">
                            <?php
                            printf(
                                esc_html__('Reçue le %s', 'werocket-tools'),
                                esc_html($created_label)
                            );
                            ?>
                        </p>

                        <!-- CTA -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background:<?php echo esc_attr($ink); ?>;border-radius:999px;">
                                    <a href="<?php echo esc_url($admin_url); ?>" style="display:inline-block;padding:12px 22px;color:#FFFFFF;font-size:14px;font-weight:500;text-decoration:none;letter-spacing:-0.005em;">
                                        <?php esc_html_e('Traiter la demande →', 'werocket-tools'); ?>
                                    </a>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding:20px 24px 8px;text-align:center;">
                        <p style="font-size:11px;line-height:1.5;color:<?php echo esc_attr($ink_subtle); ?>;margin:0;">
                            <?php esc_html_e('Notification automatique de WeRocket Tools — Module Rétractation.', 'werocket-tools'); ?>
                            <br />
                            <?php esc_html_e('Vous pouvez désactiver ces notifications depuis WeRocket Tools → Rétractation.', 'werocket-tools'); ?>
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
        <?php
        return (string) ob_get_clean();
    }
}
