<?php
/**
 * Google Reviews Display Template
 *
 * @var array $settings
 * @var array $reviews
 * @var array $atts
 */

defined('ABSPATH') || exit;

$display_style = $atts['style'] ?? $settings['display_style'];
$count = $atts['count'] ?? $settings['reviews_count'];
$reviews = array_slice($reviews, 0, $count);
?>

<div class="werocket-reviews werocket-reviews--<?php echo esc_attr($display_style); ?>">
    <?php if (empty($reviews)): ?>
        <p class="werocket-reviews__empty"><?php esc_html_e('Aucun avis disponible pour le moment.', 'werocket-tools'); ?></p>
    <?php else: ?>
        <div class="werocket-reviews__grid">
            <?php foreach ($reviews as $review): ?>
                <?php if ($review['rating'] >= $settings['min_rating']): ?>
                    <div class="werocket-review">
                        <?php if ($settings['show_avatar'] && !empty($review['profile_photo_url'])): ?>
                            <div class="werocket-review__avatar">
                                <img src="<?php echo esc_url($review['profile_photo_url']); ?>" alt="<?php echo esc_attr($review['author_name']); ?>">
                            </div>
                        <?php endif; ?>

                        <div class="werocket-review__content">
                            <div class="werocket-review__header">
                                <span class="werocket-review__author"><?php echo esc_html($review['author_name']); ?></span>
                                <?php if ($settings['show_date'] && !empty($review['relative_time_description'])): ?>
                                    <span class="werocket-review__date"><?php echo esc_html($review['relative_time_description']); ?></span>
                                <?php endif; ?>
                            </div>

                            <?php if ($settings['show_rating']): ?>
                                <div class="werocket-review__rating">
                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                        <span class="werocket-review__star <?php echo $i <= $review['rating'] ? 'werocket-review__star--filled' : ''; ?>">★</span>
                                    <?php endfor; ?>
                                </div>
                            <?php endif; ?>

                            <p class="werocket-review__text"><?php echo esc_html($review['text']); ?></p>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>
