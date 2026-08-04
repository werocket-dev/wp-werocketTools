<?php
/**
 * Affiche le bloc Clic & Collect dans l'écran de détail commande admin (HPOS-aware).
 */

namespace WeRocket\Tools\Modules\ClickCollect;

class Admin {

    private ClickCollectModule $module;

    public function __construct(ClickCollectModule $module) {
        $this->module = $module;
    }

    public function init(): void {
        add_action('add_meta_boxes', [$this, 'register_metabox']);
    }

    public function register_metabox(): void {
        $screens = ['shop_order', 'woocommerce_page_wc-orders'];
        foreach ($screens as $screen) {
            add_meta_box(
                'wr_click_collect_meta',
                __('Clic & Collect', 'werocket-tools'),
                [$this, 'render_metabox'],
                $screen,
                'side',
                'default'
            );
        }
    }

    public function render_metabox($post_or_order): void {
        $order = ($post_or_order instanceof \WC_Order)
            ? $post_or_order
            : wc_get_order(is_object($post_or_order) ? $post_or_order->ID : 0);

        if (!$order instanceof \WC_Order) {
            echo '<p>' . esc_html__('Commande introuvable.', 'werocket-tools') . '</p>';
            return;
        }

        $location_id = $order->get_meta(ClickCollectModule::META_LOCATION_ID);
        if (!$location_id) {
            echo '<p style="margin:0;color:#666;">' . esc_html__('Aucun retrait en magasin pour cette commande.', 'werocket-tools') . '</p>';
            return;
        }

        $name    = (string) $order->get_meta(ClickCollectModule::META_LOCATION_NAME);
        $address = (string) $order->get_meta(ClickCollectModule::META_LOCATION_ADDR);
        $date    = (string) $order->get_meta(ClickCollectModule::META_PICKUP_DATE);
        $time    = (string) $order->get_meta(ClickCollectModule::META_PICKUP_TIME);
        $accent  = (string) ($this->module->get_settings()['accent_color'] ?? '#0F766E');

        $date_h = $date ? wp_date(get_option('date_format', 'd/m/Y'), strtotime($date) ?: time()) : '';
        ?>
        <div style="font-size:13px;line-height:1.5;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:<?php echo esc_attr($accent); ?>;"></span>
                <strong><?php echo esc_html($name); ?></strong>
            </div>
            <?php if ($address): ?>
                <p style="margin:0 0 8px;color:#444;white-space:pre-line;"><?php echo esc_html($address); ?></p>
            <?php endif; ?>
            <p style="margin:0 0 4px;">
                <span style="color:#666;"><?php esc_html_e('Date :', 'werocket-tools'); ?></span>
                <strong><?php echo esc_html($date_h); ?></strong>
            </p>
            <?php if ($time): ?>
                <p style="margin:0;">
                    <span style="color:#666;"><?php esc_html_e('Créneau :', 'werocket-tools'); ?></span>
                    <strong><?php echo esc_html($time); ?></strong>
                </p>
            <?php endif; ?>
        </div>
        <?php
    }
}
