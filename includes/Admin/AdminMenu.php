<?php
/**
 * Admin Menu Handler
 */

namespace WeRocket\Tools\Admin;

use WeRocket\Tools\Modules\ModuleManager;

class AdminMenu {

    private ModuleManager $module_manager;
    private string $hook_suffix = '';

    public function __construct(ModuleManager $module_manager) {
        $this->module_manager = $module_manager;
    }

    public function init(): void {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function register_menu(): void {
        $rocket_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1499 1094" fill="none">'
            . '<path fill-rule="evenodd" clip-rule="evenodd" d="M737.713 759.129C737.865 756.139 736.045 753.448 733.164 752.418C730.434 751.389 727.247 752.244 725.276 754.553C676.594 813.605 504.768 1022.22 504.768 1022.22C504.768 1022.22 458.815 1093.56 358.114 1093.56C257.414 1093.56 198.572 1002.94 198.572 938.008C198.572 880.808 198.572 683.997 198.572 637.929C198.572 635.52 197.51 633.23 195.69 631.645C193.87 630.062 191.443 629.338 189.016 629.663C164.903 632.481 99.2353 634.209 48.7335 581.064C-14.2043 514.699 -7.83347 430.542 21.1331 384.789C50.0996 339.035 237.396 65.6499 237.396 65.6499C237.396 65.6499 282.741 0 371.005 0C459.27 0 537.979 73.3202 537.979 154.563V435.019C537.979 437.714 539.648 440.115 542.227 441.004C544.805 441.894 547.685 441.077 549.353 438.969C594.396 382.23 759.704 174.72 759.704 174.72C759.704 174.72 805.655 111.496 895.588 111.496C985.521 111.496 1076.67 186.829 1076.67 281.574C1076.67 347.582 1076.67 405.913 1076.67 435.227C1076.67 438.404 1078.64 441.252 1081.52 442.388C1084.55 443.524 1087.89 442.713 1090.01 440.349C1123.98 402.532 1210.73 305.823 1210.73 305.823C1210.73 305.823 1325.39 183.898 1440.64 298.694C1555.75 413.49 1465.21 525.166 1458.09 532.365C1450.81 539.564 1093.96 954.37 1093.96 954.37C1093.96 954.37 1044.97 1031.78 926.07 1031.78C807.323 1031.78 737.562 920.794 737.562 842.993C737.562 801.804 737.713 775.12 737.713 759.129Z" fill="black"/>'
            . '</svg>';

        $this->hook_suffix = add_menu_page(
            __('Werocket', 'werocket-tools'),
            __('Werocket', 'werocket-tools'),
            'manage_options',
            'werocket-tools',
            [$this, 'render_admin_page'],
            'data:image/svg+xml;base64,' . base64_encode( $rocket_svg ),
            30
        );
    }

    public function enqueue_assets(string $hook): void {
        if ($hook !== $this->hook_suffix) {
            return;
        }

        // Permet d'utiliser wp.media() depuis React (module Rétractation : logo email).
        wp_enqueue_media();

        ViteAssets::enqueue_entry('admin/main.tsx', 'werocket-admin');
    }

    public function render_admin_page(): void {
        include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/admin/main.php';
    }
}
