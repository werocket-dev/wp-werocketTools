<?php
/**
 * Cookies Banner Frontend Template
 *
 * @var array $settings
 */

defined('ABSPATH') || exit;
?>

<div id="werocket-cookie-banner" class="werocket-cookie-banner werocket-cookie-banner--<?php echo esc_attr($settings['banner_position']); ?> werocket-cookie-banner--<?php echo esc_attr($settings['banner_style']); ?>" style="display: none;">
    <div class="werocket-cookie-banner__container">
        <div class="werocket-cookie-banner__content">
            <h3 class="werocket-cookie-banner__title"><?php echo esc_html($settings['banner_title']); ?></h3>
            <p class="werocket-cookie-banner__message">
                <?php echo wp_kses_post($settings['banner_message']); ?>
                <?php if (!empty($settings['privacy_policy_url'])): ?>
                    <a href="<?php echo esc_url($settings['privacy_policy_url']); ?>" class="werocket-cookie-banner__link" target="_blank">
                        <?php esc_html_e('En savoir plus', 'werocket-tools'); ?>
                    </a>
                <?php endif; ?>
            </p>
        </div>
        <div class="werocket-cookie-banner__actions">
            <button type="button" class="werocket-cookie-btn werocket-cookie-btn--secondary" data-action="customize">
                <?php echo esc_html($settings['customize_button_text']); ?>
            </button>
            <button type="button" class="werocket-cookie-btn werocket-cookie-btn--outline" data-action="reject">
                <?php echo esc_html($settings['reject_button_text']); ?>
            </button>
            <button type="button" class="werocket-cookie-btn werocket-cookie-btn--primary" data-action="accept">
                <?php echo esc_html($settings['accept_button_text']); ?>
            </button>
        </div>
    </div>

    <!-- Customize Modal -->
    <div id="werocket-cookie-modal" class="werocket-cookie-modal" style="display: none;">
        <div class="werocket-cookie-modal__overlay"></div>
        <div class="werocket-cookie-modal__content">
            <div class="werocket-cookie-modal__header">
                <h3><?php esc_html_e('Personnaliser vos préférences', 'werocket-tools'); ?></h3>
                <button type="button" class="werocket-cookie-modal__close" data-action="close-modal">&times;</button>
            </div>
            <div class="werocket-cookie-modal__body">
                <?php foreach ($settings['categories'] as $key => $category): ?>
                    <div class="werocket-cookie-category">
                        <div class="werocket-cookie-category__header">
                            <label class="werocket-cookie-category__label">
                                <input type="checkbox"
                                       name="cookie_category_<?php echo esc_attr($key); ?>"
                                       value="<?php echo esc_attr($key); ?>"
                                       <?php checked($category['required']); ?>
                                       <?php disabled($category['required']); ?>>
                                <span><?php echo esc_html($category['label']); ?></span>
                            </label>
                            <?php if ($category['required']): ?>
                                <span class="werocket-cookie-category__badge"><?php esc_html_e('Requis', 'werocket-tools'); ?></span>
                            <?php endif; ?>
                        </div>
                        <p class="werocket-cookie-category__description"><?php echo esc_html($category['description']); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="werocket-cookie-modal__footer">
                <button type="button" class="werocket-cookie-btn werocket-cookie-btn--outline" data-action="reject">
                    <?php esc_html_e('Tout refuser', 'werocket-tools'); ?>
                </button>
                <button type="button" class="werocket-cookie-btn werocket-cookie-btn--primary" data-action="save-preferences">
                    <?php esc_html_e('Enregistrer mes préférences', 'werocket-tools'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    :root {
        --werocket-primary: <?php echo esc_attr($settings['primary_color']); ?>;
    }
</style>
