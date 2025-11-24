<?php
/**
 * Dashboard Template
 *
 * @var array $modules
 * @var array $active_modules
 */

defined('ABSPATH') || exit;
?>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <?php foreach ($modules as $module): ?>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <?php echo $module->get_icon(); ?>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox"
                               class="sr-only peer module-toggle"
                               data-module="<?php echo esc_attr($module->get_id()); ?>"
                               <?php checked(!empty($active_modules[$module->get_id()])); ?>>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2"><?php echo esc_html($module->get_name()); ?></h3>
                <p class="text-gray-500 text-sm mb-4"><?php echo esc_html($module->get_description()); ?></p>
                <a href="<?php echo esc_url(admin_url('admin.php?page=werocket-tools&tab=' . $module->get_id())); ?>"
                   class="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500">
                    <?php esc_html_e('Configurer', 'werocket-tools'); ?>
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
            <div class="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <span class="inline-flex items-center text-xs <?php echo !empty($active_modules[$module->get_id()]) ? 'text-green-600' : 'text-gray-500'; ?>">
                    <span class="w-2 h-2 rounded-full mr-2 <?php echo !empty($active_modules[$module->get_id()]) ? 'bg-green-500' : 'bg-gray-400'; ?>"></span>
                    <?php echo !empty($active_modules[$module->get_id()]) ? esc_html__('Actif', 'werocket-tools') : esc_html__('Inactif', 'werocket-tools'); ?>
                </span>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<!-- Quick Stats -->
<div class="mt-8 bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4"><?php esc_html_e('Informations', 'werocket-tools'); ?></h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900"><?php echo count(array_filter($active_modules)); ?></p>
                <p class="text-sm text-gray-500"><?php esc_html_e('Modules actifs', 'werocket-tools'); ?></p>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900"><?php echo count($modules); ?></p>
                <p class="text-sm text-gray-500"><?php esc_html_e('Modules disponibles', 'werocket-tools'); ?></p>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">v<?php echo WEROCKET_TOOLS_VERSION; ?></p>
                <p class="text-sm text-gray-500"><?php esc_html_e('Version du plugin', 'werocket-tools'); ?></p>
            </div>
        </div>
    </div>
</div>
