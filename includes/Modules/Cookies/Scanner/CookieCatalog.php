<?php
/**
 * Cookie Catalog
 *
 * Registry of known third-party services and the cookies / storage keys they set.
 * Used by the scanner to auto-classify detected cookies into a purpose
 * (necessary / analytics / marketing / preferences) and link them to a service.
 *
 * Pattern syntax:
 *   - plain string   → exact match (case-sensitive by default)
 *   - "_ga_*"        → wildcard, * matches any sequence of chars
 *   - "/^regex$/"    → raw regex (must start and end with /)
 */

namespace WeRocket\Tools\Modules\Cookies\Scanner;

class CookieCatalog {

    public const PURPOSE_NECESSARY   = 'necessary';
    public const PURPOSE_ANALYTICS   = 'analytics';
    public const PURPOSE_MARKETING   = 'marketing';
    public const PURPOSE_PREFERENCES = 'preferences';

    /**
     * Compiled lookup: regex → service_id. Built lazily on first match() call.
     * @var array<string, string>|null
     */
    private static ?array $compiled = null;

    /**
     * Return the full catalog.
     *
     * @return array<string, array{
     *     title: string,
     *     provider: string,
     *     purpose: string,
     *     description: string,
     *     cookies: string[],
     *     storage?: string[],
     *     required?: bool,
     *     domains?: string[],
     * }>
     */
    public static function all(): array {
        return [
            // ──────────────────────────────────────────────────────────
            // ANALYTICS
            // ──────────────────────────────────────────────────────────
            'google-analytics' => [
                'title'       => 'Google Analytics',
                'provider'    => 'Google LLC',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => "Service d'analyse de trafic fourni par Google (GA4 et Universal Analytics).",
                'cookies'     => ['_ga', '_ga_*', '_gid', '_gat', '_gat_*', '__utma', '__utmb', '__utmc', '__utmz', '__utmv', '__utmt'],
                'domains'     => ['google-analytics.com', 'analytics.google.com'],
            ],
            'google-tag-manager' => [
                'title'       => 'Google Tag Manager',
                'provider'    => 'Google LLC',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => 'Gestionnaire de balises Google pour le suivi et la conversion.',
                'cookies'     => ['_gcl_au', '_gcl_aw', '_gcl_dc', '_gcl_gb', '_gcl_gf', '_gcl_ha', '_gac_*'],
                'domains'     => ['googletagmanager.com'],
            ],
            'microsoft-clarity' => [
                'title'       => 'Microsoft Clarity',
                'provider'    => 'Microsoft Corporation',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => "Outil d'analyse comportementale (heatmaps, session replay) de Microsoft.",
                'cookies'     => ['_clck', '_clsk', 'CLID', 'ANONCHK', 'MR', 'MUID', 'SM'],
                'domains'     => ['clarity.ms'],
            ],
            'hotjar' => [
                'title'       => 'Hotjar',
                'provider'    => 'Hotjar Ltd.',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => 'Outil de heatmaps, enregistrements de session et feedback utilisateur.',
                'cookies'     => ['_hjSessionUser_*', '_hjSession_*', '_hjid', '_hjAbsoluteSessionInProgress', '_hjFirstSeen', '_hjIncludedInSessionSample_*', '_hjIncludedInPageviewSample', '_hjTLDTest', '_hjUserAttributesHash', '_hjCachedUserAttributes', '_hjLocalStorageTest', '_hjSessionTooLarge', '_hjSessionRejected', '_hjCookieTest', '_hjViewportId'],
                'domains'     => ['hotjar.com'],
            ],
            'matomo' => [
                'title'       => 'Matomo',
                'provider'    => 'InnoCraft Ltd.',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => 'Plateforme open-source d\'analyse de trafic (auto-hébergée ou cloud).',
                'cookies'     => ['_pk_id*', '_pk_ref*', '_pk_ses*', '_pk_cvar*', '_pk_hsr*', 'MATOMO_SESSID', 'piwik_*'],
            ],
            'mixpanel' => [
                'title'       => 'Mixpanel',
                'provider'    => 'Mixpanel Inc.',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => "Plateforme d'analyse produit et de suivi d'événements utilisateur.",
                'cookies'     => ['mp_*'],
                'storage'     => ['mp_*'],
                'domains'     => ['mixpanel.com'],
            ],
            'amplitude' => [
                'title'       => 'Amplitude',
                'provider'    => 'Amplitude Inc.',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => "Plateforme d'analyse comportementale et de parcours utilisateur.",
                'cookies'     => ['amplitude_*', 'AMP_*'],
                'storage'     => ['amplitude_*'],
                'domains'     => ['amplitude.com'],
            ],
            'heap' => [
                'title'       => 'Heap Analytics',
                'provider'    => 'Heap Inc.',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => "Plateforme d'analyse automatique d'événements utilisateur.",
                'cookies'     => ['_hp2_id*', '_hp2_ses_props*', '_hp2_props*'],
                'domains'     => ['heap.io', 'heapanalytics.com'],
            ],
            'segment' => [
                'title'       => 'Segment',
                'provider'    => 'Twilio Inc.',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => 'Plateforme de collecte et de routage de données analytiques.',
                'cookies'     => ['ajs_anonymous_id', 'ajs_user_id', 'ajs_group_id'],
                'domains'     => ['segment.com', 'segment.io'],
            ],
            'plausible' => [
                'title'       => 'Plausible Analytics',
                'provider'    => 'Plausible Insights OÜ',
                'purpose'     => self::PURPOSE_ANALYTICS,
                'description' => 'Outil d\'analyse de trafic sans cookies (rare exception : aucun cookie posé).',
                'cookies'     => [],
                'domains'     => ['plausible.io'],
            ],

            // ──────────────────────────────────────────────────────────
            // MARKETING / ADS
            // ──────────────────────────────────────────────────────────
            'google-ads' => [
                'title'       => 'Google Ads',
                'provider'    => 'Google LLC',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Service publicitaire et de remarketing Google (Doubleclick).',
                'cookies'     => ['IDE', 'DSID', 'FLC', 'AID', 'TAID', 'NID', 'ANID', '__gads', '__gpi', '__gsas'],
                'domains'     => ['doubleclick.net', 'googleadservices.com', 'googlesyndication.com'],
            ],
            'facebook-pixel' => [
                'title'       => 'Meta Pixel (Facebook)',
                'provider'    => 'Meta Platforms, Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Pixel de suivi Meta/Facebook pour le remarketing et les conversions.',
                'cookies'     => ['_fbp', '_fbc', 'fr', 'tr', 'xs', 'c_user', 'datr', 'sb', 'wd', 'spin'],
                'domains'     => ['facebook.com', 'facebook.net'],
            ],
            'tiktok-pixel' => [
                'title'       => 'TikTok Pixel',
                'provider'    => 'ByteDance Ltd.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Pixel de suivi TikTok pour les conversions publicitaires.',
                'cookies'     => ['_ttp', 'tt_appInfo', 'tt_pixel_session_index', 'tt_sessionId'],
                'domains'     => ['tiktok.com', 'tiktokcdn.com'],
            ],
            'linkedin-insight' => [
                'title'       => 'LinkedIn Insight Tag',
                'provider'    => 'LinkedIn Corporation',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Tag de suivi LinkedIn pour les conversions et le ciblage publicitaire.',
                'cookies'     => ['li_sugr', 'bcookie', 'bscookie', 'lidc', 'UserMatchHistory', 'AnalyticsSyncHistory', 'li_gc', 'lang'],
                'domains'     => ['linkedin.com', 'licdn.com'],
            ],
            'pinterest-tag' => [
                'title'       => 'Pinterest Tag',
                'provider'    => 'Pinterest Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Tag de conversion Pinterest pour le suivi publicitaire.',
                'cookies'     => ['_pinterest_ct_ua', '_pinterest_sess', '_pin_unauth', '_routing_id'],
                'domains'     => ['pinterest.com'],
            ],
            'twitter-pixel' => [
                'title'       => 'X / Twitter Ads',
                'provider'    => 'X Corp.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Pixel publicitaire X/Twitter pour le suivi des conversions.',
                'cookies'     => ['personalization_id', 'guest_id', 'muc_ads', 'guest_id_ads', 'guest_id_marketing'],
                'domains'     => ['twitter.com', 'x.com', 't.co'],
            ],
            'reddit-pixel' => [
                'title'       => 'Reddit Pixel',
                'provider'    => 'Reddit Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Pixel publicitaire Reddit pour le suivi des conversions.',
                'cookies'     => ['_rdt_uuid'],
                'domains'     => ['reddit.com', 'redditstatic.com'],
            ],
            'snapchat-pixel' => [
                'title'       => 'Snapchat Pixel',
                'provider'    => 'Snap Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Pixel publicitaire Snapchat pour le suivi des conversions.',
                'cookies'     => ['_scid', 'sc_at', 'X-CSRFToken'],
                'domains'     => ['snapchat.com', 'sc-static.net'],
            ],
            'bing-uet' => [
                'title'       => 'Microsoft Bing Ads (UET)',
                'provider'    => 'Microsoft Corporation',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Tag de suivi universel des événements Bing/Microsoft Advertising.',
                'cookies'     => ['_uetsid', '_uetvid', '_uetmsclkid'],
                'domains'     => ['bat.bing.com', 'clarity.ms'],
            ],
            'outbrain' => [
                'title'       => 'Outbrain',
                'provider'    => 'Outbrain Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme de recommandation et publicité native.',
                'cookies'     => ['obuid', 'apnxs', 'criteo'],
                'domains'     => ['outbrain.com'],
            ],
            'taboola' => [
                'title'       => 'Taboola',
                'provider'    => 'Taboola, Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme de recommandation et publicité native.',
                'cookies'     => ['t_gid', 'taboola_session_id', 'taboola_pv', 'taboola_xhr'],
                'domains'     => ['taboola.com'],
            ],
            'criteo' => [
                'title'       => 'Criteo',
                'provider'    => 'Criteo SA',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme de retargeting publicitaire.',
                'cookies'     => ['uid', 'optout'],
                'domains'     => ['criteo.com', 'criteo.net'],
            ],

            // ──────────────────────────────────────────────────────────
            // MARKETING — Video embeds
            // ──────────────────────────────────────────────────────────
            'youtube' => [
                'title'       => 'YouTube',
                'provider'    => 'Google LLC',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Intégration de vidéos YouTube (peut poser des cookies publicitaires).',
                'cookies'     => ['VISITOR_INFO1_LIVE', 'YSC', 'PREF', '__Secure-YEC', '__Secure-3PSID', '__Secure-3PAPISID', '__Secure-3PSIDCC', 'LOGIN_INFO', 'wide', 'SOCS', 'VISITOR_PRIVACY_METADATA'],
                'domains'     => ['youtube.com', 'youtube-nocookie.com', 'ytimg.com'],
            ],
            'vimeo' => [
                'title'       => 'Vimeo',
                'provider'    => 'Vimeo, Inc.',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Intégration de vidéos Vimeo.',
                'cookies'     => ['vuid', '_abexps', 'player', 'continuous_play_v3', 'sd_client_id'],
                'domains'     => ['vimeo.com'],
            ],
            'wistia' => [
                'title'       => 'Wistia',
                'provider'    => 'Wistia, Inc.',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Intégration de vidéos Wistia.',
                'cookies'     => ['wistia', 'wistia-video-progress-*'],
                'storage'     => ['wistia-*'],
                'domains'     => ['wistia.com', 'wistia.net'],
            ],

            // ──────────────────────────────────────────────────────────
            // PREFERENCES — Customer support / chat
            // ──────────────────────────────────────────────────────────
            'intercom' => [
                'title'       => 'Intercom',
                'provider'    => 'Intercom, Inc.',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Plateforme de support client et messagerie in-app.',
                'cookies'     => ['intercom-id-*', 'intercom-session-*', 'intercom-device-id-*'],
                'domains'     => ['intercom.io', 'intercomcdn.com'],
            ],
            'crisp' => [
                'title'       => 'Crisp Chat',
                'provider'    => 'Crisp IM SAS',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Messagerie de support client en direct.',
                'cookies'     => ['crisp-client*'],
                'storage'     => ['crisp-client/*'],
                'domains'     => ['crisp.chat'],
            ],
            'tawk-to' => [
                'title'       => 'Tawk.to',
                'provider'    => 'tawk.to LLC',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Messagerie de support client en direct.',
                'cookies'     => ['__tawkuuid', 'tawkUUID', 'TawkConnectionTime', 'ss_*'],
                'domains'     => ['tawk.to'],
            ],
            'drift' => [
                'title'       => 'Drift',
                'provider'    => 'Drift.com, Inc.',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Plateforme de chat conversationnel et marketing.',
                'cookies'     => ['drift_aid', 'drift_session_*', 'driftt_aid', 'driftt_sid'],
                'domains'     => ['drift.com'],
            ],
            'zendesk' => [
                'title'       => 'Zendesk',
                'provider'    => 'Zendesk, Inc.',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Plateforme de support client (chat, helpdesk).',
                'cookies'     => ['_zendesk_*', '__zlcmid', '_zendesk_session', '_zendesk_authenticated', '_zendesk_shared_session'],
                'domains'     => ['zendesk.com', 'zdassets.com'],
            ],
            'hubspot' => [
                'title'       => 'HubSpot',
                'provider'    => 'HubSpot, Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme CRM, marketing automation et chat.',
                'cookies'     => ['__hstc', '__hssc', '__hssrc', 'hubspotutk', '__hs_initial_opt_in', '__hs_opt_out', '__hs_do_not_track', '__hs_cookie_cat_pref', 'messagesUtk'],
                'domains'     => ['hubspot.com', 'hs-scripts.com', 'hs-analytics.net'],
            ],

            // ──────────────────────────────────────────────────────────
            // MARKETING / CRM
            // ──────────────────────────────────────────────────────────
            'mailchimp' => [
                'title'       => 'Mailchimp',
                'provider'    => 'Intuit Mailchimp',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme d\'email marketing et automation.',
                'cookies'     => ['_mcid', 'mc_user_id', 'mc_*'],
                'domains'     => ['mailchimp.com', 'list-manage.com'],
            ],
            'klaviyo' => [
                'title'       => 'Klaviyo',
                'provider'    => 'Klaviyo, Inc.',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme d\'email et SMS marketing.',
                'cookies'     => ['__kla_id', '_kuid_'],
                'storage'     => ['__kla_*'],
                'domains'     => ['klaviyo.com'],
            ],
            'activecampaign' => [
                'title'       => 'ActiveCampaign',
                'provider'    => 'ActiveCampaign, LLC',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme d\'automation marketing et CRM.',
                'cookies'     => ['ac_enable_tracking', 'visitor_*'],
                'domains'     => ['activehosted.com'],
            ],
            'convertkit' => [
                'title'       => 'ConvertKit / Kit',
                'provider'    => 'ConvertKit LLC',
                'purpose'     => self::PURPOSE_MARKETING,
                'description' => 'Plateforme d\'email marketing pour créateurs.',
                'cookies'     => ['ck_subscriber_id', 'ck_*'],
                'domains'     => ['convertkit.com', 'kit.com'],
            ],

            // ──────────────────────────────────────────────────────────
            // PREFERENCES / NECESSARY — Forms, scheduling, search
            // ──────────────────────────────────────────────────────────
            'calendly' => [
                'title'       => 'Calendly',
                'provider'    => 'Calendly LLC',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Outil de prise de rendez-vous intégré.',
                'cookies'     => ['_calendly_session', '_gid', '_ga'],
                'domains'     => ['calendly.com'],
            ],
            'typeform' => [
                'title'       => 'Typeform',
                'provider'    => 'Typeform S.L.',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Formulaires et enquêtes conversationnels.',
                'cookies'     => ['etfp', 'tfa_*'],
                'domains'     => ['typeform.com'],
            ],
            'algolia' => [
                'title'       => 'Algolia Search',
                'provider'    => 'Algolia, Inc.',
                'purpose'     => self::PURPOSE_PREFERENCES,
                'description' => 'Moteur de recherche hébergé pour le site.',
                'cookies'     => ['_ALGOLIA'],
                'domains'     => ['algolia.net', 'algolianet.com'],
            ],

            // ──────────────────────────────────────────────────────────
            // NECESSARY — Infrastructure / security / payments
            // ──────────────────────────────────────────────────────────
            'cloudflare' => [
                'title'       => 'Cloudflare',
                'provider'    => 'Cloudflare, Inc.',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => "Cookies de sécurité et anti-bot posés par le CDN/WAF Cloudflare. Strictement nécessaires.",
                'cookies'     => ['__cf_bm', 'cf_clearance', '__cfduid', '_cfuvid', '_cfwaitingroom', '__cflb'],
                'required'    => true,
                'domains'     => ['cloudflare.com'],
            ],
            'recaptcha' => [
                'title'       => 'Google reCAPTCHA',
                'provider'    => 'Google LLC',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Protection anti-spam des formulaires. Considéré nécessaire pour la sécurité.',
                'cookies'     => ['_GRECAPTCHA', 'NID'],
                'required'    => true,
                'domains'     => ['recaptcha.net', 'gstatic.com'],
            ],
            'stripe' => [
                'title'       => 'Stripe',
                'provider'    => 'Stripe, Inc.',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Cookies posés par Stripe pour la prévention de la fraude et le traitement des paiements.',
                'cookies'     => ['__stripe_mid', '__stripe_sid', 'm'],
                'required'    => true,
                'domains'     => ['stripe.com', 'stripe.network'],
            ],
            'paypal' => [
                'title'       => 'PayPal',
                'provider'    => 'PayPal Holdings, Inc.',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Cookies posés par PayPal pour le traitement des paiements et la prévention de la fraude.',
                'cookies'     => ['paypal', 'LANG', 'tsrce', 'cookie_check', 'enforce_policy', 'nsid', 'ts', 'ts_c', 'x-pp-s', 'l7_az', 'ts_*'],
                'required'    => true,
                'domains'     => ['paypal.com', 'paypalobjects.com'],
            ],
            'sentry' => [
                'title'       => 'Sentry',
                'provider'    => 'Functional Software, Inc.',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Suivi des erreurs JavaScript pour la maintenance du site.',
                'cookies'     => ['sentry-sid', 'sentrysid'],
                'domains'     => ['sentry.io'],
            ],

            // ──────────────────────────────────────────────────────────
            // NECESSARY — WordPress / WooCommerce core
            // ──────────────────────────────────────────────────────────
            'wordpress-core' => [
                'title'       => 'WordPress',
                'provider'    => 'WordPress',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Cookies essentiels posés par WordPress (authentification, sessions, préférences admin).',
                'cookies'     => ['wordpress_*', 'wp-settings-*', 'wp-settings-time-*', 'wordpress_logged_in_*', 'wordpress_test_cookie', 'wordpress_sec_*', 'comment_author_*', 'comment_author_email_*', 'comment_author_url_*', 'wp_lang'],
                'required'    => true,
            ],
            'woocommerce' => [
                'title'       => 'WooCommerce',
                'provider'    => 'Automattic Inc.',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Cookies de panier, session client et préférences WooCommerce. Strictement nécessaires.',
                'cookies'     => ['woocommerce_*', 'wp_woocommerce_session_*', 'wc_cart_*', 'wc_fragments_*', 'tk_ai', 'tk_lr', 'tk_or', 'tk_r3d'],
                'required'    => true,
            ],
            'wp-rocket' => [
                'title'       => 'WP Rocket',
                'provider'    => 'WP Media',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Cookies techniques de cache du plugin WP Rocket.',
                'cookies'     => ['wpr-cache-*', 'wpr_rocket_*'],
                'required'    => true,
            ],
            'elementor' => [
                'title'       => 'Elementor',
                'provider'    => 'Elementor Ltd.',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Cookies techniques du constructeur Elementor (édition / preview).',
                'cookies'     => ['elementor', 'elementor_preview'],
                'storage'     => ['elementor-*'],
            ],

            // ──────────────────────────────────────────────────────────
            // Consent managers (necessary by definition)
            // ──────────────────────────────────────────────────────────
            'werocket-consent' => [
                'title'       => 'WeRocket Consent',
                'provider'    => 'WeRocket Tools',
                'purpose'     => self::PURPOSE_NECESSARY,
                'description' => 'Cookie stockant le choix de consentement du visiteur (ce plugin).',
                'cookies'     => ['werocket_consent', 'klaro'],
                'required'    => true,
            ],
        ];
    }

