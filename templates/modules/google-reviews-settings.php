<?php
/**
 * Google Reviews Settings Template
 *
 * @var array $settings
 */

defined('ABSPATH') || exit;
?>

<form class="werocket-module-form" data-module="google_reviews">
    <div class="space-y-6">
        <!-- API Configuration -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Configuration API', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Place ID Google', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[google_place_id]" value="<?php echo esc_attr($settings['google_place_id']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                           placeholder="ChIJ...">
                    <p class="mt-1 text-xs text-gray-500"><?php esc_html_e('Trouvez votre Place ID sur Google Maps', 'werocket-tools'); ?></p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Clé API Google', 'werocket-tools'); ?></label>
                    <input type="password" name="settings[google_api_key]" value="<?php echo esc_attr($settings['google_api_key']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                    <p class="mt-1 text-xs text-gray-500"><?php esc_html_e('API Places activée requise', 'werocket-tools'); ?></p>
                </div>
            </div>
        </div>

        <!-- Display Options -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Options d\'affichage', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Style d\'affichage', 'werocket-tools'); ?></label>
                    <select name="settings[display_style]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="grid" <?php selected($settings['display_style'], 'grid'); ?>><?php esc_html_e('Grille', 'werocket-tools'); ?></option>
                        <option value="carousel" <?php selected($settings['display_style'], 'carousel'); ?>><?php esc_html_e('Carrousel', 'werocket-tools'); ?></option>
                        <option value="list" <?php selected($settings['display_style'], 'list'); ?>><?php esc_html_e('Liste', 'werocket-tools'); ?></option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Nombre d\'avis', 'werocket-tools'); ?></label>
                    <input type="number" name="settings[reviews_count]" value="<?php echo esc_attr($settings['reviews_count']); ?>"
                           min="1" max="10"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Note minimum', 'werocket-tools'); ?></label>
                    <select name="settings[min_rating]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <option value="<?php echo $i; ?>" <?php selected($settings['min_rating'], $i); ?>>
                                <?php echo str_repeat('★', $i) . str_repeat('☆', 5 - $i); ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-6">
                <label class="inline-flex items-center">
                    <input type="checkbox" name="settings[show_rating]" value="1" <?php checked($settings['show_rating']); ?>
                           class="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500">
                    <span class="ml-2 text-sm text-gray-700"><?php esc_html_e('Afficher la note', 'werocket-tools'); ?></span>
                </label>
                <label class="inline-flex items-center">
                    <input type="checkbox" name="settings[show_date]" value="1" <?php checked($settings['show_date']); ?>
                           class="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500">
                    <span class="ml-2 text-sm text-gray-700"><?php esc_html_e('Afficher la date', 'werocket-tools'); ?></span>
                </label>
                <label class="inline-flex items-center">
                    <input type="checkbox" name="settings[show_avatar]" value="1" <?php checked($settings['show_avatar']); ?>
                           class="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500">
                    <span class="ml-2 text-sm text-gray-700"><?php esc_html_e('Afficher l\'avatar', 'werocket-tools'); ?></span>
                </label>
            </div>
        </div>

        <!-- Cache -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Cache', 'werocket-tools'); ?></h3>

            <div class="max-w-xs">
                <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Durée du cache (secondes)', 'werocket-tools'); ?></label>
                <input type="number" name="settings[cache_duration]" value="<?php echo esc_attr($settings['cache_duration']); ?>"
                       min="60"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                <p class="mt-1 text-xs text-gray-500"><?php esc_html_e('3600 = 1 heure, 86400 = 1 jour', 'werocket-tools'); ?></p>
            </div>
        </div>

        <!-- Shortcode Info -->
        <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 mb-2"><?php esc_html_e('Utilisation', 'werocket-tools'); ?></h4>
            <p class="text-sm text-gray-600 mb-2"><?php esc_html_e('Utilisez le shortcode suivant pour afficher les avis :', 'werocket-tools'); ?></p>
            <code class="block bg-gray-800 text-green-400 px-3 py-2 rounded text-sm">[werocket_reviews]</code>
            <p class="text-xs text-gray-500 mt-2"><?php esc_html_e('Options : count="5" style="grid"', 'werocket-tools'); ?></p>
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
