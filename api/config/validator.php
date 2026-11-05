<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - MÓDULO CENTRAL DE VALIDACIONES (VALIDATOR.PHP)
   Proporciona funciones reutilizables para validación de datos en APIs:
   - Rangos de fechas coherentes y límites de tiempo
   - Cadenas seguras, longitudes y listas blancas (Enums)
   - Valores numéricos y monetarios
   ========================================================================== */

/**
 * Valida si una fecha cumple con el formato ISO 'YYYY-MM-DD' y es una fecha real de calendario.
 *
 * @param string|null $date Cadena con la fecha a evaluar
 * @param string|null $minDate Límite inferior permitido (inclusive, formato Y-m-d)
 * @param string|null $maxDate Límite superior permitido (inclusive, formato Y-m-d)
 * @return array ['valid' => bool, 'error' => ?string, 'date' => ?string]
 */
function validate_iso_date(?string $date, ?string $minDate = null, ?string $maxDate = null): array {
    if ($date === null || trim($date) === '') {
        return ['valid' => false, 'error' => 'La fecha no puede estar vacía.', 'date' => null];
    }

    $date = trim($date);

    // Formato exacto YYYY-MM-DD
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches)) {
        return ['valid' => false, 'error' => "Formato de fecha inválido para '{$date}'. Use AAAA-MM-DD.", 'date' => null];
    }

    $year = (int)$matches[1];
    $month = (int)$matches[2];
    $day = (int)$matches[3];

    // Verificar validez en el calendario gregoriano (ej. 30 de febrero, 31 de abril)
    if (!checkdate($month, $day, $year)) {
        return ['valid' => false, 'error' => "La fecha '{$date}' no existe en el calendario.", 'date' => null];
    }

    // Verificar límite inferior si está definido
    if ($minDate !== null && $date < $minDate) {
        return ['valid' => false, 'error' => "La fecha '{$date}' es anterior al límite permitido ({$minDate}).", 'date' => null];
    }

    // Verificar límite superior si está definido
    if ($maxDate !== null && $date > $maxDate) {
        return ['valid' => false, 'error' => "La fecha '{$date}' excede el límite permitido ({$maxDate}).", 'date' => null];
    }

    return ['valid' => true, 'error' => null, 'date' => $date];
}

/**
 * Valida un rango de fechas (Fecha Inicio y Fecha Fin).
 *
 * Opciones soportadas:
 * - 'allow_future'   (bool): Si es falso, ninguna fecha puede ser mayor a hoy (default: false)
 * - 'allow_empty'    (bool): Si es verdadero, permite que ambas fechas o una de ellas estén vacías (default: true)
 * - 'min_date'       (string|null): Fecha mínima global (default: '2024-01-01')
 * - 'max_range_days' (int|null): Número máximo de días de diferencia permitidos (default: null)
 *
 * @param string|null $startDate Fecha de inicio (YYYY-MM-DD)
 * @param string|null $endDate Fecha de fin (YYYY-MM-DD)
 * @param array $options Opciones de configuración
 * @return array ['valid' => bool, 'error' => ?string, 'start' => ?string, 'end' => ?string]
 */
function validate_date_range(?string $startDate, ?string $endDate, array $options = []): array {
    $allowFuture = $options['allow_future'] ?? false;
    $allowEmpty = $options['allow_empty'] ?? true;
    $minDate = $options['min_date'] ?? '2024-01-01';
    $maxRangeDays = isset($options['max_range_days']) ? (int)$options['max_range_days'] : null;

    $startDate = ($startDate !== null) ? trim($startDate) : '';
    $endDate = ($endDate !== null) ? trim($endDate) : '';

    // Si ambas están vacías
    if ($startDate === '' && $endDate === '') {
        if (!$allowEmpty) {
            return ['valid' => false, 'error' => 'Debe especificar al menos una fecha para el filtro.', 'start' => null, 'end' => null];
        }
        return ['valid' => true, 'error' => null, 'start' => null, 'end' => null];
    }

    $today = date('Y-m-d');
    $maxAllowed = $allowFuture ? null : $today;

    $cleanStart = null;
    $cleanEnd = null;

    // 1. Validar fecha de inicio si fue enviada
    if ($startDate !== '') {
        $startCheck = validate_iso_date($startDate, $minDate, $maxAllowed);
        if (!$startCheck['valid']) {
            return [
                'valid' => false,
                'error' => "Fecha inicial inválida: " . $startCheck['error'],
                'start' => null,
                'end' => null
            ];
        }
        $cleanStart = $startCheck['date'];
    }

    // 2. Validar fecha de fin si fue enviada
    if ($endDate !== '') {
        $endCheck = validate_iso_date($endDate, $minDate, $maxAllowed);
        if (!$endCheck['valid']) {
            return [
                'valid' => false,
                'error' => "Fecha final inválida: " . $endCheck['error'],
                'start' => null,
                'end' => null
            ];
        }
        $cleanEnd = $endCheck['date'];
    }

    // 3. Validar coherencia del rango si ambas están presentes
    if ($cleanStart !== null && $cleanEnd !== null) {
        if ($cleanStart > $cleanEnd) {
            return [
                'valid' => false,
                'error' => "Rango incongruente: La fecha inicial ({$cleanStart}) no puede ser posterior a la fecha final ({$cleanEnd}).",
                'start' => null,
                'end' => null
            ];
        }

        // 4. Validar días máximos de amplitud si se configuró
        if ($maxRangeDays !== null && $maxRangeDays > 0) {
            $dtStart = new DateTime($cleanStart);
            $dtEnd = new DateTime($cleanEnd);
            $diffDays = (int)$dtStart->diff($dtEnd)->days;

            if ($diffDays > $maxRangeDays) {
                return [
                    'valid' => false,
                    'error' => "El rango solicitado ({$diffDays} días) supera el máximo permitido de {$maxRangeDays} días.",
                    'start' => null,
                    'end' => null
                ];
            }
        }
    }

    return [
        'valid' => true,
        'error' => null,
        'start' => $cleanStart,
        'end'   => $cleanEnd
    ];
}

