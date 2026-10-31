<?php
$hash = '$2y$10$jwa/slzZEcl7pDrjsKx7SepJ8aGbhmpChMm6tz4LBtJouXE/s5bly';
$candidates = ['admin', 'admin123', 'superadmin', '1234', '123456', 'superadmin123', 'Parisienne2026', 'Parisienne2026!'];
foreach ($candidates as $c) {
    if (password_verify($c, $hash)) {
        echo "MATCH: $c\n";
        exit;
    }
}
echo "NO MATCH\n";
