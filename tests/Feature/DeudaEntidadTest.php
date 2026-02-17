<?php

namespace Tests\Feature;

use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Models\Entidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeudaEntidadTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Entidad $entidad;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear usuario
        $this->user = User::factory()->create();

        // Crear entidad
        $this->entidad = Entidad::factory()->create([
            'user_id' => $this->user->id,
            'estado' => 'activa',
        ]);
    }

    /**
     * Test: Crear deuda de entidad CON datos SIAF
     */
    public function test_crear_deuda_entidad_con_datos_siaf()
    {
        $datos = [
            'entidad_id' => $this->entidad->id,
            'descripcion' => 'Factura por servicios profesionales',
            'orden_compra' => 'OC-2026-001',
            'fecha_emision' => '2026-02-16',
            'producto_servicio' => 'Servicios de consultoría',
            'monto_total' => 12312.00,
            'codigo_siaf' => '1273',
            'fecha_limite_pago' => '2026-03-26',
            'currency_code' => 'PEN',
            'notas' => 'Prueba de creación con SIAF',
            'estado_siaf' => 'C',
            'fase_siaf' => 'CI',
            'estado_expediente' => 'EN PROCESO',
            'fecha_proceso' => '2025-12-22',
        ];

        // Hacer POST al endpoint
        $response = $this->actingAs($this->user)->post('/deudas/entidad', $datos);

        // Verificar que se redirige a index
        $response->assertRedirect('/deudas');

        // Obtener la deuda creada
        $deuda = Deuda::where('descripcion', 'Factura por servicios profesionales')->first();
        $this->assertNotNull($deuda, 'Deuda no fue creada');

        // Obtener DeudaEntidad
        $deudaEntidad = DeudaEntidad::where('deuda_id', $deuda->id)->first();
        $this->assertNotNull($deudaEntidad, 'DeudaEntidad no fue creada');

        // Verificación
        echo "\n\n=================== TEST RESULT ===================\n";
        echo "Input SIAF:\n";
        echo "  estado_siaf: {$datos['estado_siaf']}\n";
        echo "  fase_siaf: {$datos['fase_siaf']}\n";
        echo "  estado_expediente: {$datos['estado_expediente']}\n";
        echo "  fecha_proceso: {$datos['fecha_proceso']}\n\n";

        echo "Saved in Database:\n";
        echo "  estado_siaf: '{$deudaEntidad->estado_siaf}'\n";
        echo "  fase_siaf: '{$deudaEntidad->fase_siaf}'\n";
        echo "  estado_expediente: '{$deudaEntidad->estado_expediente}'\n";
        echo "  fecha_proceso: '{$deudaEntidad->fecha_proceso}'\n";
        echo "====================================================\n\n";

        // Assertions
        $this->assertEquals('C', $deudaEntidad->estado_siaf);
        $this->assertEquals('CI', $deudaEntidad->fase_siaf);
    }
}

