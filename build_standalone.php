<?php

$html = file_get_contents('index.html');
$filetypes = array(
    'svg'      => 'image/svg+xml',
    'woff2'    => 'font/woff2',
    'mp3'      => 'audio/mp3',
    'css'      => 'text/css',
    'manifest' => 'application/manifest+json',
    'js'       => 'text/javascript',
);

preg_match_all('%"assets/(.+?)\.(.+?)"%sm', $html, $result, PREG_PATTERN_ORDER);
foreach ($result[0] as $key => $filename) {
    $file = file_get_contents(__DIR__ . '/assets/' . $result[1][$key] . '.' . $result[2][$key]);
    $base = '"data:'.$filetypes[$result[2][$key]].';base64,'.base64_encode($file).'"';
    $html = str_replace($filename, $base, $html);
}
file_put_contents('tima_standalone.html', $html);