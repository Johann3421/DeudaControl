<?php

namespace App\Console\Commands;

use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Models\Entidad;
use App\Models\User;
use Illuminate\Console\Command;

class DiagnosticsCommand extends Command
{
    protected $signature = 'diagnostics:siaf';
    protected $description = 'Diagnose SIAF data save and load issues';

    public function handle()
    {
        $this->line("\n\n========== DIAGNÓSTICO DE DATOS SIAF ==========\n");

        // Crear usuario
        $timestamp = now()->timestamp;
        $user = User::create([
            'name' => 'Diag User ' . $timestamp,
            'email' => 'diag' . $timestamp . '@example.com',
            'password' => bcrypt('password'),
            'rol' => 'admin',
        ]);
        $this->line("✓ Usuario creado: {$user->id}");

        // Crear entidad
        $entidad = Entidad::create([
            'user_id' => $user->id,
            'razon_social' => 'Empresa Diag ' . $timestamp,
            'ruc' => '20' . str_pad($timestamp, 9, '0', STR_PAD_LEFT),
            'tipo' => 'publica',
            'estado' => 'activa',
            'direccion' => 'Jr. Diag 123',
        ]);
        $this->line("✓ Entidad creada: {$entidad->id}");

        // Datos
        $datos = [
            'entidad_id' => $entidad->id,
            'descripcion' => 'Prueba SIAF - ' . $timestamp,
            'orden_compra' => 'OC-2026-' . $timestamp,
            'fecha_emision' => '2026-02-16',
            'producto_servicio' => 'Test Servicio',
            'monto_total' => 5000.00,
            'codigo_siaf' => '1273',
            'fecha_limite_pago' => '2026-03-26',
            'currency_code' => 'PEN',
            'notas' => 'Diagnóstico',
            'estado_siaf' => 'C',
            'fase_siaf' => 'CI',
            'estado_expediente' => 'EN PROCESO',
            'fecha_proceso' => '2025-12-22',
        ];

        $this->line("\n📋 Datos a guardar:\n");
        $this->line(json_encode($datos, JSON_PRETTY_PRINT));

        // Crear de forma manual (como lo hace el controller)
        $deuda = Deuda::create([
            'user_id' => $user->id,
            'tipo_deuda' => 'entidad',
            'cliente_id' => null,
            'descripcion' => $datos['descripcion'],
            'monto_total' => $datos['monto_total'],
            'monto_pendiente' => $datos['monto_total'],
            'tasa_interes' => 0,
            'fecha_inicio' => $datos['fecha_emision'],
            'fecha_vencimiento' => $datos['fecha_limite_pago'],
            'frecuencia_pago' => 'unico',
            'notas' => $datos['notas'],
            'currency_code' => $datos['currency_code'],
        ]);
        $this->line("\n✓ Deuda creada: {$deuda->id} (tipo: {$deuda->tipo_deuda})");

        $deudaEntidad = DeudaEntidad::create([
            'deuda_id' => $deuda->id,
            'entidad_id' => $datos['entidad_id'],
            'orden_compra' => $datos['orden_compra'],
            'fecha_emision' => $datos['fecha_emision'],
            'producto_servicio' => $datos['producto_servicio'],
            'codigo_siaf' => $datos['codigo_siaf'] ?? null,
            'fecha_limite_pago' => $datos['fecha_limite_pago'],
            'estado_seguimiento' => 'emitido',
            'estado_siaf' => $datos['estado_siaf'] ?? null,
            'fase_siaf' => $datos['fase_siaf'] ?? null,
            'estado_expediente' => $datos['estado_expediente'] ?? null,
            'fecha_proceso' => $datos['fecha_proceso'] ?? null,
        ]);
        $this->line("✓ DeudaEntidad creada: {$deudaEntidad->id}");

        // Reload
        $deudaEntidad->refresh();

        $this->line("\n📦 Datos en BD:");
        $this->line("  estado_siaf: '{$deudaEntidad->estado_siaf}'");
        $this->line("  fase_siaf: '{$deudaEntidad->fase_siaf}'");
        $this->line("  estado_expediente: '{$deudaEntidad->estado_expediente}'");
        $this->line("  fecha_proceso: '{$deudaEntidad->fecha_proceso}'");

        if ($deudaEntidad->estado_siaf === 'C' && $deudaEntidad->fase_siaf === 'CI') {
            $this->line("\n✅ Se guardó correctamente en BD");
        } else {
            $this->line("\n❌ Error: Los datos no se guardaron");
            return 1;
        }

        // Ahora probar las relaciones
        $this->line("\n📊 VERIFICANDO RELACIONES:");
        $this->line("  Deuda tipo_deuda: {$deuda->tipo_deuda}");
        $this->line("  Deuda.id: {$deuda->id}");

        // Test 1: Cargar con with
        $this->line("\n  Test 1: with(['deudaEntidad.entidad'])");
        $deudasConWith = Deuda::with(['deudaEntidad.entidad'])->where('id', $deuda->id)->first();
        if ($deudasConWith->deuda_entidad) {
            $this->line("    ✓ deuda_entidad EXISTE");
            $this->line("    estado_siaf: '{$deudasConWith->deuda_entidad->estado_siaf}'");
        } else {
            $this->line("    ✗ deuda_entidad es NULL");
        }

        // Test 1B: Solo deudaEntidad
        $this->line("\n  Test 1B: with(['deudaEntidad']) sin where");
        $deudasSoloRelacion = Deuda::with(['deudaEntidad'])->get()->where('id', $deuda->id)->first();
        if ($deudasSoloRelacion && $deudasSoloRelacion->deuda_entidad) {
            $this->line("    ✓ deuda_entidad EXISTE");
            $this->line("    estado_siaf: '{$deudasSoloRelacion->deuda_entidad->estado_siaf}'");
        } else {
            $this->line("    ✗ deuda_entidad es NULL o Deuda no encontrada");
        }

        // Test 1C: Con callback (fixing)
        $this->line("\n  Test 1C: with callback");
        $deudasCallbacks = Deuda::with([
            'deudaEntidad' => fn($q) => $q->with('entidad'),
        ])->where('id', $deuda->id)->first();
        if ($deudasCallbacks->deuda_entidad) {
            $this->line("    ✓ deuda_entidad EXISTE");
            $this->line("    estado_siaf: '{$deudasCallbacks->deuda_entidad->estado_siaf}'");
        } else {
            $this->line("    ✗ deuda_entidad es NULL");
        }

        // Test 2: Sin with
        $this->line("\n  Test 2: Sin with (acceso directo)");
        $deudasSinWith = Deuda::find($deuda->id);
        $relacion = $deudasSinWith->deudaEntidad;
        if ($relacion) {
            $this->line("    ✓ deuda_entidad EXISTE");
            $this->line("    estado_siaf: '{$relacion->estado_siaf}'");
        } else {
            $this->line("    ✗ deuda_entidad es NULL");
        }

        // Test 2B: Usando load() después (SOLUCIÓN)
        $this->line("\n  Test 2B: get() SIN with + load(['deudaEntidad.entidad'])");
        $deudasGet2 = Deuda::orderBy('created_at', 'desc')
            ->get();  // ← SIN with()

        // ← AQUÍ ES DONDE FUNCIONA: load() después de get() SIN with()
        $deudasGet2->load(['deudaEntidad.entidad']);

        $deudasEnGet2 = $deudasGet2->firstWhere('id', $deuda->id);

        if ($deudasEnGet2 && $deudasEnGet2->deuda_entidad) {
            $this->line("    ✓ deuda_entidad EXISTE");
            $this->line("    estado_siaf: '{$deudasEnGet2->deuda_entidad->estado_siaf}'");
            $this->line("    fase_siaf: '{$deudasEnGet2->deuda_entidad->fase_siaf}'");
            $this->line("    entidad: '{$deudasEnGet2->deuda_entidad->entidad?->razon_social}'");
        } else {
            $this->line("    ✗ NO ENCONTRADO o deuda_entidad es NULL");
            if ($deudasEnGet2) {
                $this->line("    Deuda encontrada: {$deudasEnGet2->id}");
                $this->line("    deuda_entidad: " . ($deudasEnGet2->deuda_entidad ? "EXISTS" : "NULL"));
            }
        }

        // Test 3: Query directo
        $this->line("\n  Test 3: DeudaEntidad::where() directo");
        $deudasDirecto = DeudaEntidad::where('deuda_id', $deuda->id)->first();
        if ($deudasDirecto) {
            $this->line("    ✓ ENCONTRADO");
            $this->line("    estado_siaf: '{$deudasDirecto->estado_siaf}'");
        } else {
            $this->line("    ✗ NO ENCONTRADO");
        }

        $this->line("\n==========================================\n");
    }
}