/**
 * Valida y sanitiza una cadena de texto (ej. términos de búsqueda).
 *
 * @param string|null $input Cadena a validar
 * @param int $maxLength Longitud máxima permitida
 * @param bool $allowEmpty Si se permite que esté vacía
 * @return array ['valid' => bool, 'error' => ?string, 'value' => string]
 */
function validate_string(?string $input, int $maxLength = 100, bool $allowEmpty = true): array {
    $str = ($input !== null) ? trim($input) : '';

    if ($str === '') {
        if (!$allowEmpty) {
            return ['valid' => false, 'error' => 'El campo no puede estar vacío.', 'value' => ''];
        }
        return ['valid' => true, 'error' => null, 'value' => ''];
    }

    if (mb_strlen($str) > $maxLength) {
        return [
            'valid' => false,
            'error' => "El texto excede la longitud máxima permitida de {$maxLength} caracteres.",
            'value' => mb_substr($str, 0, $maxLength)
        ];
    }

    return ['valid' => true, 'error' => null, 'value' => $str];
}

/**
 * Valida un valor contra una lista permitida (Enum / Selects).
 *
 * @param string|null $value Valor enviado
 * @param array $allowedValues Lista de valores válidos permitidos
 * @param string|null $default Valor por defecto si viene vacío o no coincide
 * @return string Valor validado o por defecto
 */
function validate_enum(?string $value, array $allowedValues, ?string $default = null): ?string {
    if ($value === null || trim($value) === '') {
        return $default;
    }

    $upperVal = strtoupper(trim($value));
    $upperAllowed = array_map('strtoupper', $allowedValues);

    $index = array_search($upperVal, $upperAllowed, true);
    if ($index !== false) {
        return $allowedValues[$index];
    }

    return $default;
}

/**
 * Valida y normaliza un número de RIF venezolano (J, V, E, G, C).
 * Ejemplos aceptados: J-40123456-7, V123456780, G-20000000-1.
 *
 * @param string|null $rif Cadena del RIF
 * @param bool $allowEmpty Si se permite vacío
 * @return array ['valid' => bool, 'error' => ?string, 'rif' => ?string]
 */
function validate_rif(?string $rif, bool $allowEmpty = false): array {
    if ($rif === null || trim($rif) === '') {
        if ($allowEmpty) {
            return ['valid' => true, 'error' => null, 'rif' => ''];
        }
        return ['valid' => false, 'error' => 'El número de RIF es obligatorio.', 'rif' => null];
    }

    $clean = strtoupper(trim($rif));
    if (!preg_match('/^([JVEGC])[-]?(\d{7,9})[-]?(\d)?$/', $clean, $matches)) {
        return [
            'valid' => false,
            'error' => "Formato de RIF inválido para '{$rif}'. Debe ser tipo J-12345678-9 (letras: J, V, E, G, C).",
            'rif' => null
        ];
    }

    $type = $matches[1];
    $num = $matches[2];
    $verif = isset($matches[3]) && $matches[3] !== '' ? "-{$matches[3]}" : '';
    $normalized = "{$type}-{$num}{$verif}";

    return ['valid' => true, 'error' => null, 'rif' => $normalized];
}

/**
 * Valida una dirección de correo electrónico según estándar RFC.
 *
 * @param string|null $email
 * @param bool $allowEmpty Si se permite que esté vacío
 * @return array ['valid' => bool, 'error' => ?string, 'email' => string]
 */
function validate_email(?string $email, bool $allowEmpty = true): array {
    if ($email === null || trim($email) === '') {
        if ($allowEmpty) {
            return ['valid' => true, 'error' => null, 'email' => ''];
        }
        return ['valid' => false, 'error' => 'El correo electrónico es obligatorio.', 'email' => ''];
    }

    $clean = strtolower(trim($email));
    if (!filter_var($clean, FILTER_VALIDATE_EMAIL)) {
        return [
            'valid' => false,
            'error' => "El correo electrónico '{$email}' no tiene un formato válido.",
            'email' => ''
        ];
    }

    return ['valid' => true, 'error' => null, 'email' => $clean];
}

/**
 * Emite una respuesta de error de validación JSON estandarizada y termina la ejecución.
 *
 * @param string $message Mensaje explicativo del error
 * @param int $httpCode Código HTTP (default 400 Bad Request)
 */
function api_validation_error(string $message, int $httpCode = 400): void {
    http_response_code($httpCode);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'error'   => $message,
        'code'    => 'VALIDATION_ERROR'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

