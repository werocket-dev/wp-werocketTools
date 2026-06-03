<?php
/**
 * WC_Email — Accusé de réception client (support durable).
 *
 * Le but de cet email est précisément de constituer le « support durable »
 * exigé par L221-21 du Code de la consommation.
 */

namespace WeRocket\Tools\Modules\Retractation;

if (!class_exists('WC_Email')) {
    return; // évite l'erreur si WC pas (encore) chargé
}

class EmailAcknowledgement extends \WC_Email {

    public function __construct() {
        $this->id             = 'wr_retractation_acknowledgement';
        $this->customer_email = true;
        $this->title          = __('Rétractation — accusé de réception', 'werocket-tools');
        $this->description    = __('Email envoyé au client pour confirmer la réception de sa demande de rétractation (support durable).', 'werocket-tools');

        $this->template_html  = 'modules/retractation/emails/acknowledgement.php';
        $this->template_plain = 'modules/retractation/emails/acknowledgement-plain.php';
        $this->template_base  = WEROCKET_TOOLS_PLUGIN_DIR . 'templates/';

        $this->placeholders = [
            '{request_id}'    => '',
            '{order_id}'      => '',
            '{customer_name}' => '',
            '{site_title}'    => $this->get_blogname(),
        ];

        parent::__construct();

        // Marquer la demande comme "acknowledged" après envoi réussi.
        add_action('woocommerce_email_sent', [$this, 'on_email_sent'], 10, 2);
    }

    public function get_default_subject(): string {
        return __('[{site_title}] Confirmation de votre demande de rétractation #{request_id}', 'werocket-tools');
    }

    public function get_default_heading(): string {
        return __('Votre demande de rétractation a bien été reçue', 'werocket-tools');
    }

    /** Déclenché par Emails::on_retractation_received. */
    public function trigger(array $request): void {
        $this->setup_locale();

        $this->placeholders['{request_id}']    = (string) $request['id'];
        $this->placeholders['{order_id}']      = (string) $request['order_id'];
        $this->placeholders['{customer_name}'] = (string) ($request['customer_name'] ?: $request['customer_email']);

        $this->object = $request; // accessible dans le template via $email->object

        if ($this->is_enabled() && !empty($request['customer_email'])) {
            $this->recipient = $request['customer_email'];
            $this->send(
                $this->get_recipient(),
                $this->get_subject(),
                $this->get_content(),
                $this->get_headers(),
                $this->get_attachments()
            );
        }

        $this->restore_locale();
    }

    public function get_content_html(): string {
        ob_start();
        wc_get_template(
            $this->template_html,
            [
                'email'         => $this,
                'request'       => $this->object,
                'email_heading' => $this->get_heading(),
                'sent_to_admin' => false,
                'plain_text'    => false,
            ],
            '',
            $this->template_base
        );
        return (string) ob_get_clean();
    }

    public function get_content_plain(): string {
        ob_start();
        wc_get_template(
            $this->template_plain,
            [
                'email'         => $this,
                'request'       => $this->object,
                'email_heading' => $this->get_heading(),
                'sent_to_admin' => false,
                'plain_text'    => true,
            ],
            '',
            $this->template_base
        );
        return (string) ob_get_clean();
    }

    public function on_email_sent(bool $sent, ?string $email_id): void {
        if (!$sent || $email_id !== $this->id) {
            return;
        }
        $request = $this->object;
        if (!is_array($request) || empty($request['id'])) {
            return;
        }
        (new Repository())->update_status((int) $request['id'], 'acknowledged');
    }
}
