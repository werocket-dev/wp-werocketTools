<?php
/**
 * Google Business Map Template
 *
 * @var array $settings
 */

defined('ABSPATH') || exit;

$has_coordinates = !empty($settings['coordinates']['lat']) && !empty($settings['coordinates']['lng']);
$has_api_key = !empty($settings['google_maps_api_key']);
?>

<div class="werocket-business-map">
    <?php if ($has_coordinates && $has_api_key): ?>
        <div id="werocket-map" class="werocket-business-map__container" style="height: 400px;"></div>

        <script>
            function initWeRocketMap() {
                const location = {
                    lat: <?php echo floatval($settings['coordinates']['lat']); ?>,
                    lng: <?php echo floatval($settings['coordinates']['lng']); ?>
                };

                const map = new google.maps.Map(document.getElementById('werocket-map'), {
                    zoom: 15,
                    center: location,
                    styles: [
                        {
                            "featureType": "all",
                            "elementType": "geometry.fill",
                            "stylers": [{"weight": "2.00"}]
                        }
                    ]
                });

                new google.maps.Marker({
                    position: location,
                    map: map,
                    title: '<?php echo esc_js($settings['business_name']); ?>'
                });
            }
        </script>
        <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=<?php echo esc_attr($settings['google_maps_api_key']); ?>&callback=initWeRocketMap">
        </script>
    <?php elseif ($has_coordinates): ?>
        <!-- Fallback: OpenStreetMap iframe -->
        <iframe
            class="werocket-business-map__iframe"
            width="100%"
            height="400"
            frameborder="0"
            scrolling="no"
            marginheight="0"
            marginwidth="0"
            src="https://www.openstreetmap.org/export/embed.html?bbox=<?php echo floatval($settings['coordinates']['lng']) - 0.01; ?>%2C<?php echo floatval($settings['coordinates']['lat']) - 0.01; ?>%2C<?php echo floatval($settings['coordinates']['lng']) + 0.01; ?>%2C<?php echo floatval($settings['coordinates']['lat']) + 0.01; ?>&layer=mapnik&marker=<?php echo floatval($settings['coordinates']['lat']); ?>%2C<?php echo floatval($settings['coordinates']['lng']); ?>">
        </iframe>
    <?php else: ?>
        <p class="werocket-business-map__notice"><?php esc_html_e('Veuillez configurer les coordonnées GPS dans les paramètres.', 'werocket-tools'); ?></p>
    <?php endif; ?>
</div>
