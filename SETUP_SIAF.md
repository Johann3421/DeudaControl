# Configuración Endpoint SIAF

## Archivos Creados/Modificados

### 1. **Servicio SIAF** (`app/Services/SiafService.php`)
- Genera CAPTCHA simple con código aleatorio
- Valida el CAPTCHA ingresado
- Consulta el servicio SIAF externo (con fallback a datos simulados)
- Métodos principales:
  - `generarCaptcha()`: Crea una imagen PNG con código aleatorio
  - `validarCaptcha()`: Valida el código ingresado
  - `consultarExpediente()`: Consulta SIAF y retorna datos

### 2. **Controlador SIAF** (`app/Http/Controllers/SiafController.php`)
- **GET `/api/captcha`**: Genera y retorna una imagen CAPTCHA
  - Respuesta: `{ success: true, captcha: "data:image/png;base64,..." }`

- **POST `/api/siaf/consultar`**: Consulta el SIAF
  - Parámetros requeridos:
    - `anoEje`: Año de ejecución (4 dígitos)
    - `secEjec`: Código de unidad ejecutora (máx 6 dígitos)
    - `expediente`: Número de expediente (máx 10 dígitos)
    - `j_captcha`: Código CAPTCHA ingresado (máx 5 caracteres)
    - `codigo_siaf`: Código SIAF del proyecto (máx 50 caracteres)
  
  - Respuesta exitosa:
  ```json
  {
    "success": true,
    "data": {
      "codigo_siaf": "2024000001",
      "descripcion": "...",
      "producto_servicio": "...",
      "monto_total": 50000.00,
      ...
    },
    "message": "Datos obtenidos correctamente"
  }
  ```

### 3. **Rutas** (`routes/web.php`)
Se agregaron las nuevas rutas API dentro del middleware de autenticación:
```php
Route::prefix('api')->group(function () {
    Route::get('/captcha', [SiafController::class, 'generarCaptcha']);
    Route::post('/siaf/consultar', [SiafController::class, 'consultar']);
});
```

### 4. **Componente React** (`resources/js/Pages/Deudas/Entidad/Create.jsx`)
Se actualizó para:
- Mostrar un botón "Buscar" junto al campo Código SIAF
- Desplegar formulario de búsqueda con:
  - Año de Ejecución (select)
  - Código de Unidad Ejecutora (input)
  - Número de Expediente (input)
  - CAPTCHA con opción para cambiar imagen
- Cargar datos automáticamente en el formulario principal tras búsqueda exitosa

## Características del CAPTCHA

- Genera código aleatorio de 5 caracteres (letras A-Z y números 0-9)
- Crea imagen PNG simple con ruido visual
- Se valida case-insensitive
- Se limpia de la sesión después de validar (éxito o fallo)
- Puede regenerarse ilimitadas veces
- No requiere dependencias externas

## Uso en Frontend

```javascript
// Cargar CAPTCHA
const response = await fetch('/api/captcha');
const data = await response.json();
// data.captcha contiene la imagen en base64

// Consultar SIAF
const response = await fetch('/api/siaf/consultar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        anoEje: '2024',
        secEjec: '001234',
        expediente: '2024000001',
        j_captcha: 'ABC12',
        codigo_siaf: '2024-001'
    })
});
```

## Testing

Para probar en desarrollo:
1. Navegar a Crear Deuda - Entidad
2. Ingresar un Código SIAF
3. Hacer clic en "Buscar"
4. Completar el formulario con datos de prueba
5. Ingresar el código que aparece en la imagen CAPTCHA
6. Hacer clic en "Consultar SIAF"

Los datos se cargarán automáticamente en los campos correspondientes.

## Mejoras Futuras

- Implementar parsing real de respuesta HTML del SIAF
- Agregar caché de consultas
- Implementar rate limiting
- Agregar logs de consultas exitosas/fallidas
- Mejorar la imagen CAPTCHA con distorsión más realista
