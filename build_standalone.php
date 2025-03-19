<?php

$html = file_get_contents('index.html');
$filetypes = array(
    'svg'      => 'data:image/svg+xml',
    'woff2'    => 'data:font/woff2',
    'mp3'      => 'data:audio/mp3',
    'css'      => 'data:text/css',
    'manifest' => 'data:application/manifest+json',
);

preg_match_all('%"assets/(.+?)\.(.+?)"%sm', $html, $result, PREG_PATTERN_ORDER);
foreach ($result[0] as $key => $filename) {
    $file = file_get_contents(__DIR__ . '/assets/' . $result[1][$key] . '.' . $result[2][$key]);
    $base = '"'.$filetypes[$result[2][$key]].';base64,'.base64_encode($file).'"';
    $html = str_replace($filename, $base, $html);
}
file_put_contents('tima_standalone.html', $html);