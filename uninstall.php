<?php
/**
 * WeRocket Tools — uninstall.
 *
 * POLITIQUE DE PERSISTANCE :
 * Les paramètres de configuration des modules sont volontairement PRÉSERVÉS
 * lors de la suppression du plugin. En cas de réinstallation, l'ensemble
 * des réglages (lieux de retrait, horaires, couleurs, etc.) sera restauré
 * automatiquement.
 *
 * Options conservées (table wp_options) :
 *   - werocket_tools_options              (modules actifs)
 *   - werocket_cookies_settings           (bandeau cookies)
 *   - werocket_google_reviews_settings    (avis Google)
 *   - werocket_retractation_settings      (formulaire rétractation)
 *   - werocket_click_collect_settings     (clic & collect)
 *
 * Données conservées :
 *   - Table {prefix}wr_retractation_requests (traçabilité légale)
 *   - Méta-commandes WooCommerce (_wr_cc_*, _wr_retractation_id, etc.)
 *
 * Données nettoyées (transients éphémères, non critiques) :
 *   - Caches d'avis Google (regénérés à la première requête)
 *   - États de session PRG du module Rétractation
 *
 * Pour purger entièrement les données, l'utilisateur peut désinstaller
 * le plugin puis exécuter manuellement :
 *   DELETE FROM wp_options WHERE option_name LIKE 'werocket_%';
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

// Nettoyage des transients éphémères uniquement (caches, sessions).
// Ces données ont vocation à être régénérées et ne contiennent aucun réglage.
$wpdb->query(
    "DELETE FROM {$wpdb->options}
     WHERE option_name LIKE '\\_transient\\_wr\\_%'
        OR option_name LIKE '\\_transient\\_timeout\\_wr\\_%'
        OR option_name LIKE '\\_transient\\_werocket\\_%'
        OR option_name LIKE '\\_transient\\_timeout\\_werocket\\_%'"
);
