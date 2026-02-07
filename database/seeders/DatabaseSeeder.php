<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Deuda;
use App\Models\Movimiento;
use App\Models\Pago;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@deudacontrol.com',
            'password' => Hash::make('password'),
            'rol' => 'admin',
        ]);

        $clientes = [
            ['nombre' => 'Carlos', 'apellido' => 'Martinez', 'cedula' => '001-1234567-8', 'telefono' => '809-555-0101', 'email' => 'carlos@email.com', 'direccion' => 'Calle Principal #45, Santo Domingo'],
            ['nombre' => 'Maria', 'apellido' => 'Rodriguez', 'cedula' => '001-2345678-9', 'telefono' => '809-555-0202', 'email' => 'maria@email.com', 'direccion' => 'Av. Independencia #120'],
            ['nombre' => 'Juan', 'apellido' => 'Perez', 'cedula' => '001-3456789-0', 'telefono' => '809-555-0303', 'email' => 'juan@email.com', 'direccion' => 'Los Jardines, Santiago'],
            ['nombre' => 'Ana', 'apellido' => 'Garcia', 'cedula' => '001-4567890-1', 'telefono' => '809-555-0404', 'email' => 'ana@email.com', 'direccion' => 'Calle 5 #78, La Romana'],
            ['nombre' => 'Pedro', 'apellido' => 'Lopez', 'cedula' => '001-5678901-2', 'telefono' => '809-555-0505', 'direccion' => 'Av. 27 de Febrero #200'],
        ];

        foreach ($clientes as $data) {
            $data['user_id'] = $admin->id;
            Cliente::create($data);
        }

        $deudas = [
            ['cliente_id' => 1, 'descripcion' => 'Prestamo personal', 'monto_total' => 50000, 'monto_pendiente' => 35000, 'tasa_interes' => 5, 'fecha_inicio' => '2026-01-15', 'fecha_vencimiento' => '2026-07-15', 'estado' => 'activa', 'frecuencia_pago' => 'mensual', 'numero_cuotas' => 6],
            ['cliente_id' => 1, 'descripcion' => 'Compra de laptop', 'monto_total' => 25000, 'monto_pendiente' => 0, 'tasa_interes' => 0, 'fecha_inicio' => '2025-11-01', 'fecha_vencimiento' => '2026-02-01', 'estado' => 'pagada', 'frecuencia_pago' => 'mensual', 'numero_cuotas' => 3],
            ['cliente_id' => 2, 'descripcion' => 'Prestamo para negocio', 'monto_total' => 100000, 'monto_pendiente' => 75000, 'tasa_interes' => 8, 'fecha_inicio' => '2026-01-01', 'fecha_vencimiento' => '2026-12-31', 'estado' => 'activa', 'frecuencia_pago' => 'mensual', 'numero_cuotas' => 12],
            ['cliente_id' => 3, 'descripcion' => 'Compra de vehiculo', 'monto_total' => 200000, 'monto_pendiente' => 200000, 'tasa_interes' => 10, 'fecha_inicio' => '2026-02-01', 'fecha_vencimiento' => '2027-02-01', 'estado' => 'activa', 'frecuencia_pago' => 'mensual', 'numero_cuotas' => 12],
            ['cliente_id' => 4, 'descripcion' => 'Remodelacion de casa', 'monto_total' => 80000, 'monto_pendiente' => 80000, 'tasa_interes' => 3, 'fecha_inicio' => '2025-12-01', 'fecha_vencimiento' => '2026-01-31', 'estado' => 'vencida', 'frecuencia_pago' => 'unico'],
            ['cliente_id' => 5, 'descripcion' => 'Capital de trabajo', 'monto_total' => 30000, 'monto_pendiente' => 15000, 'tasa_interes' => 6, 'fecha_inicio' => '2026-01-10', 'fecha_vencimiento' => '2026-04-10', 'estado' => 'activa', 'frecuencia_pago' => 'quincenal'],
        ];

        foreach ($deudas as $data) {
            $data['user_id'] = $admin->id;
            $deuda = Deuda::create($data);

            Movimiento::create([
                'user_id' => $admin->id,
                'tipo' => 'prestamo_otorgado',
                'referencia_tipo' => 'deuda',
                'referencia_id' => $deuda->id,
                'monto' => $deuda->monto_total,
                'descripcion' => "Prestamo otorgado: {$deuda->descripcion}",
            ]);
        }

        $pagos = [
            ['deuda_id' => 1, 'monto' => 8500, 'fecha_pago' => '2026-02-01', 'metodo_pago' => 'transferencia', 'referencia' => 'TRF-001'],
            ['deuda_id' => 1, 'monto' => 6500, 'fecha_pago' => '2026-02-05', 'metodo_pago' => 'efectivo'],
            ['deuda_id' => 2, 'monto' => 10000, 'fecha_pago' => '2025-12-01', 'metodo_pago' => 'transferencia', 'referencia' => 'TRF-002'],
            ['deuda_id' => 2, 'monto' => 10000, 'fecha_pago' => '2026-01-01', 'metodo_pago' => 'efectivo'],
            ['deuda_id' => 2, 'monto' => 5000, 'fecha_pago' => '2026-02-01', 'metodo_pago' => 'tarjeta', 'referencia' => 'TC-100'],
            ['deuda_id' => 3, 'monto' => 25000, 'fecha_pago' => '2026-02-01', 'metodo_pago' => 'cheque', 'referencia' => 'CHQ-450'],
            ['deuda_id' => 6, 'monto' => 7500, 'fecha_pago' => '2026-01-25', 'metodo_pago' => 'efectivo'],
            ['deuda_id' => 6, 'monto' => 7500, 'fecha_pago' => '2026-02-07', 'metodo_pago' => 'transferencia', 'referencia' => 'TRF-010'],
        ];

        foreach ($pagos as $data) {
            $pago = Pago::create($data);

            $deuda = Deuda::find($data['deuda_id']);
            Movimiento::create([
                'user_id' => $admin->id,
                'tipo' => 'pago_recibido',
                'referencia_tipo' => 'pago',
                'referencia_id' => $pago->id,
                'monto' => $pago->monto,
                'descripcion' => "Pago recibido - {$deuda->descripcion}",
            ]);
        }
    }
}
