<?php
/**
 * Main Admin Template
 *
 * @var array $modules
 * @var string $current_tab
 */

defined('ABSPATH') || exit;

$options = get_option('werocket_tools_options', []);
$active_modules = $options['active_modules'] ?? [];
?>

<div id="werocket-tools-app" class="werocket-wrap">
    <!-- Header -->
    <div class="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 rounded-lg mb-6 mt-4 mr-4">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    WeRocket Tools
                </h1>
                <p class="text-emerald-100 mt-2"><?php esc_html_e('Suite d\'outils pour votre site WordPress', 'werocket-tools'); ?></p>
            </div>
            <div class="text-white text-sm">
                <?php printf(__('Version %s', 'werocket-tools'), WEROCKET_TOOLS_VERSION); ?>
            </div>
        </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="bg-white rounded-lg shadow mr-4 mb-6">
        <nav class="flex align-items-center justify-start border-b border-gray-200" aria-label="Tabs">
            <a href="<?php echo esc_url(admin_url('admin.php?page=werocket-tools&tab=dashboard')); ?>"
               class="tab-link px-6 py-4 text-sm font-medium border-b-2 <?php echo $current_tab === 'dashboard' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'; ?>">
                <svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                <?php esc_html_e('Tableau de bord', 'werocket-tools'); ?>
            </a>

            <?php foreach ($modules as $module): ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=werocket-tools&tab=' . $module->get_id())); ?>"
                   class="tab-link px-6 py-4 text-sm font-medium border-b-2 <?php echo $current_tab === $module->get_id() ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'; ?>">
                    <?php echo $module->get_icon(); ?>
                    <?php echo esc_html($module->get_name()); ?>
                </a>
            <?php endforeach; ?>
        </nav>
    </div>

    <!-- Tab Content -->
    <div class="mr-4">
        <?php if ($current_tab === 'dashboard'): ?>
            <?php include WEROCKET_TOOLS_PLUGIN_DIR . 'templates/admin/dashboard.php'; ?>
        <?php else: ?>
            <?php
            $module = $modules[$current_tab] ?? null;
            if ($module):
                ?>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-6 pb-4 border-b">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900"><?php echo esc_html($module->get_name()); ?></h2>
                            <p class="text-gray-500 text-sm mt-1"><?php echo esc_html($module->get_description()); ?></p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox"
                                   class="sr-only peer module-toggle"
                                   data-module="<?php echo esc_attr($module->get_id()); ?>"
                                   <?php checked(!empty($active_modules[$module->get_id()])); ?>>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span class="ml-3 text-sm font-medium text-gray-700"><?php esc_html_e('Actif', 'werocket-tools'); ?></span>
                        </label>
                    </div>
                    <div class="module-settings">
                        <?php $module->render_settings(); ?>
                    </div>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>

    <!-- Toast Notification -->
    <div id="werocket-toast" class="fixed bottom-4 right-4 transform translate-y-full opacity-0 transition-all duration-300 ease-in-out">
        <div class="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg class="w-5 h-5 text-green-400 toast-icon-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg class="w-5 h-5 text-red-400 toast-icon-error hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <span class="toast-message"></span>
        </div>
    </div>
</div>
