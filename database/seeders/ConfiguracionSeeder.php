<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConfiguracionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('configuraciones')->insert([
            [
                'key' => 'app_currency',
                'value' => 'PEN',
                'descripcion' => 'Moneda por defecto del sistema',
                'tipo' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'app_currency_symbol',
                'value' => 'S/',
                'descripcion' => 'Símbolo de la moneda por defecto',
                'tipo' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'app_timezone',
                'value' => 'America/Lima',
                'descripcion' => 'Zona horaria del sistema',
                'tipo' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
