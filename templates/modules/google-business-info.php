<?php
/**
 * Google Business Info Template
 *
 * @var array $settings
 */

defined('ABSPATH') || exit;
?>

<div class="werocket-business-info">
    <?php if (!empty($settings['business_name'])): ?>
        <h3 class="werocket-business-info__name"><?php echo esc_html($settings['business_name']); ?></h3>
    <?php endif; ?>

    <?php if (!empty($settings['description'])): ?>
        <p class="werocket-business-info__description"><?php echo esc_html($settings['description']); ?></p>
    <?php endif; ?>

    <ul class="werocket-business-info__list">
        <?php if (!empty($settings['address']['street'])): ?>
            <li class="werocket-business-info__item werocket-business-info__item--address">
                <svg class="werocket-business-info__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>
                    <?php echo esc_html($settings['address']['street']); ?><br>
                    <?php echo esc_html($settings['address']['postal_code'] . ' ' . $settings['address']['city']); ?>
                </span>
            </li>
        <?php endif; ?>

        <?php if (!empty($settings['phone'])): ?>
            <li class="werocket-business-info__item werocket-business-info__item--phone">
                <svg class="werocket-business-info__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <a href="tel:<?php echo esc_attr($settings['phone']); ?>"><?php echo esc_html($settings['phone']); ?></a>
            </li>
        <?php endif; ?>

        <?php if (!empty($settings['email'])): ?>
            <li class="werocket-business-info__item werocket-business-info__item--email">
                <svg class="werocket-business-info__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <a href="mailto:<?php echo esc_attr($settings['email']); ?>"><?php echo esc_html($settings['email']); ?></a>
            </li>
        <?php endif; ?>

        <?php if (!empty($settings['website'])): ?>
            <li class="werocket-business-info__item werocket-business-info__item--website">
                <svg class="werocket-business-info__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
                <a href="<?php echo esc_url($settings['website']); ?>" target="_blank"><?php echo esc_html($settings['website']); ?></a>
            </li>
        <?php endif; ?>
    </ul>

    <?php if (!empty(array_filter($settings['social_links']))): ?>
        <div class="werocket-business-info__social">
            <?php foreach ($settings['social_links'] as $network => $url): ?>
                <?php if (!empty($url)): ?>
                    <a href="<?php echo esc_url($url); ?>" class="werocket-business-info__social-link werocket-business-info__social-link--<?php echo esc_attr($network); ?>" target="_blank" rel="noopener">
                        <?php echo esc_html(ucfirst($network)); ?>
                    </a>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>
