<?php
/**
 * Admin Mount Point — React prend le relais depuis #werocket-admin-root
 *
 * Le contenu du root est remplacé par React au montage. S'il reste affiché,
 * c'est que l'app n'a pas pu démarrer : on montre alors une erreur explicite
 * plutôt qu'une page blanche.
 */
defined('ABSPATH') || exit;

$werocket_assets_ok = \WeRocket\Tools\Admin\ViteAssets::is_entry_available('admin/main.tsx');
?>
<?php if (!$werocket_assets_ok) : ?>
  <div class="notice notice-error">
    <p><strong><?php esc_html_e('WeRocket Tools : les fichiers de l\'interface sont introuvables.', 'werocket-tools'); ?></strong></p>
    <p>
      <?php
      printf(
          /* translators: %s: path to the dist folder */
          esc_html__('Le dossier %s est absent ou incomplet sur le serveur (souvent après un transfert FTP ou une migration qui ignore certains fichiers). Réinstallez le plugin depuis le ZIP de la dernière release.', 'werocket-tools'),
          '<code>' . esc_html(WEROCKET_TOOLS_PLUGIN_DIR . 'dist/') . '</code>'
      );
      ?>
    </p>
  </div>
<?php else : ?>
  <style>
    @keyframes werocket-boot-reveal { to { visibility: visible; } }
    #werocket-admin-boot-error { visibility: hidden; animation: werocket-boot-reveal 0s 8s forwards; }
  </style>
<?php endif; ?>
<div
  id="werocket-admin-root"
  data-rest-url="<?php echo esc_attr(rest_url('werocket/v1/')); ?>"
  data-nonce="<?php echo esc_attr(wp_create_nonce('wp_rest')); ?>"
  data-plugin-url="<?php echo esc_attr(WEROCKET_TOOLS_PLUGIN_URL); ?>"
  data-version="<?php echo esc_attr(WEROCKET_TOOLS_VERSION); ?>"
  data-home-url="<?php echo esc_attr(home_url('/')); ?>"
  data-plugin-folder="<?php echo esc_attr(dirname(WEROCKET_TOOLS_PLUGIN_BASENAME)); ?>"
>
  <?php if ($werocket_assets_ok) : ?>
    <div id="werocket-admin-boot-error" class="notice notice-error">
      <p><strong><?php esc_html_e('L\'interface WeRocket Tools ne s\'est pas chargée.', 'werocket-tools'); ?></strong></p>
      <p><?php esc_html_e('Ouvrez la console du navigateur (F12) pour voir l\'erreur. Causes fréquentes : un plugin d\'optimisation ou de cache qui modifie les scripts (combinaison / minification JS), un CDN qui sert les fichiers du plugin depuis un autre domaine, ou une politique de sécurité (CSP) qui bloque les scripts.', 'werocket-tools'); ?></p>
    </div>
  <?php endif; ?>
</div>
<?php
/**
 * Données propres aux modules pour l'interface React (ex. menu d'origine pour
 * l'éditeur du module Général), ajoutées via le filtre werocket_tools_admin_data.
 */
?>
<script type="application/json" id="werocket-admin-data"><?php
  echo wp_json_encode((object) apply_filters('werocket_tools_admin_data', []), JSON_HEX_TAG | JSON_HEX_AMP);
?></script>
