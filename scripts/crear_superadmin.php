<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - SCRIPT DE CREACIÓN DE SEGUNDO SUPERADMINISTRADOR
   Crea o actualiza un nuevo superadmin en MySQL con BCRYPT y rol SUPERADMIN.
   ========================================================================== */

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../api/config/conexion.php';
require_once __DIR__ . '/../api/config/security.php';

try {
    $pdo = getDbConnection();

    $id = 'usr_superadmin2';
    $codigo = 'EMP-SUPER2';
    $username = 'superadmin2';
    $nombre = 'Super Administrador 2';
    $email = 'superadmin2@parisienne.com';
    $telefono = '(01) 555-SUPER2';
    $password = 'SuperAdmin2026*';
    $turno = 'Acceso Total 24/7';
    $icono = 'shield-check';
    $estado = 'active';

    // 1. Asegurar existencia del rol SUPERADMIN
    $stmtRole = $pdo->prepare("SELECT id FROM roles WHERE codigo = 'SUPERADMIN' OR id = 'rol_superadmin' LIMIT 1");
    $stmtRole->execute();
    $role = $stmtRole->fetch();

    if (!$role) {
        $pdo->exec("INSERT INTO roles (id, codigo, nombre, descripcion, redirect_url) VALUES 
            ('rol_superadmin', 'SUPERADMIN', 'Super Administrador', 'Acceso total e irrestricto a todos los módulos y funciones del sistema.', 'modules/dashboard.html')");
        $rolId = 'rol_superadmin';
    } else {
        $rolId = $role['id'];
    }

    // 2. Hash seguro BCRYPT
    $hashedPin = security_hash_password($password);

    // 3. Insertar o actualizar usuario
    $sql = "INSERT INTO usuarios (id, rol_id, codigo, username, nombre, email, telefono, pin, icono, turno, estado)
            VALUES (:id, :rol_id, :codigo, :username, :nombre, :email, :telefono, :pin, :icono, :turno, :estado)
            ON DUPLICATE KEY UPDATE 
                rol_id = VALUES(rol_id),
                codigo = VALUES(codigo),
                username = VALUES(username),
                nombre = VALUES(nombre),
                email = VALUES(email),
                telefono = VALUES(telefono),
                pin = VALUES(pin),
                icono = VALUES(icono),
                turno = VALUES(turno),
                estado = VALUES(estado)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':rol_id' => $rolId,
        ':codigo' => $codigo,
        ':username' => $username,
        ':nombre' => $nombre,
        ':email' => $email,
        ':telefono' => $telefono,
        ':pin' => $hashedPin,
        ':icono' => $icono,
        ':turno' => $turno,
        ':estado' => $estado
    ]);

    echo "====================================================\n";
    echo "¡SUPERADMINISTRADOR CREADO / ACTUALIZADO CON ÉXITO!\n";
    echo "====================================================\n";
    echo "ID:            {$id}\n";
    echo "Código:        {$codigo}\n";
    echo "Usuario:       {$username}\n";
    echo "Nombre:        {$nombre}\n";
    echo "Email:         {$email}\n";
    echo "Rol:           SUPERADMIN (rol_id: {$rolId})\n";
    echo "Contraseña:    {$password}\n";
    echo "Estado:        {$estado}\n";
    echo "Hash BCRYPT:   {$hashedPin}\n";
    echo "====================================================\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
