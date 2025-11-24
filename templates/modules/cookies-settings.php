<?php
/**
 * Cookies Module Settings Template
 *
 * @var array $settings
 */

defined('ABSPATH') || exit;
?>

<form class="werocket-module-form" data-module="cookies">
    <div class="space-y-6">
        <!-- Banner Content -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Contenu du bandeau', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Titre', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[banner_title]" value="<?php echo esc_attr($settings['banner_title']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('URL politique de confidentialité', 'werocket-tools'); ?></label>
                    <input type="url" name="settings[privacy_policy_url]" value="<?php echo esc_url($settings['privacy_policy_url']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
            </div>

            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Message', 'werocket-tools'); ?></label>
                <textarea name="settings[banner_message]" rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"><?php echo esc_textarea($settings['banner_message']); ?></textarea>
            </div>
        </div>

        <!-- Buttons -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Boutons', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Bouton accepter', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[accept_button_text]" value="<?php echo esc_attr($settings['accept_button_text']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Bouton refuser', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[reject_button_text]" value="<?php echo esc_attr($settings['reject_button_text']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Bouton personnaliser', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[customize_button_text]" value="<?php echo esc_attr($settings['customize_button_text']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
            </div>
        </div>

        <!-- Appearance -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Apparence', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Position', 'werocket-tools'); ?></label>
                    <select name="settings[banner_position]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="bottom" <?php selected($settings['banner_position'], 'bottom'); ?>><?php esc_html_e('Bas', 'werocket-tools'); ?></option>
                        <option value="top" <?php selected($settings['banner_position'], 'top'); ?>><?php esc_html_e('Haut', 'werocket-tools'); ?></option>
                        <option value="center" <?php selected($settings['banner_position'], 'center'); ?>><?php esc_html_e('Centre (popup)', 'werocket-tools'); ?></option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Style', 'werocket-tools'); ?></label>
                    <select name="settings[banner_style]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="bar" <?php selected($settings['banner_style'], 'bar'); ?>><?php esc_html_e('Barre', 'werocket-tools'); ?></option>
                        <option value="box" <?php selected($settings['banner_style'], 'box'); ?>><?php esc_html_e('Boîte', 'werocket-tools'); ?></option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Couleur principale', 'werocket-tools'); ?></label>
                    <input type="color" name="settings[primary_color]" value="<?php echo esc_attr($settings['primary_color']); ?>"
                           class="w-full h-10 px-1 py-1 border border-gray-300 rounded-md shadow-sm">
                </div>
            </div>
        </div>

        <!-- Categories -->
        <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Catégories de cookies', 'werocket-tools'); ?></h3>

            <div class="space-y-4">
                <?php foreach ($settings['categories'] as $key => $category): ?>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="font-medium text-gray-900"><?php echo esc_html($category['label']); ?></span>
                            <?php if ($category['required']): ?>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <?php esc_html_e('Requis', 'werocket-tools'); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" name="settings[categories][<?php echo esc_attr($key); ?>][label]"
                                   value="<?php echo esc_attr($category['label']); ?>"
                                   placeholder="<?php esc_attr_e('Libellé', 'werocket-tools'); ?>"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                            <input type="text" name="settings[categories][<?php echo esc_attr($key); ?>][description]"
                                   value="<?php echo esc_attr($category['description']); ?>"
                                   placeholder="<?php esc_attr_e('Description', 'werocket-tools'); ?>"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                        </div>
                        <input type="hidden" name="settings[categories][<?php echo esc_attr($key); ?>][required]" value="<?php echo $category['required'] ? '1' : '0'; ?>">
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <div class="mt-6 flex justify-end">
        <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <?php esc_html_e('Enregistrer', 'werocket-tools'); ?>
        </button>
    </div>
</form>
