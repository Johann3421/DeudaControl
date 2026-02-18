<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeSuperadminCommand extends Command
{
    protected $signature = 'make:superadmin {email}';
    protected $description = 'Assign superadmin role to a user by email';

    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }
        
        $user->update(['rol' => 'superadmin']);
        
        $this->info("✓ User '{$email}' is now a superadmin!");
        return 0;
    }
}