    /**
     * Try to match a cookie name against the catalog.
     *
     * @return array{
     *     service_id: string,
     *     title: string,
     *     provider: string,
     *     purpose: string,
     *     description: string,
     *     required: bool,
     *     matched_pattern: string,
     * }|null  Null if no match.
     */
    public static function match(string $cookie_name): ?array {
        $cookie_name = trim($cookie_name);
        if ($cookie_name === '') return null;

        foreach (self::all() as $service_id => $service) {
            foreach ($service['cookies'] ?? [] as $pattern) {
                if (self::pattern_matches($pattern, $cookie_name)) {
                    return self::build_match($service_id, $service, $pattern);
                }
            }
        }

        return null;
    }

    /**
     * Forme canonique d'un résultat de match, partagée par les trois entrées
     * (nom de cookie, clé de storage, domaine tiers).
     *
     * @param array<string,mixed> $service
     * @return array<string,mixed>
     */
    private static function build_match(string $service_id, array $service, string $matched_pattern): array {
        return [
            'service_id'      => $service_id,
            'title'           => $service['title'],
            'provider'        => $service['provider'],
            'purpose'         => $service['purpose'],
            'description'     => $service['description'],
            'required'        => !empty($service['required']),
            'matched_pattern' => $matched_pattern,
        ];
    }

