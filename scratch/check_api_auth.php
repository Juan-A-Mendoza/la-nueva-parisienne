<?php
$files = glob(__DIR__ . '/../api/**/*.php');
$results = [];
foreach ($files as $file) {
    $content = file_get_contents($file);
    $rel = str_replace(realpath(__DIR__ . '/../') . DIRECTORY_SEPARATOR, '', realpath($file));
    $hasPublic = strpos($content, 'LNP_PUBLIC') !== false;
    $hasRequireAuth = strpos($content, 'require_auth') !== false;
    $results[] = [
        'file' => $rel,
        'has_public' => $hasPublic,
        'has_require_auth' => $hasRequireAuth
    ];
}
foreach ($results as $r) {
    if (!$r['has_public']) {
        echo "NON-PUBLIC: {$r['file']} (RequireAuth: " . ($r['has_require_auth'] ? 'yes' : 'auto via conexion.php') . ")\n";
    }
}
