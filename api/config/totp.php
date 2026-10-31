<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - MOTOR CRIPTOGRÁFICO TOTP RFC 6238 / RFC 4226
   Generación y validación de tokens de 6 dígitos para Google Authenticator,
   Microsoft Authenticator y Authy. 100% Offline y sin dependencias externas.
   ========================================================================== */

class TOTP {
    private static $base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Genera una clave secreta aleatoria en Base32 (estándar RFC 3548)
     * @param int $length Longitud en caracteres (por defecto 16 = 80 bits)
     * @return string
     */
    public static function generateSecret(int $length = 16): string {
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= self::$base32Chars[random_int(0, 31)];
        }
        return $secret;
    }

    /**
     * Decodifica una cadena Base32 en su representación binaria
     * @param string $b32
     * @return string
     */
    public static function base32Decode(string $b32): string {
        $b32 = strtoupper(trim($b32));
        $b32 = preg_replace('/[^A-Z2-7]/', '', $b32);
        if (empty($b32)) return '';

        $buffer = 0;
        $bitsLeft = 0;
        $binary = '';

        $len = strlen($b32);
        for ($i = 0; $i < $len; $i++) {
            $val = strpos(self::$base32Chars, $b32[$i]);
            if ($val === false) continue;

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $binary .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }
        return $binary;
    }

    /**
     * Codifica datos binarios en Base32
     * @param string $data
     * @return string
     */
    public static function base32Encode(string $data): string {
        if (empty($data)) return '';
        $buffer = 0;
        $bitsLeft = 0;
        $b32 = '';
        $len = strlen($data);

        for ($i = 0; $i < $len; $i++) {
            $buffer = ($buffer << 8) | ord($data[$i]);
            $bitsLeft += 8;

            while ($bitsLeft >= 5) {
                $bitsLeft -= 5;
                $b32 .= self::$base32Chars[($buffer >> $bitsLeft) & 0x1F];
            }
        }

        if ($bitsLeft > 0) {
            $buffer = ($buffer << (5 - $bitsLeft));
            $b32 .= self::$base32Chars[$buffer & 0x1F];
        }

        return $b32;
    }

    /**
     * Calcula el código OTP de 6 dígitos para una rebanada de tiempo dada
     * @param string $secret Secreto en Base32
     * @param int|null $timeSlice Si es null, usa el tiempo actual / 30 segundos
     * @return string|null
     */
    public static function calculateCode(string $secret, ?int $timeSlice = null): ?string {
        if ($timeSlice === null) {
            $timeSlice = (int) floor(time() / 30);
        }
        $secretBin = self::base32Decode($secret);
        if (empty($secretBin)) return null;

        // Contador de tiempo de 8 bytes en formato Big-Endian
        $timeBin = pack('N*', 0) . pack('N*', $timeSlice);
        $hmac = hash_hmac('sha1', $timeBin, $secretBin, true);

        // Truncamiento dinámico (RFC 4226)
        $offset = ord(substr($hmac, -1)) & 0x0F;
        $part = substr($hmac, $offset, 4);
        $unpacked = unpack('N', $part);
        $num = $unpacked[1] & 0x7FFFFFFF;

        return str_pad((string) ($num % 1000000), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Verifica si un código de 6 dígitos ingresado por el usuario es válido
     * Admite una ventana de tolerancia de ±4 pasos (±120 segundos) para mitigar desfases de reloj
     * @param string $secret Secreto en Base32
     * @param string $code Código de 6 dígitos
     * @param int $discrepancy Tolerancia en pasos de 30s (por defecto 4 = ±120s)
     * @return bool
     */
    public static function verifyCode(string $secret, string $code, int $discrepancy = 4): bool {
        $code = trim($code);
        $code = preg_replace('/[^0-9]/', '', $code);
        if (strlen($code) !== 6) return false;

        $currentTimeSlice = (int) floor(time() / 30);
        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $expected = self::calculateCode($secret, $currentTimeSlice + $i);
            if ($expected !== null && hash_equals($expected, $code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Retorna los segundos restantes en el ciclo actual de 30 segundos
     * @return int 0..30
     */
    public static function getRemainingSeconds(): int {
        return 30 - (time() % 30);
    }

    /**
     * Genera la URI estandarizada otpauth:// reconocida por Google Authenticator
     * @param string $accountName Nombre del usuario o email
     * @param string $secret Secreto Base32
     * @param string $issuer Nombre del negocio emisor
     * @return string
     */
    public static function getOtpAuthUrl(string $accountName, string $secret, string $issuer = 'Parisienne'): string {
        $cleanIssuer = preg_replace('/[^A-Za-z0-9_-]/', '', $issuer) ?: 'Parisienne';
        $cleanAccount = preg_replace('/[^A-Za-z0-9_@.-]/', '', $accountName) ?: 'Usuario';
        return "otpauth://totp/{$cleanIssuer}:{$cleanAccount}?secret={$secret}&issuer={$cleanIssuer}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Formatea el secreto con espacios cada 4 caracteres para facilitar lectura humana
     * Ej: 2B4F VUW7 WVUE RJW
     * @param string $secret
     * @return string
     */
    public static function formatSecretReadable(string $secret): string {
        $clean = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret));
        return chunk_split($clean, 4, ' ');
    }
}
