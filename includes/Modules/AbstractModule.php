<?php
/**
 * Abstract Module Base Class
 */

namespace WeRocket\Tools\Modules;

abstract class AbstractModule implements ModuleInterface {

    protected string $id;
    protected string $name;
    protected string $description;
    protected string $icon;
    protected string $option_key;

    /** Per-request cache to avoid repeated get_option + deep merge on the same hit. */
    private ?array $settings_cache = null;

    public function get_id(): string {
        return $this->id;
    }

    public function get_name(): string {
        return $this->name;
    }

    public function get_description(): string {
        return $this->description;
    }

    public function get_icon(): string {
        return $this->icon;
    }

    public function get_settings(): array {
        if ($this->settings_cache !== null) {
            return $this->settings_cache;
        }
        $defaults = $this->get_default_settings();
        $saved = get_option($this->option_key, []);
        if (!is_array($saved)) {
            $saved = [];
        }
        return $this->settings_cache = $this->array_merge_recursive_distinct($defaults, $saved);
    }

    /**
     * Recursively merge arrays, with $array2 values overwriting $array1
     * Unlike array_merge_recursive, this replaces values instead of creating arrays
     */
    protected function array_merge_recursive_distinct(array $array1, array $array2): array {
        $merged = $array1;

        foreach ($array2 as $key => $value) {
            if (is_array($value) && isset($merged[$key]) && is_array($merged[$key])) {
                // Check if it's an indexed array (like services) or associative
                if ($this->is_indexed_array($value)) {
                    // For indexed arrays, replace entirely
                    $merged[$key] = $value;
                } else {
                    // For associative arrays, merge recursively
                    $merged[$key] = $this->array_merge_recursive_distinct($merged[$key], $value);
                }
            } else {
                $merged[$key] = $value;
            }
        }

        return $merged;
    }

    /**
     * Sanitise une couleur hexadécimale de réglage, normalisée en minuscules.
     *
     * Passe `''` en $fallback pour un champ « couleur optionnelle » où la chaîne
     * vide signifie « pas d'override, garder le défaut du thème ».
     */
    protected static function sanitize_hex_color(mixed $value, string $fallback = ''): string {
        $hex = \sanitize_hex_color(trim((string) $value));
        return $hex ? strtolower($hex) : $fallback;
    }

    /**
     * Check if array is indexed (sequential numeric keys starting from 0)
     */
    protected function is_indexed_array(array $array): bool {
        if (empty($array)) {
            return true;
        }
        return array_keys($array) === range(0, count($array) - 1);
    }

    public function save_settings(array $data): bool {
        // WP REST API applique wp_slash() automatiquement sur get_json_params()
        // → on retire les slashes ajoutés. La boucle nettoie également les valeurs
        // déjà polluées par les saves précédents (avant ce fix).
        $data = $this->deep_unslash($data);
        $sanitized = $this->sanitize_settings($data);

        // Bug WordPress historique : update_option() retourne FALSE lorsque
        // la nouvelle valeur est identique à l'ancienne (= "rien à changer").
        // Ce n'est PAS une erreur. On compare manuellement avant l'appel pour
        // distinguer ce cas du vrai échec d'écriture en DB.
        $current = get_option($this->option_key, null);

        if ($current === $sanitized) {
            // Pas de changement = succès trivial. On invalide quand même le
            // cache au cas où il aurait été modifié par un autre code path.
            $this->settings_cache = null;
            return true;
        }

        $result = (bool) update_option($this->option_key, $sanitized);
        $this->settings_cache = null;

        // Edge case : si update_option a renvoyé false mais que la valeur
        // est désormais bien en DB (ex: passé par un hook update_option_*),
        // on considère le save comme réussi.
        if (!$result && get_option($this->option_key, null) === $sanitized) {
            return true;
        }

        return $result;
    }

    private function deep_unslash(mixed $value): mixed {
        if (is_array($value)) {
            return array_map([$this, 'deep_unslash'], $value);
        }
        if (is_string($value)) {
            $previous = null;
            $iterations = 0;
            while ($previous !== $value && $iterations < 50) {
                $previous = $value;
                $value = stripslashes($value);
                $iterations++;
            }
        }
        return $value;
    }

    /**
     * Get default settings for the module
     */
    abstract protected function get_default_settings(): array;

    /**
     * Sanitize settings before saving
     */
    abstract protected function sanitize_settings(array $data): array;
}
