<?php
/**
 * Client API recherche-entreprises.api.gouv.fr (open data, sans clé).
 * Renvoie un payload normalisé prêt à fusionner dans les settings du module.
 */

namespace WeRocket\Tools\Modules\CompanyInfo;

class SireneClient {

    private const ENDPOINT = 'https://recherche-entreprises.api.gouv.fr/search';
    private const CACHE_TTL = 12 * HOUR_IN_SECONDS;

    /**
     * Recherche par SIREN (9) ou SIRET (14). Retourne null si rien.
     * @return array<string,string>|null
     */
    public function lookup(string $identifier): ?array {
        $digits = preg_replace('/\D/', '', $identifier);
        if ($digits === '' || (strlen($digits) !== 9 && strlen($digits) !== 14)) {
            return null;
        }

        // Pas de contrôle Luhn : certains SIREN valides ne le respectent pas
        // (ex. La Poste 356000000). On laisse l'API Sirene arbitrer.

        $cache_key = 'werocket_sirene_' . $digits;
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return $cached;
        }

        $url = add_query_arg([
            'q'              => $digits,
            'page'           => 1,
            'per_page'       => 1,
            'minimal'        => 'false',
        ], self::ENDPOINT);

        $response = wp_remote_get($url, [
            'timeout'   => 10,
            'headers'   => ['Accept' => 'application/json'],
            'sslverify' => true,
            'user-agent'=> 'WeRocketTools/1.0 (+wordpress)',
        ]);

        if (is_wp_error($response)) {
            return null;
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            return null;
        }

        $body = json_decode((string) wp_remote_retrieve_body($response), true);
        if (!is_array($body) || empty($body['results'][0])) {
            return null;
        }

        $normalized = $this->normalize($body['results'][0], $digits);
        set_transient($cache_key, $normalized, self::CACHE_TTL);

        return $normalized;
    }

    /**
     * Normalise la réponse API → mêmes clés que les settings du module.
     * @param array<string,mixed> $r
     * @return array<string,string>
     */
    private function normalize(array $r, string $queried): array {
        $siege = is_array($r['siege'] ?? null) ? $r['siege'] : [];

        $name = (string) ($r['nom_complet'] ?? $r['nom_raison_sociale'] ?? '');
        $commercial = (string) ($r['nom_commercial'] ?? '');
        $legal_form = (string) ($r['nature_juridique'] ?? '');
        $siren = (string) ($r['siren'] ?? '');
        $siret = (string) ($siege['siret'] ?? '');

        // TVA intracom FR : "FR" + clé(2) + SIREN. Clé = (12 + 3 × (SIREN mod 97)) mod 97
        $vat = '';
        if ($siren !== '' && ctype_digit($siren) && strlen($siren) === 9) {
            $key = ((12 + 3 * ((int) $siren % 97)) % 97);
            $vat = sprintf('FR%02d%s', $key, $siren);
        }

        // Adresse : recompose depuis siege
        $street = trim(implode(' ', array_filter([
            (string) ($siege['numero_voie'] ?? ''),
            (string) ($siege['indice_repetition'] ?? ''),
            (string) ($siege['type_voie'] ?? ''),
            (string) ($siege['libelle_voie'] ?? ''),
        ])));
        if ($street === '' && !empty($siege['adresse'])) {
            $street = (string) $siege['adresse'];
        }

        $director = '';
        if (!empty($r['dirigeants']) && is_array($r['dirigeants'])) {
            $d = $r['dirigeants'][0] ?? [];
            $director = trim((string) ($d['prenoms'] ?? '') . ' ' . (string) ($d['nom'] ?? ''));
            if ($director === ' ' || $director === '') {
                $director = (string) ($d['denomination'] ?? '');
            }
        }

        return [
            'siren'         => $siren,
            'siret'         => $siret ?: (strlen($queried) === 14 ? $queried : ''),
            'name'          => $name,
            'commercial_name' => $commercial,
            'legal_form'    => $legal_form,
            'capital'       => (string) ($r['capital_social'] ?? ''),
            'vat'           => $vat,
            'ape_code'      => (string) ($r['activite_principale'] ?? ''),
            'ape_label'     => (string) ($r['libelle_activite_principale'] ?? ''),
            'director'      => $director,
            'creation_date' => (string) ($r['date_creation'] ?? ''),
            'street'        => $street,
            'postal_code'   => (string) ($siege['code_postal'] ?? ''),
            'city'          => (string) ($siege['libelle_commune'] ?? ''),
            'country'       => 'France',
            'rcs'           => $siren !== '' ? trim('RCS ' . (string) ($siege['libelle_commune'] ?? '') . ' ' . $siren) : '',
        ];
    }

}
