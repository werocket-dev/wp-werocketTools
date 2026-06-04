<?php
/**
 * Intégration native avec le builder Breakdance — expose les infos société
 * comme Dynamic Data sources sous une catégorie "Infos société" dans le
 * dropdown du chooser.
 *
 * API utilisée : Breakdance\DynamicData\registerField() + StringField/ImageField.
 * Référence : github.com/soflyy/breakdance-developer-docs/tree/master/dynamic-data
 *
 * Les classes des champs (anonymes) ne sont instanciées qu'à l'intérieur du
 * hook 'init' avec priority tardive, après que Breakdance ait chargé ses
 * namespaces. Sans Breakdance actif, ce fichier est inerte.
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

class BreakdanceIntegration {

    private const CATEGORY = 'Infos société';

    /** Champs string exposés (clé → label affiché dans le chooser) */
    private const STRING_FIELDS = [
        'name'            => 'Raison sociale',
        'commercial_name' => 'Nom commercial',
        'legal_form'      => 'Forme juridique',
        'siren'           => 'SIREN',
        'siret'           => 'SIRET',
        'capital'         => 'Capital social',
        'rcs'             => 'RCS',
        'vat'             => 'TVA intracommunautaire',
        'ape_code'        => 'Code APE',
        'ape_label'       => 'Libellé APE',
        'director'        => 'Dirigeant',
        'creation_date'   => 'Date de création',
        'street'          => 'Rue',
        'postal_code'     => 'Code postal',
        'city'            => 'Ville',
        'country'         => 'Pays',
        'phone'           => 'Téléphone',
        'email'           => 'Email',
        'website'         => 'Site web',
        'address'         => 'Adresse complète',
    ];

    public static function register(): void {
        // Priority 20 pour être sûr que Breakdance a chargé ses classes
        // (il s'auto-bootstrap sur init priority 0-10).
        add_action('init', [self::class, 'maybe_register_fields'], 20);
    }

    public static function maybe_register_fields(): void {
        // Si Breakdance n'est pas actif, on ne fait rien (pas d'erreur).
        if (!function_exists('\Breakdance\DynamicData\registerField')) {
            return;
        }

        if (!class_exists('\Breakdance\DynamicData\StringField') ||
            !class_exists('\Breakdance\DynamicData\ImageField')) {
            return;
        }

        // ─── Champs texte ───
        foreach (self::STRING_FIELDS as $key => $label) {
            \Breakdance\DynamicData\registerField(
                self::make_string_field($key, $label)
            );
        }

        // ─── Champ image : Logo ───
        \Breakdance\DynamicData\registerField(self::make_logo_field());
    }

    /**
     * Crée une instance anonyme de StringField pour un champ donné.
     * On utilise des classes anonymes pour éviter d'avoir N classes nommées
     * (une par champ), tout en respectant le contrat Breakdance.
     */
    private static function make_string_field(string $key, string $label): object {
        return new class($key, $label) extends \Breakdance\DynamicData\StringField {
            private string $key;
            private string $label;

            public function __construct(string $key, string $label) {
                $this->key   = $key;
                $this->label = $label;
            }

            public function label() {
                return $this->label;
            }

            public function category() {
                return BreakdanceIntegration::category();
            }

            public function slug() {
                return 'werocket_company_' . $this->key;
            }

            /**
             * @param array<string,mixed> $attributes
             */
            public function handler($attributes): \Breakdance\DynamicData\StringData {
                $value = self::resolve_value($this->key);
                return \Breakdance\DynamicData\StringData::fromString($value);
            }

            private static function resolve_value(string $key): string {
                // Cas spécial : adresse composite
                if ($key === 'address' && function_exists('werocket_company_address')) {
                    return werocket_company_address();
                }
                if (function_exists('werocket_company_field')) {
                    return werocket_company_field($key);
                }
                return '';
            }
        };
    }

    /**
     * Champ image dédié au logo (renvoie via attachment ID pour que
     * Breakdance puisse régénérer tous les sizes correctement).
     */
    private static function make_logo_field(): object {
        return new class extends \Breakdance\DynamicData\ImageField {
            public function label() {
                return 'Logo';
            }

            public function category() {
                return BreakdanceIntegration::category();
            }

            public function slug() {
                return 'werocket_company_logo';
            }

            /**
             * @param array<string,mixed> $attributes
             */
            public function handler($attributes): \Breakdance\DynamicData\ImageData {
                $attachment_id = function_exists('werocket_company_logo_id')
                    ? werocket_company_logo_id()
                    : 0;

                if ($attachment_id > 0) {
                    return \Breakdance\DynamicData\ImageData::fromAttachmentId($attachment_id);
                }

                // Fallback : data vide (Breakdance affichera son placeholder)
                $data = new \Breakdance\DynamicData\ImageData();
                $data->url = '';
                $data->sizes = [];
                return $data;
            }
        };
    }

    /**
     * Exposée pour les classes anonymes (elles ne peuvent pas accéder aux
     * constantes private de la classe outer en PHP 8.0).
     */
    public static function category(): string {
        return self::CATEGORY;
    }
}
