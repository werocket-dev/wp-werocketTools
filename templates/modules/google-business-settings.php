<?php
/**
 * Google Business Settings Template
 *
 * @var array $settings
 */

defined('ABSPATH') || exit;

$days = [
    'monday' => __('Lundi', 'werocket-tools'),
    'tuesday' => __('Mardi', 'werocket-tools'),
    'wednesday' => __('Mercredi', 'werocket-tools'),
    'thursday' => __('Jeudi', 'werocket-tools'),
    'friday' => __('Vendredi', 'werocket-tools'),
    'saturday' => __('Samedi', 'werocket-tools'),
    'sunday' => __('Dimanche', 'werocket-tools'),
];
?>

<form class="werocket-module-form" data-module="google_business">
    <div class="space-y-6">
        <!-- Business Information -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Informations de l\'entreprise', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Nom de l\'entreprise', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[business_name]" value="<?php echo esc_attr($settings['business_name']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Type d\'entreprise', 'werocket-tools'); ?></label>
                    <select name="settings[business_type]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="LocalBusiness" <?php selected($settings['business_type'], 'LocalBusiness'); ?>><?php esc_html_e('Commerce local', 'werocket-tools'); ?></option>
                        <option value="Restaurant" <?php selected($settings['business_type'], 'Restaurant'); ?>><?php esc_html_e('Restaurant', 'werocket-tools'); ?></option>
                        <option value="Store" <?php selected($settings['business_type'], 'Store'); ?>><?php esc_html_e('Magasin', 'werocket-tools'); ?></option>
                        <option value="ProfessionalService" <?php selected($settings['business_type'], 'ProfessionalService'); ?>><?php esc_html_e('Service professionnel', 'werocket-tools'); ?></option>
                        <option value="HealthAndBeautyBusiness" <?php selected($settings['business_type'], 'HealthAndBeautyBusiness'); ?>><?php esc_html_e('Santé & Beauté', 'werocket-tools'); ?></option>
                    </select>
                </div>
            </div>

            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Description', 'werocket-tools'); ?></label>
                <textarea name="settings[description]" rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"><?php echo esc_textarea($settings['description']); ?></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Téléphone', 'werocket-tools'); ?></label>
                    <input type="tel" name="settings[phone]" value="<?php echo esc_attr($settings['phone']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Email', 'werocket-tools'); ?></label>
                    <input type="email" name="settings[email]" value="<?php echo esc_attr($settings['email']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Site web', 'werocket-tools'); ?></label>
                    <input type="url" name="settings[website]" value="<?php echo esc_url($settings['website']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
            </div>
        </div>

        <!-- Address -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Adresse', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Rue', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[address][street]" value="<?php echo esc_attr($settings['address']['street']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Code postal', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[address][postal_code]" value="<?php echo esc_attr($settings['address']['postal_code']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Ville', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[address][city]" value="<?php echo esc_attr($settings['address']['city']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Latitude', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[coordinates][lat]" value="<?php echo esc_attr($settings['coordinates']['lat']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                           placeholder="48.8566">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Longitude', 'werocket-tools'); ?></label>
                    <input type="text" name="settings[coordinates][lng]" value="<?php echo esc_attr($settings['coordinates']['lng']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                           placeholder="2.3522">
                </div>
            </div>
        </div>

        <!-- Opening Hours -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Horaires d\'ouverture', 'werocket-tools'); ?></h3>

            <div class="space-y-3">
                <?php foreach ($days as $day_key => $day_label): ?>
                    <?php $hours = $settings['opening_hours'][$day_key] ?? ['open' => '', 'close' => '', 'closed' => false]; ?>
                    <div class="flex items-center gap-4">
                        <div class="w-28">
                            <span class="text-sm font-medium text-gray-700"><?php echo esc_html($day_label); ?></span>
                        </div>
                        <label class="inline-flex items-center">
                            <input type="checkbox" name="settings[opening_hours][<?php echo esc_attr($day_key); ?>][closed]" value="1"
                                   <?php checked(!empty($hours['closed'])); ?>
                                   class="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500 day-closed-toggle">
                            <span class="ml-2 text-sm text-gray-600"><?php esc_html_e('Fermé', 'werocket-tools'); ?></span>
                        </label>
                        <div class="flex items-center gap-2 day-hours <?php echo !empty($hours['closed']) ? 'opacity-50' : ''; ?>">
                            <input type="time" name="settings[opening_hours][<?php echo esc_attr($day_key); ?>][open]"
                                   value="<?php echo esc_attr($hours['open']); ?>"
                                   class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                   <?php echo !empty($hours['closed']) ? 'disabled' : ''; ?>>
                            <span class="text-gray-500">-</span>
                            <input type="time" name="settings[opening_hours][<?php echo esc_attr($day_key); ?>][close]"
                                   value="<?php echo esc_attr($hours['close']); ?>"
                                   class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                   <?php echo !empty($hours['closed']) ? 'disabled' : ''; ?>>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Social Links -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Réseaux sociaux', 'werocket-tools'); ?></h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                    <input type="url" name="settings[social_links][facebook]" value="<?php echo esc_url($settings['social_links']['facebook']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input type="url" name="settings[social_links][instagram]" value="<?php echo esc_url($settings['social_links']['instagram']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input type="url" name="settings[social_links][linkedin]" value="<?php echo esc_url($settings['social_links']['linkedin']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">X (Twitter)</label>
                    <input type="url" name="settings[social_links][twitter]" value="<?php echo esc_url($settings['social_links']['twitter']); ?>"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
            </div>
        </div>

        <!-- Options -->
        <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4"><?php esc_html_e('Options', 'werocket-tools'); ?></h3>

            <div class="space-y-4">
                <label class="inline-flex items-center">
                    <input type="checkbox" name="settings[enable_structured_data]" value="1" <?php checked($settings['enable_structured_data']); ?>
                           class="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500">
                    <span class="ml-2 text-sm text-gray-700"><?php esc_html_e('Activer les données structurées Schema.org', 'werocket-tools'); ?></span>
                </label>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"><?php esc_html_e('Clé API Google Maps', 'werocket-tools'); ?></label>
                    <input type="password" name="settings[google_maps_api_key]" value="<?php echo esc_attr($settings['google_maps_api_key']); ?>"
                           class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                    <p class="mt-1 text-xs text-gray-500"><?php esc_html_e('Nécessaire pour afficher la carte', 'werocket-tools'); ?></p>
                </div>
            </div>
        </div>

        <!-- Shortcodes Info -->
        <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 mb-2"><?php esc_html_e('Shortcodes disponibles', 'werocket-tools'); ?></h4>
            <div class="space-y-2">
                <div>
                    <code class="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm">[werocket_business_info]</code>
                    <span class="text-sm text-gray-600 ml-2"><?php esc_html_e('Affiche les informations de contact', 'werocket-tools'); ?></span>
                </div>
                <div>
                    <code class="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm">[werocket_business_hours]</code>
                    <span class="text-sm text-gray-600 ml-2"><?php esc_html_e('Affiche les horaires d\'ouverture', 'werocket-tools'); ?></span>
                </div>
                <div>
                    <code class="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm">[werocket_business_map]</code>
                    <span class="text-sm text-gray-600 ml-2"><?php esc_html_e('Affiche une carte Google Maps', 'werocket-tools'); ?></span>
                </div>
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
