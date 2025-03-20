<?php

// Lese den Inhalt der index.html Datei
$html = file_get_contents('index.html');

// Definiere die unterstützten Dateitypen und deren MIME-Typen
$filetypes = [
    'svg'      => 'image/svg+xml',
    'woff2'    => 'font/woff2',
    'mp3'      => 'audio/mp3',
    'css'      => 'text/css',
    'manifest' => 'application/manifest+json',
    'js'       => 'text/javascript',
];

// Finde alle Verweise auf Assets in index.html
preg_match_all('%"assets/(.+?)\.(.+?)"%sm', $html, $matches, PREG_SET_ORDER);

foreach ($matches as $match) {
    $filePath = __DIR__ . '/assets/' . $match[1] . '.' . $match[2];
    
    if (!file_exists($filePath)) {
        continue; // Datei existiert nicht, überspringen
    }
    
    $fileContent = file_get_contents($filePath);
    
    // Ersetze verschachtelte Asset-Referenzen durch Base64-Daten
    $fileContent = replaceAssetReferences($fileContent, $filetypes);
    
    // Konvertiere das Hauptasset in Base64
    $base64Data = '"data:' . ($filetypes[$match[2]] ?? 'application/octet-stream') . ';base64,' . base64_encode($fileContent) . '"';
    
    $html = str_replace($match[0], $base64Data, $html);
}

// Speichere die modifizierte HTML-Datei
file_put_contents('tima_standalone.html', $html);

/**
 * Funktion zum Ersetzen von Asset-Referenzen innerhalb von Dateien durch Base64-Daten
 */
function replaceAssetReferences($content, $filetypes)
{
    preg_match_all('%("assets/(.+?)\.(.+?)")|url\("(.+?)\.(.+?)"\)%sm', $content, $matches, PREG_SET_ORDER);
    
    foreach ($matches as $match) {
        $filename = !empty($match[2]) ? $match[2] : $match[4];
        $extension = !empty($match[3]) ? $match[3] : $match[5];

        $filePath = __DIR__ . '\assets\\' . $filename . '.' . $extension;

        if (!file_exists($filePath)) {
            continue;
        }
        
        $datastream = ($filetypes[$extension] ?? 'application/octet-stream') . ';base64,' . base64_encode(file_get_contents($filePath));
        $base64Data = ($match[1]) 
            ? '"data:' . $datastream. '"'
            : 'url("data:' . $datastream . '")';
        
        $content = str_replace($match[0], $base64Data, $content);
    }
    return $content;
}
