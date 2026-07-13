<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class GenerateApiToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:token {name : El nombre que identificará a este token (ej. "proyecto-interfaz")} {--email= : Opcional, el email del usuario administrador al que se asignará}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Genera un token de API dinámico de Sanctum para usar en las consultas de datos externas.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email');

        if ($email) {
            $user = User::where('email', $email)->first();
        } else {
            // Ponytail mode: Asigna el token al primer admin o usuario del sistema si no se especifica
            $user = User::where('rol', 'admin')->orWhere('rol', 'superadmin')->first() ?? User::first();
        }

        if (!$user) {
            $this->error("No se encontró ningún usuario en el sistema para asociar el token.");
            return;
        }

        $tokenName = $this->argument('name');
        
        $token = $user->createToken($tokenName);

        $this->info("Token dinámico generado exitosamente para el usuario: {$user->email}");
        $this->warn("=======================================================================");
        $this->warn("IMPORTANTE: Copia y guarda este token ahora. No se volverá a mostrar.");
        $this->warn("=======================================================================");
        $this->line($token->plainTextToken);
        $this->line("");
    }
}
