<?php
/**
 * Formulaire de rétractation — vue éditoriale 2 colonnes.
 *
 * Variables disponibles (extract dans Frontend::render_form()) :
 * @var WC_Order|null $order
 * @var int          $step
 * @var string       $error
 * @var bool         $success
 * @var int          $submitted_id
 * @var string       $default_email
 * @var array|null   $lookup_state
 * @var string       $submit_url
 * @var string       $nonce_field
 */

defined('ABSPATH') || exit;
?>

<?php
$wr_inline_style = sprintf(
    '--wr-accent: %s; --wr-accent-deep: %s; --wr-accent-soft: %s;',
    esc_attr($accent ?? '#0F766E'),
    esc_attr($accent_deep ?? '#0B5851'),
    esc_attr($accent_soft ?? 'rgba(15, 118, 110, 0.08)')
);
?>
<div class="wr-retractation-app" style="<?php echo esc_attr($wr_inline_style); ?>">

    <?php if (!empty($success)) : ?>

        <div class="wr-retractation-app__panel">
            <div class="wr-success">
                <div class="wr-success__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                    </svg>
                </div>
                <h1 class="wr-success__title">
                    <?php esc_html_e('Demande', 'werocket-tools'); ?>
                    <em><?php esc_html_e('bien reçue', 'werocket-tools'); ?></em>
                </h1>
                <p class="wr-success__sub">
                    <?php esc_html_e('Un accusé de réception vient de vous être envoyé par email. Il fait foi en tant que support durable. Conservez-le précieusement.', 'werocket-tools'); ?>
                </p>
                <div class="wr-ticket">
                    <span class="wr-ticket-label"><?php esc_html_e('Référence', 'werocket-tools'); ?></span>
                    <strong>#<?php echo esc_html((string) $submitted_id); ?></strong>
                </div>
                <div>
                    <a class="wr-submit" href="<?php echo esc_url(home_url('/')); ?>">
                        <?php esc_html_e('Retour à l\'accueil', 'werocket-tools'); ?>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14M13 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>

    <?php else : ?>

        <div class="wr-retractation-app__grid">

            <!-- ───── Sidebar éditorial ───── -->
            <aside class="wr-retractation-app__aside">
                <span class="wr-retractation-app__eyebrow wr-anim wr-anim-1">
                    <?php esc_html_e('Droit de rétractation', 'werocket-tools'); ?>
                </span>
                <h1 class="wr-retractation-app__title wr-anim wr-anim-2">
                    <?php
                    /* translators: "Rétractation" + suffixe italique "en toute simplicité" */
                    echo wp_kses_post(__('Rétractation, <em>en toute simplicité</em>.', 'werocket-tools'));
                    ?>
                </h1>
                <p class="wr-retractation-app__lede wr-anim wr-anim-3">
                    <?php esc_html_e('Vous disposez de 14 jours après la livraison pour vous rétracter, sans avoir à vous justifier. Ce formulaire vous permet de nous notifier en quelques clics.', 'werocket-tools'); ?>
                </p>

                <ol class="wr-retractation-app__steps wr-anim wr-anim-4" style="counter-reset: step;">
                    <li>
                        <strong><?php esc_html_e('Identification', 'werocket-tools'); ?></strong>
                        <span><?php esc_html_e('Numéro de commande + email utilisé lors de l\'achat.', 'werocket-tools'); ?></span>
                    </li>
                    <li>
                        <strong><?php esc_html_e('Sélection', 'werocket-tools'); ?></strong>
                        <span><?php esc_html_e('Articles concernés (totale ou partielle). Le motif est facultatif.', 'werocket-tools'); ?></span>
                    </li>
                    <li>
                        <strong><?php esc_html_e('Accusé de réception', 'werocket-tools'); ?></strong>
                        <span><?php esc_html_e('Email immédiat sur support durable, avec votre numéro de demande.', 'werocket-tools'); ?></span>
                    </li>
                    <li>
                        <strong><?php esc_html_e('Remboursement', 'werocket-tools'); ?></strong>
                        <span><?php esc_html_e('Effectué après validation, sur le moyen de paiement initial.', 'werocket-tools'); ?></span>
                    </li>
                </ol>
            </aside>

            <!-- ───── Panneau formulaire ───── -->
            <div class="wr-retractation-app__panel wr-anim wr-anim-3">

                <div class="wr-retractation-app__stepper">
                    <span class="wr-dot <?php echo $step === 1 ? 'is-active' : ''; ?>"></span>
                    <span class="wr-dot <?php echo $step === 2 ? 'is-active' : ''; ?>"></span>
                    <span><?php printf(
                        /* translators: %1$d étape actuelle, %2$d total */
                        esc_html__('Étape %1$d sur %2$d', 'werocket-tools'),
                        (int) $step,
                        2
                    ); ?></span>
                </div>

                <?php if (!empty($error)) : ?>
                    <div class="wr-alert" role="alert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span><?php echo esc_html($error); ?></span>
                    </div>
                <?php endif; ?>

                <?php if ($step === 1) : ?>

                    <h2 class="wr-retractation-app__panel-title">
                        <?php esc_html_e('Identifions votre commande', 'werocket-tools'); ?>
                    </h2>
                    <p class="wr-retractation-app__panel-sub">
                        <?php esc_html_e('Pour des raisons de sécurité, nous vérifions l\'appariement entre le numéro de commande et l\'email utilisé.', 'werocket-tools'); ?>
                    </p>

                    <form method="post" action="<?php echo esc_url($submit_url); ?>" autocomplete="on">
                        <?php echo $nonce_field; // déjà escaped par wp_nonce_field ?>
                        <input type="hidden" name="wr_step" value="1" />

                        <div class="wr-field">
                            <label class="wr-field__label" for="wr_order_id">
                                <?php esc_html_e('Numéro de commande', 'werocket-tools'); ?>
                                <span class="wr-field__hint"><?php esc_html_e('présent dans votre email de confirmation', 'werocket-tools'); ?></span>
                            </label>
                            <input
                                type="text"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                class="wr-input"
                                name="wr_order_id"
                                id="wr_order_id"
                                placeholder="ex. 12345"
                                required
                                autocomplete="off"
                            />
                        </div>

                        <div class="wr-field">
                            <label class="wr-field__label" for="wr_email">
                                <?php esc_html_e('Email de la commande', 'werocket-tools'); ?>
                            </label>
                            <input
                                type="email"
                                class="wr-input"
                                name="wr_email"
                                id="wr_email"
                                value="<?php echo esc_attr($default_email); ?>"
                                placeholder="vous@exemple.fr"
                                required
                                autocomplete="email"
                            />
                        </div>

                        <div class="wr-submit-row">
                            <p class="wr-submit-note">
                                <?php esc_html_e('Aucun document à téléverser. La sélection des articles se fait à l\'étape suivante.', 'werocket-tools'); ?>
                            </p>
                            <button type="submit" class="wr-submit">
                                <?php esc_html_e('Continuer', 'werocket-tools'); ?>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M5 12h14M13 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </form>

                <?php elseif ($step === 2 && $order instanceof WC_Order) : ?>

                    <h2 class="wr-retractation-app__panel-title">
                        <?php esc_html_e('Sélectionnez les articles concernés', 'werocket-tools'); ?>
                    </h2>
                    <p class="wr-retractation-app__panel-sub">
                        <?php esc_html_e('Tous les articles sont cochés par défaut (rétractation totale). Décochez ceux que vous souhaitez conserver pour une rétractation partielle.', 'werocket-tools'); ?>
                    </p>

                    <div class="wr-summary">
                        <span class="wr-summary__order">
                            <?php
                            /* translators: %s : numéro de commande */
                            printf(esc_html__('Commande %s', 'werocket-tools'), '<strong>#' . esc_html($order->get_order_number()) . '</strong>');
                            ?>
                        </span>
                        <span class="wr-summary__customer">
                            <?php echo esc_html(trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name())); ?>
                        </span>
                    </div>

                    <form method="post" action="<?php echo esc_url($submit_url); ?>" id="wr-form-step-2">
                        <?php echo $nonce_field; ?>
                        <input type="hidden" name="wr_step" value="2" />

                        <ul class="wr-items">
                            <li class="wr-items__head">
                                <span><?php esc_html_e('Articles de la commande', 'werocket-tools'); ?></span>
                                <button type="button" class="wr-items__toggle-all" data-wr-toggle-all>
                                    <?php esc_html_e('Tout décocher', 'werocket-tools'); ?>
                                </button>
                            </li>
                            <?php foreach ($order->get_items() as $item_id => $item) : ?>
                                <li class="wr-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="wr_items[]"
                                            value="<?php echo esc_attr((string) $item_id); ?>"
                                            checked
                                            data-wr-item
                                        />
                                        <span class="wr-item__check" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M20 6 9 17l-5-5"/>
                                            </svg>
                                        </span>
                                        <span class="wr-item__body">
                                            <span class="wr-item__name"><?php echo esc_html($item->get_name()); ?></span>
                                            <span class="wr-item__qty">
                                                <?php
                                                /* translators: %d : quantité */
                                                printf(esc_html__('Quantité : %d', 'werocket-tools'), (int) $item->get_quantity());
                                                ?>
                                            </span>
                                        </span>
                                    </label>
                                </li>
                            <?php endforeach; ?>
                        </ul>

                        <div class="wr-field">
                            <label class="wr-field__label" for="wr_customer_name">
                                <?php esc_html_e('Nom et prénom', 'werocket-tools'); ?>
                            </label>
                            <input
                                type="text"
                                class="wr-input"
                                name="wr_customer_name"
                                id="wr_customer_name"
                                required
                                value="<?php echo esc_attr(trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name())); ?>"
                            />
                        </div>

                        <div class="wr-field">
                            <label class="wr-field__label" for="wr_customer_address">
                                <?php esc_html_e('Adresse postale', 'werocket-tools'); ?>
                                <span class="wr-field__optional"><?php esc_html_e('Facultatif', 'werocket-tools'); ?></span>
                            </label>
                            <textarea
                                class="wr-textarea"
                                name="wr_customer_address"
                                id="wr_customer_address"
                                rows="3"
                            ><?php echo esc_textarea(trim(
                                $order->get_billing_address_1() . "\n" .
                                $order->get_billing_address_2() . "\n" .
                                trim($order->get_billing_postcode() . ' ' . $order->get_billing_city()) . "\n" .
                                $order->get_billing_country()
                            )); ?></textarea>
                        </div>

                        <div class="wr-field">
                            <label class="wr-field__label" for="wr_reason">
                                <?php esc_html_e('Motif', 'werocket-tools'); ?>
                                <span class="wr-field__optional"><?php esc_html_e('Facultatif', 'werocket-tools'); ?></span>
                            </label>
                            <textarea
                                class="wr-textarea"
                                name="wr_reason"
                                id="wr_reason"
                                rows="3"
                                placeholder="<?php esc_attr_e('La loi ne vous impose pas de motiver votre rétractation. Vos retours nous aident toutefois à nous améliorer.', 'werocket-tools'); ?>"
                            ></textarea>
                        </div>

                        <div class="wr-submit-row">
                            <p class="wr-submit-note">
                                <?php esc_html_e('Un accusé de réception vous sera envoyé immédiatement. Cet email fait foi.', 'werocket-tools'); ?>
                            </p>
                            <button type="submit" class="wr-submit wr-submit--primary">
                                <?php esc_html_e('Envoyer ma demande', 'werocket-tools'); ?>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M5 12h14M13 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </form>

                <?php endif; ?>

            </div>

            <div class="wr-retractation-app__legal wr-anim wr-anim-5">
                <strong><?php esc_html_e('Cadre légal', 'werocket-tools'); ?></strong>
                <?php esc_html_e('Articles L221-18 et suivants du Code de la consommation. Formulaire en ligne et accusé sur support durable conformément à L221-21.', 'werocket-tools'); ?>
            </div>

        </div>

    <?php endif; ?>

</div>

<?php if (!empty($step) && $step === 2) : ?>
<script>
(function () {
    var btn = document.querySelector('[data-wr-toggle-all]');
    if (!btn) return;
    var items = function () { return document.querySelectorAll('[data-wr-item]'); };
    btn.addEventListener('click', function () {
        var allChecked = Array.prototype.every.call(items(), function (i) { return i.checked; });
        items().forEach(function (i) { i.checked = !allChecked; });
        btn.textContent = allChecked
            ? '<?php echo esc_js(__('Tout cocher', 'werocket-tools')); ?>'
            : '<?php echo esc_js(__('Tout décocher', 'werocket-tools')); ?>';
    });
})();
</script>
<?php endif; ?>
