<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('email', 'juliojauregui19@hotmail.com')
            ->update(['rol' => 'jefe']);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('email', 'juliojauregui19@hotmail.com')
            ->where('rol', 'jefe')
            ->update(['rol' => 'superadmin']);
    }
};
