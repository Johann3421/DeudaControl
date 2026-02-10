<?php

namespace App\Services;

use App\Models\Configuracion;

class ConfiguracionService
{
    /**
     * Obtiene una configuración por su clave
     *
     * @param string $key La clave de la configuración
     * @param mixed $default Valor por defecto si no existe
     * @return mixed El valor de la configuración
     */
    public static function get($key, $default = null)
    {
        $config = Configuracion::where('key', $key)->first();

        if (!$config) {
            return $default ?? config("currency.{$key}", env(strtoupper($key)));
        }

        // Convertir el valor según su tipo
        return self::castValue($config->value, $config->tipo);
    }

    /**
     * Establece una configuración
     *
     * @param string $key La clave de la configuración
     * @param mixed $value El valor a guardar
     * @param string $tipo El tipo de valor
     * @param string|null $descripcion Descripción opcional
     */
    public static function set($key, $value, $tipo = 'string', $descripcion = null)
    {
        return Configuracion::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value) : (string) $value,
                'tipo' => $tipo,
                'descripcion' => $descripcion,
            ]
        );
    }

    /**
     * Obtiene todas las configuraciones
     *
     * @return array
     */
    public static function all()
    {
        return Configuracion::all()->mapWithKeys(function ($config) {
            return [$config->key => self::castValue($config->value, $config->tipo)];
        })->toArray();
    }

    /**
     * Castea un valor según su tipo
     *
     * @param mixed $value El valor a castear
     * @param string $tipo El tipo de valor
     * @return mixed
     */
    private static function castValue($value, $tipo)
    {
        return match ($tipo) {
            'integer' => (int) $value,
            'boolean' => $value === '1' || $value === 'true',
            'json' => json_decode($value, true),
            default => $value,
        };
    }
}
