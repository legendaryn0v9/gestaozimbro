<?php
/**
 * Simple file-based branding settings store.
 * Stores ONLY URLs/paths (never file bytes) in JSON.
 */

function branding_settings_path() {
    $dir = __DIR__ . '/../storage';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir . '/branding.json';
}

function branding_get_settings() {
    $path = branding_settings_path();
    if (!file_exists($path)) {
        return [
            'dashboard_logo_url' => null,
            'login_logo_url' => null,
            'system_name' => 'Sistema Zimbro',
            'updated_at' => null,
        ];
    }

    $raw = @file_get_contents($path);
    if ($raw === false) {
        return [
            'dashboard_logo_url' => null,
            'login_logo_url' => null,
            'system_name' => 'Sistema Zimbro',
            'updated_at' => null,
        ];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return [
            'dashboard_logo_url' => null,
            'login_logo_url' => null,
            'system_name' => 'Sistema Zimbro',
            'updated_at' => null,
        ];
    }

    return [
        'dashboard_logo_url' => $data['dashboard_logo_url'] ?? null,
        'login_logo_url' => $data['login_logo_url'] ?? null,
        'system_name' => $data['system_name'] ?? 'Sistema Zimbro',
        'updated_at' => $data['updated_at'] ?? null,
    ];
}

function branding_save_settings($settings) {
    $current = branding_get_settings();

    $next = [
        'dashboard_logo_url' => array_key_exists('dashboard_logo_url', $settings) ? $settings['dashboard_logo_url'] : ($current['dashboard_logo_url'] ?? null),
        'login_logo_url' => array_key_exists('login_logo_url', $settings) ? $settings['login_logo_url'] : ($current['login_logo_url'] ?? null),
        'system_name' => array_key_exists('system_name', $settings) ? $settings['system_name'] : ($current['system_name'] ?? 'Sistema Zimbro'),
        'updated_at' => date('c'),
    ];

    $path = branding_settings_path();
    $json = json_encode($next, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }

    return @file_put_contents($path, $json) !== false;
}
