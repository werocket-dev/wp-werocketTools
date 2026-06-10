<?php
/**
 * Personnalisation de la page wp-login.php (logo société + layout 2 colonnes
 * avec image de couverture). Activée uniquement si `login_enabled = true`
 * dans les settings du module Infos société.
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

class LoginCustomizer {

    public function __construct(private CompanyInfoModule $module) {
        // login_head s'exécute dans le <head> de wp-login.php — endroit
        // canonique pour echo une balise <style> destinée à wp-login.
        add_action('login_head',       [$this, 'inject_styles']);
        add_action('login_footer',     [$this, 'render_cover']);
        add_filter('login_headerurl',  [$this, 'filter_logo_url']);
        add_filter('login_headertext', [$this, 'filter_logo_text']);
        add_filter('login_body_class', [$this, 'filter_body_class']);
        // Masque le sélecteur de langue (WP 5.9+) — il s'insère en dehors
        // du grid 2 colonnes et casse le centrage vertical du formulaire.
        add_filter('login_display_language_dropdown', [$this, 'filter_language_dropdown']);
    }

    public function filter_language_dropdown(bool $display): bool {
        return $this->is_enabled() ? false : $display;
    }

    private function settings(): array {
        return $this->module->get_settings();
    }

    private function is_enabled(): bool {
        return !empty($this->settings()['login_enabled']);
    }

    /**
     * Ajoute la classe wr-login-custom au <body> pour scoper tous nos overrides.
     * On garde les classes natives WP intactes — on ne fait qu'ajouter.
     */
    public function filter_body_class(array $classes): array {
        if ($this->is_enabled()) {
            $classes[] = 'wr-login-custom';
        }
        return $classes;
    }

    public function filter_logo_url(string $url): string {
        return $this->is_enabled() ? home_url('/') : $url;
    }

    public function filter_logo_text(string $text): string {
        $settings = $this->settings();
        if (!$this->is_enabled()) {
            return $text;
        }
        $name = (string) ($settings['commercial_name'] ?: $settings['name']);
        return $name !== '' ? $name : $text;
    }

    /**
     * CSS injecté inline pour éviter une requête HTTP supplémentaire et
     * garantir que les styles arrivent avant le premier paint (pas de FOUC
     * sur le layout 2 colonnes). Toutes les couleurs/URLs viennent des
     * settings — pas de hardcoding utilisateur.
     */
    public function inject_styles(): void {
        if (!$this->is_enabled()) {
            return;
        }

        $settings    = $this->settings();
        $logo_url    = $settings['logo_url']        ?? '';
        $cover_url   = $settings['login_cover_url'] ?? '';
        $show_logo   = !empty($settings['login_show_logo']) && $logo_url !== '';
        $has_cover   = $cover_url !== '';
        $logo_size   = max(32, min(160, (int) ($settings['login_logo_size'] ?? 64)));
        $btn_bg      = (string) ($settings['login_button_bg_color']   ?? '');
        $btn_text    = (string) ($settings['login_button_text_color'] ?? '');

        // #abc → #aabbcc pour pouvoir suffixer l'alpha hex de l'ombre
        if (strlen($btn_bg) === 4) {
            $btn_bg = '#' . $btn_bg[1] . $btn_bg[1] . $btn_bg[2] . $btn_bg[2] . $btn_bg[3] . $btn_bg[3];
        }
        ?>
<style id="werocket-login-custom">
/* ─── Layout 2 colonnes : on transforme le <body class="login"> en grid ─── */
/* Ancre la hauteur à 100vh pile (pas de min-height qui laisserait le grid
   s'étirer si du contenu hors-flow injecte de la hauteur) pour que l'image
   de cover en object-fit:cover reste calée sur la viewport. */
html, body.wr-login-custom { height: 100%; }
body.wr-login-custom {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
    background: #fff;
    display: grid;
    grid-template-columns: <?php echo $has_cover ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr'; ?>;
    grid-template-rows: 1fr;
}

/* WordPress imprime un padding-top en haut du body pour pousser le form
   sous le logo — on le neutralise pour que la grille fasse 100vh propre. */
body.wr-login-custom #login {
    padding: 5vmin clamp(1rem, 4vw, 3rem);
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    align-self: center;
    justify-self: center;
    grid-column: 1;
}

