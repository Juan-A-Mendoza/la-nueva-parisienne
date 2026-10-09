<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - MÓDULO DE SEGURIDAD INTEGRAL (SECURITY.PHP)
   - Criptografía segura con BCRYPT para contraseñas y PINs
   - Cabeceras de seguridad HTTP (XSS, Clickjacking, MIME Sniffing)
   - Protección contra ataques de fuerza bruta (Rate Limiting)
   - Sanitización de entradas y tokens criptográficos
   ========================================================================== */

// 1. Cabeceras de seguridad HTTP
if (!headers_sent()) {
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: SAMEORIGIN");
    header("X-XSS-Protection: 1; mode=block");
    header("Referrer-Policy: strict-origin-when-cross-origin");
}

/**
 * Genera un hash criptográfico seguro usando BCRYPT con factor de coste 10
 * @param string $password
 * @return string
 */
function security_hash_password(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

/**
 * Valida una contraseña contra un hash BCRYPT almacenado.
 * Si el hash es texto plano (legado), realiza comparación segura en tiempo constante.
 * @param string $password
 * @param string $storedHash
 * @return bool
 */
function security_verify_password(string $password, string $storedHash): bool {
    if (empty($password) || empty($storedHash)) {
        return false;
    }

    // 1. Verificación estándar BCRYPT
    if (password_verify($password, $storedHash)) {
        return true;
    }

    // 2. Soporte retroactivo para contraseñas heredadas en texto plano
    if (hash_equals((string)$storedHash, (string)$password)) {
        return true;
    }

    return false;
}

/**
 * Verifica si el hash actual necesita ser recalculado (ej. upgrade de coste)
 * @param string $storedHash
 * @return bool
 */
function security_needs_rehash(string $storedHash): bool {
    return password_needs_rehash($storedHash, PASSWORD_BCRYPT, ['cost' => 10]);
}

/**
 * Genera un token de autenticación criptográficamente seguro (32 bytes)
 * @return string
 */
function security_generate_token(): string {
    return 'LNP_SEC_' . bin2hex(random_bytes(24));
}

/**
 * Protección contra ataques de fuerza bruta en logins y cambio de PIN
 * Almacena intentos en archivo de caché temporal
 * @param string $key Identificador (ej: IP del cliente o usuario)
 * @param int $maxAttempts Máximo de intentos permitidos
 * @param int $decaySeconds Período de bloqueo en segundos (default 60s)
 * @return array ['allowed' => bool, 'remaining' => int, 'retry_after' => int]
 */
function security_check_rate_limit(string $key, int $maxAttempts = 5, int $decaySeconds = 60): array {
    $tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lnp_security';
    if (!is_dir($tempDir)) {
        @mkdir($tempDir, 0755, true);
    }

    $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
    $cacheFile = $tempDir . DIRECTORY_SEPARATOR . 'rl_' . md5($safeKey) . '.json';

    $now = time();
    $data = ['attempts' => 0, 'first_attempt' => $now];

    if (file_exists($cacheFile)) {
        $content = @file_get_contents($cacheFile);
        if ($content) {
            $parsed = json_decode($content, true);
            if ($parsed && isset($parsed['first_attempt'])) {
                if ($now - $parsed['first_attempt'] < $decaySeconds) {
                    $data = $parsed;
                }
            }
        }
    }

    if ($data['attempts'] >= $maxAttempts) {
        $retryAfter = $decaySeconds - ($now - $data['first_attempt']);
        return [
            'allowed' => false,
            'remaining' => 0,
            'retry_after' => max(1, $retryAfter)
        ];
    }

    return [
        'allowed' => true,
        'remaining' => $maxAttempts - $data['attempts'],
        'retry_after' => 0
    ];
}

/**
 * Registra un intento fallido para el limitador de tasa
 */
function security_record_failed_attempt(string $key, int $decaySeconds = 60): void {
    $tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lnp_security';
    if (!is_dir($tempDir)) {
        @mkdir($tempDir, 0755, true);
    }

    $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
    $cacheFile = $tempDir . DIRECTORY_SEPARATOR . 'rl_' . md5($safeKey) . '.json';

    $now = time();
    $data = ['attempts' => 1, 'first_attempt' => $now];

    if (file_exists($cacheFile)) {
        $content = @file_get_contents($cacheFile);
        if ($content) {
            $parsed = json_decode($content, true);
            if ($parsed && isset($parsed['first_attempt'])) {
                if ($now - $parsed['first_attempt'] < $decaySeconds) {
                    $data['attempts'] = ($parsed['attempts'] ?? 0) + 1;
                    $data['first_attempt'] = $parsed['first_attempt'];
                }
            }
        }
    }

    @file_put_contents($cacheFile, json_encode($data), LOCK_EX);
}

/**
 * Limpia los intentos fallidos tras un login exitoso
 */
function security_clear_rate_limit(string $key): void {
    $tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lnp_security';
    $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
    $cacheFile = $tempDir . DIRECTORY_SEPARATOR . 'rl_' . md5($safeKey) . '.json';
    if (file_exists($cacheFile)) {
        @unlink($cacheFile);
    }
}
