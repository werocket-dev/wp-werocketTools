<?php
/**
 * Google Business Hours Template
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

$today = strtolower(date('l'));
?>

<div class="werocket-business-hours">
    <h4 class="werocket-business-hours__title"><?php esc_html_e('Horaires d\'ouverture', 'werocket-tools'); ?></h4>

    <ul class="werocket-business-hours__list">
        <?php foreach ($days as $day_key => $day_label): ?>
            <?php
            $hours = $settings['opening_hours'][$day_key] ?? ['open' => '', 'close' => '', 'closed' => true];
            $is_today = ($day_key === $today);
            ?>
            <li class="werocket-business-hours__item <?php echo $is_today ? 'werocket-business-hours__item--today' : ''; ?>">
                <span class="werocket-business-hours__day">
                    <?php echo esc_html($day_label); ?>
                    <?php if ($is_today): ?>
                        <span class="werocket-business-hours__badge"><?php esc_html_e('Aujourd\'hui', 'werocket-tools'); ?></span>
                    <?php endif; ?>
                </span>
                <span class="werocket-business-hours__time">
                    <?php if (!empty($hours['closed'])): ?>
                        <span class="werocket-business-hours__closed"><?php esc_html_e('Fermé', 'werocket-tools'); ?></span>
                    <?php else: ?>
                        <?php echo esc_html($hours['open'] . ' - ' . $hours['close']); ?>
                    <?php endif; ?>
                </span>
            </li>
        <?php endforeach; ?>
    </ul>
</div>