/* ─── Logo société : on override le h1 a (sprite WordPress par défaut) ─── */
<?php if ($show_logo): ?>
body.wr-login-custom .login h1 a,
body.wr-login-custom #login h1 a {
    background-image: url(<?php echo esc_url($logo_url); ?>) !important;
    background-size: contain !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    width: 100% !important;
    height: <?php echo $logo_size; ?>px !important;
    margin: 0 auto 1.5rem !important;
    text-indent: -9999px;
}
<?php endif; ?>

/* ─── Refresh du form : coins arrondis + ombre douce, sans rompre le rendu WP ─── */
body.wr-login-custom #loginform,
body.wr-login-custom #registerform,
body.wr-login-custom #lostpasswordform {
    border-radius: 18px;
    box-shadow: 0 12px 32px -16px rgba(15, 23, 42, 0.18);
    padding: 1.75rem 1.5rem;
    border: 1px solid rgba(15, 23, 42, 0.06);
}

body.wr-login-custom .login input[type=text],
body.wr-login-custom .login input[type=password],
body.wr-login-custom .login input[type=email] {
    border-radius: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    background: #fff;
    box-shadow: none;
}

body.wr-login-custom .wp-core-ui .button-primary {
    border-radius: 999px;
    padding: 0.55rem 1.5rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    border: 0;
    text-shadow: none;
    box-shadow: 0 4px 12px -4px <?php echo $btn_bg !== '' ? esc_html($btn_bg) . '66' : 'rgba(5, 150, 105, 0.4)'; ?>;
<?php if ($btn_bg !== ''): ?>
    background: <?php echo esc_html($btn_bg); ?> !important;
<?php endif; ?>
<?php if ($btn_text !== ''): ?>
    color: <?php echo esc_html($btn_text); ?> !important;
<?php endif; ?>
}

<?php if ($btn_bg !== ''): ?>
body.wr-login-custom .wp-core-ui .button-primary:hover,
body.wr-login-custom .wp-core-ui .button-primary:focus {
    background: <?php echo esc_html($btn_bg); ?> !important;
    filter: brightness(0.92);
}
<?php endif; ?>

body.wr-login-custom .login #nav,
body.wr-login-custom .login #backtoblog {
    text-align: center;
    margin-top: 1rem;
}

body.wr-login-custom .login #nav a,
body.wr-login-custom .login #backtoblog a {
    color: #475569;
    text-decoration: none;
}

body.wr-login-custom .login #nav a:hover,
body.wr-login-custom .login #backtoblog a:hover {
    color: #0f172a;
    text-decoration: underline;
}

/* ─── Colonne droite : <img> object-fit cover dans un wrapper position:relative ─── */
<?php if ($has_cover): ?>
.wr-login-cover {
    grid-column: 2;
    grid-row: 1;
    position: relative;
    overflow: hidden;
    height: 100%;
    min-height: 0;
}

.wr-login-cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
}

/* Voile subtil pour conserver de la lisibilité même si l'image est très claire. */
.wr-login-cover::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(140deg, rgba(15, 23, 42, 0) 50%, rgba(15, 23, 42, 0.18) 100%);
    pointer-events: none;
}
<?php endif; ?>

/* ─── Mobile : passe en 1 colonne, cover devient bandeau haut ─── */
@media (max-width: 880px) {
    body.wr-login-custom {
        grid-template-columns: 1fr;
        grid-template-rows: 200px auto;
    }
    body.wr-login-custom #login {
        grid-row: 2;
        grid-column: 1;
    }
    <?php if ($has_cover): ?>
    .wr-login-cover {
        grid-column: 1;
        grid-row: 1;
    }
    <?php endif; ?>
}

/* Sticky shake animation natif WP : on neutralise pour ne pas faire trembler la grid. */
body.wr-login-custom.login form { transition: box-shadow .2s ease; }
</style>
<?php
    }

    /**
     * Injecté en fin de body — devient la colonne 2 via CSS grid.
     *
     * On utilise un vrai <img> avec object-fit:cover plutôt qu'un
     * background-image : ça permet au navigateur de précharger l'image
     * en priorité (vs background qui attend le CSS), de servir la bonne
     * version responsive si srcset, et garantit que le ratio est respecté
     * via object-fit même si la cellule grid se redimensionne.
     */
    public function render_cover(): void {
        if (!$this->is_enabled()) {
            return;
        }
        $cover_url = $this->settings()['login_cover_url'] ?? '';
        if ($cover_url === '') {
            return;
        }
        printf(
            '<div class="wr-login-cover" aria-hidden="true"><img src="%s" alt="" loading="eager" decoding="async"></div>',
            esc_url($cover_url)
        );
    }
}
