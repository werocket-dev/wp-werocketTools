<?php
/**
 * Admin Mount Point — React prend le relais depuis #werocket-admin-root
 */
defined('ABSPATH') || exit;
?>
<div
  id="werocket-admin-root"
  data-rest-url="<?php echo esc_attr(rest_url('werocket/v1/')); ?>"
  data-nonce="<?php echo esc_attr(wp_create_nonce('wp_rest')); ?>"
  data-plugin-url="<?php echo esc_attr(WEROCKET_TOOLS_PLUGIN_URL); ?>"
  data-version="<?php echo esc_attr(WEROCKET_TOOLS_VERSION); ?>"
></div>
