<?php
$pcTime = time();
echo "PC Time: " . date('Y-m-d H:i:s', $pcTime) . " (timestamp: $pcTime)\n";

$ctx = stream_context_create(['http' => ['method' => 'HEAD', 'timeout' => 3]]);
$headers = @get_headers('http://www.google.com', false, $ctx);
if ($headers) {
    foreach ($headers as $h) {
        if (stripos($h, 'Date:') !== false) {
            echo "Internet HTTP Date: $h\n";
            $netTimestamp = strtotime(trim(str_ireplace('Date:', '', $h)));
            echo "Internet Timestamp: $netTimestamp\n";
            $diff = $pcTime - $netTimestamp;
            echo "Difference (PC - Internet): $diff seconds (" . round($diff / 86400) . " days)\n";
        }
    }
} else {
    echo "No internet response.\n";
}
