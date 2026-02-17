<?php

// Script de diagnóstico - Ejecutar manualmente
// php artisan tinker < diagnostic.php

use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Models\Entidad;
use App\Models\User;

echo "\n\n========== PRUEBA DE DATOS SIAF ==========\n\n";

// Crear usuario de prueba con email único
$timestamp = now()->timestamp;
$user = User::create([
    'name' => 'Test User ' . $timestamp,
    'email' => 'test' . $timestamp . '@example.com',
    'password' => bcrypt('password'),
    'rol' => 'admin',
]);
echo "✓ Usuario creado: {$user->id}\n";

// Crear entidad de prueba
$entidad = Entidad::create([
    'user_id' => $user->id,
    'razon_social' => 'Empresa Test',
    'ruc' => '20123456789',
    'tipo' => 'publica',
    'estado' => 'activa',
    'direccion' => 'Jr. Test 123',
]);
echo "✓ Entidad creada: {$entidad->id}\n";

// Datos a enviar (simulando lo que envía el formulario)
$datos = [
    'entidad_id' => $entidad->id,
    'descripcion' => 'Prueba con SIAF',
    'orden_compra' => 'OC-2026-TEST',
    'fecha_emision' => '2026-02-16',
    'producto_servicio' => 'Test Servicio',
    'monto_total' => 5000.00,
    'codigo_siaf' => '1273',
    'fecha_limite_pago' => '2026-03-26',
    'currency_code' => 'PEN',
    'notas' => 'Prueba',
    'estado_siaf' => 'C',
    'fase_siaf' => 'CI',
    'estado_expediente' => 'EN PROCESO',
    'fecha_proceso' => '2025-12-22',
];

echo "\n📋 Datos enviados:\n";
echo json_encode($datos, JSON_PRETTY_PRINT) . "\n";

// Crear deuda como lo haría el controller
Auth::setUser($user);

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
echo "\n✓ Deuda creada: {$deuda->id}\n";

// Crear DeudaEntidad
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
echo "✓ DeudaEntidad creada: {$deudaEntidad->id}\n";

// Recargar del BD
$deudaEntidad->refresh();

echo "\n📦 Datos guarddados en BD:\n";
echo "  estado_siaf: '{$deudaEntidad->estado_siaf}' (esperado: 'C')\n";
echo "  fase_siaf: '{$deudaEntidad->fase_siaf}' (esperado: 'CI')\n";
echo "  estado_expediente: '{$deudaEntidad->estado_expediente}' (esperado: 'EN PROCESO')\n";
echo "  fecha_proceso: '{$deudaEntidad->fecha_proceso}' (esperado: '2025-12-22')\n";

// Verificar
if ($deudaEntidad->estado_siaf === 'C' &&
    $deudaEntidad->fase_siaf === 'CI' &&
    $deudaEntidad->estado_expediente === 'EN PROCESO' &&
    ($deudaEntidad->fecha_proceso?->format('Y-m-d') === '2025-12-22' || $deudaEntidad->fecha_proceso === '2025-12-22')) {
    echo "\n✅ ÉXITO - Los datos se guardaron correctamente\n";
} else {
    echo "\n❌ ERROR - Los datos NO se guardaron correctamente\n";
}

// Verificar que aparezcan en el Index
echo "\n📊 Verificando relaciones:\n";
echo "  Deuda tipo_deuda: {$deuda->tipo_deuda}\n";
echo "  Deuda.id: {$deuda->id}\n";

$deudasEnIndex = Deuda::with(['deudaEntidad.entidad'])->where('id', $deuda->id)->first();
echo "\n  Query result con with:\n";
echo "    deuda_entidad: " . ($deudasEnIndex->deuda_entidad ? "EXISTE" : "NULO") . "\n";

if ($deudasEnIndex->deuda_entidad) {
    echo "    estado_siaf: '{$deudasEnIndex->deuda_entidad->estado_siaf}'\n";
} else {
    // Intentar sin with
    $deudasSinWith = Deuda::find($deuda->id);
    echo "\n  Sin with - Intentando cargar relación manualmente:\n";
    $relacion = $deudasSinWith->deudaEntidad;
    echo "    deuda_entidad: " . ($relacion ? "EXISTE" : "NULO") . "\n";
    if ($relacion) {
        echo "    estado_siaf: '{$relacion->estado_siaf}'\n";
    }
}

// Intentar cargar directamente
echo "\n  Cargando DeudaEntidad donde deuda_id={$deuda->id}:\n";
$deudasDirecto = DeudaEntidad::where('deuda_id', $deuda->id)->first();
if ($deudasDirecto) {
    echo "    ENCONTRADO - estado_siaf: '{$deudasDirecto->estado_siaf}'\n";
} else {
    echo "    NO ENCONTRADO\n";
}

echo "\n==========================================\n\n";