    /**
     * Match a storage key (localStorage / sessionStorage) against the catalog.
     * Storage signatures are kept separate from cookies because some services
     * skip cookies and use storage exclusively.
     */
    public static function match_storage_key(string $key): ?array {
        $key = trim($key);
        if ($key === '') return null;

        foreach (self::all() as $service_id => $service) {
            $patterns = array_merge($service['storage'] ?? [], $service['cookies'] ?? []);
            foreach ($patterns as $pattern) {
                if (self::pattern_matches($pattern, $key)) {
                    return self::build_match($service_id, $service, $pattern);
                }
            }
        }

        return null;
    }

    /**
     * Try to identify a service from a third-party domain seen in network requests.
     * Useful when a service hasn't yet posted a cookie but has loaded a script.
     */
    public static function match_domain(string $domain): ?array {
        $domain = strtolower(trim($domain));
        if ($domain === '') return null;

        foreach (self::all() as $service_id => $service) {
            foreach ($service['domains'] ?? [] as $known) {
                $known = strtolower($known);
                if ($domain === $known || str_ends_with($domain, '.' . $known)) {
                    return self::build_match($service_id, $service, $known);
                }
            }
        }

        return null;
    }

    /**
     * Convert a service catalog entry into the shape expected by
     * CookiesModule::sanitize_services() / settings.services.
     */
    public static function to_service_settings(string $service_id): ?array {
        $catalog = self::all();
        if (!isset($catalog[$service_id])) return null;

        $service = $catalog[$service_id];
        $cookies = array_values(array_filter($service['cookies'] ?? [], fn($c) => $c !== ''));

        return [
            'name'        => $service_id,
            'title'       => $service['title'],
            'description' => $service['description'],
            'purposes'    => [$service['purpose']],
            'cookies'     => $cookies,
            'required'    => !empty($service['required']),
            'default'     => false,
            'opt_out'     => false,
            'only_once'   => false,
            'enabled'     => true,
        ];
    }

    /**
     * Test whether a pattern matches a name.
     * Supports plain strings, * wildcards, and /regex/.
     */
    private static function pattern_matches(string $pattern, string $name): bool {
        if ($pattern === '') return false;

        // Raw regex: /^something$/
        if (strlen($pattern) > 1 && $pattern[0] === '/' && substr($pattern, -1) === '/') {
            return (bool) @preg_match($pattern, $name);
        }

        // Wildcard: convert "_ga_*" → "/^_ga_.*$/"
        if (strpos($pattern, '*') !== false) {
            $regex = '/^' . str_replace('\*', '.*', preg_quote($pattern, '/')) . '$/';
            return (bool) preg_match($regex, $name);
        }

        // Exact match
        return $pattern === $name;
    }
}
