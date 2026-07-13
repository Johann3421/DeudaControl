<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Vincular WhatsApp - Control de Deudas</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --card-bg: rgba(30, 41, 59, 0.7);
            --card-border: rgba(255, 255, 255, 0.08);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent: #10b981; /* WhatsApp Emerald */
            --accent-hover: #059669;
            --input-bg: rgba(15, 23, 42, 0.6);
            --input-border: rgba(255, 255, 255, 0.1);
            --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-gradient);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 480px;
            perspective: 1000px;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 24px;
            padding: 40px 30px;
            box-shadow: var(--shadow);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo-icon {
            width: 64px;
            height: 64px;
            background: rgba(16, 185, 129, 0.1);
            border: 2px solid var(--accent);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .logo-icon svg {
            width: 32px;
            height: 32px;
            fill: var(--accent);
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 14px;
            color: var(--text-secondary);
            text-align: center;
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
            position: relative;
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input {
            width: 100%;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 12px;
            padding: 14px 16px;
            font-family: inherit;
            font-size: 16px;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }

        input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
            background: rgba(15, 23, 42, 0.8);
        }

        .input-hint {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 6px;
            display: block;
        }

        .btn {
            width: 100%;
            background: var(--accent);
            border: none;
            border-radius: 12px;
            padding: 16px;
            font-family: inherit;
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 25px;
        }

        .btn:hover {
            background: var(--accent-hover);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn:disabled {
            background: #475569;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .spinner {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
            display: none;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Panel de Código (Oculto inicialmente) */
        .result-panel {
            display: none;
            animation: fadeIn 0.5s ease forwards;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .code-display {
            background: rgba(15, 23, 42, 0.8);
            border: 1px dashed var(--accent);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            margin-bottom: 25px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .code-display:hover {
            background: rgba(15, 23, 42, 0.95);
            border-color: #34d399;
        }

        .code-value {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 4px;
            color: var(--accent);
            font-family: monospace;
            text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
        }

        .code-copy-text {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .instructions-list {
            list-style: none;
            counter-reset: steps;
        }

        .instruction-item {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-secondary);
        }

        .instruction-item strong {
            color: var(--text-primary);
        }

        .instruction-number {
            counter-increment: steps;
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--card-border);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: var(--accent);
        }

        .alert-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13px;
            margin-bottom: 20px;
            display: none;
            line-height: 1.4;
        }

        .success-checkmark {
            display: none;
            text-align: center;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes popIn {
            0% { transform: scale(0.6); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }

        .success-checkmark svg {
            width: 60px;
            height: 60px;
            fill: var(--accent);
            margin-bottom: 15px;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--card-border);
            color: var(--text-primary);
            margin-top: 15px;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            box-shadow: none;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="card">
        <div class="logo-container">
            <div class="logo-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.79-4.396c1.598.948 3.197 1.448 4.907 1.449 5.393 0 9.778-4.383 9.782-9.774a9.69 9.69 0 0 0-2.85-6.918 9.684 9.684 0 0 0-6.93-2.846c-5.4 0-9.784 4.385-9.788 9.776-.001 1.776.474 3.51 1.375 5.042L2.34 21.685l5.507-1.444zm11.758-6.113c-.279-.139-1.647-.812-1.9-.904-.253-.093-.437-.139-.621.139-.184.278-.714.904-.875 1.09-.161.185-.322.209-.601.069-.279-.139-1.18-.435-2.249-1.388-.831-.741-1.391-1.658-1.554-1.938-.163-.28-.017-.431.122-.57.125-.125.279-.325.419-.487.14-.163.187-.279.28-.465.093-.186.046-.349-.023-.488-.069-.139-.621-1.498-.85-2.055-.224-.54-.469-.465-.621-.473-.16-.008-.344-.01-.529-.01-.186 0-.488.07-.743.349-.256.279-.978.956-.978 2.332s1.002 2.705 1.141 2.891c.14.186 1.972 3.01 4.778 4.22.667.288 1.188.46 1.594.59.67.213 1.28.183 1.762.11.539-.08 1.647-.674 1.88-1.325.233-.65.233-1.207.162-1.325-.07-.116-.255-.185-.534-.325z"/>
                </svg>
            </div>
            <h1>Conectar WhatsApp</h1>
            <p class="subtitle">Vincula tu cuenta para activar la publicación automática en tus Estados.</p>
        </div>

        <!-- Alerta de Error -->
        <div id="errorAlert" class="alert-error"></div>

        <!-- Formulario Principal -->
        <form id="connectForm">
            <input type="hidden" id="methodInput" name="method" value="pairing">
            
            <div class="form-group">
                <label for="name">Nombre Completo</label>
                <input type="text" id="name" name="name" required placeholder="Ej. Juan Pérez" autocomplete="name">
                <small class="input-hint">Para identificarte en el panel administrativo.</small>
            </div>

            <div class="form-group">
                <label for="phone">Número de WhatsApp</label>
                <input type="tel" id="phone" name="phone" required placeholder="Ej. +51 999 888 777" autocomplete="tel">
                <small class="input-hint">Incluye el código de país (ej: 51 para Perú).</small>
            </div>

            <button type="submit" id="submitBtn" class="btn">
                <span>Generar Código</span>
                <div class="spinner" id="btnSpinner"></div>
            </button>
        </form>

        <!-- Panel de Resultado -->
        <div id="resultPanel" class="result-panel">
            <div class="code-display" id="codeBox" title="Click para copiar">
                <!-- Contenedor Pairing Code -->
                <div id="pairingCodeContainer">
                    <div class="code-value" id="pairingCode">---- ----</div>
                    <div class="code-copy-text" id="copyText">Copiar código</div>
                </div>
                <!-- Contenedor Código QR -->
                <div id="qrCodeContainer" style="display: none;">
                    <img id="qrImage" src="" alt="Código QR" style="max-width: 180px; display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
                    <div class="code-copy-text" style="margin-top: 12px;">Escanea este código con tu celular</div>
                </div>
            </div>

            <ul class="instructions-list" id="instructionsList">
                <li class="instruction-item">
                    <span class="instruction-number">1</span>
                    <div class="instruction-text">Abre <strong>WhatsApp</strong> en tu teléfono.</div>
                </li>
                <li class="instruction-item">
                    <span class="instruction-number">2</span>
                    <div class="instruction-text">Ve a <strong>Ajustes</strong> o <strong>Configuración</strong> > <strong>Dispositivos vinculados</strong>.</div>
                </li>
                <li class="instruction-item">
                    <span class="instruction-number">3</span>
                    <div class="instruction-text">Selecciona <strong>Vincular un dispositivo</strong>.</div>
                </li>
                <li class="instruction-item" id="instructionStep4">
                    <span class="instruction-number">4</span>
                    <div class="instruction-text">Toca en la opción inferior <strong>"Vincular con el número de teléfono"</strong> (no escanees QR).</div>
                </li>
                <li class="instruction-item" id="instructionStep5">
                    <span class="instruction-number">5</span>
                    <div class="instruction-text">Introduce el código de 8 caracteres que se muestra arriba.</div>
                </li>
            </ul>

            <div id="qrAlternativeBox" style="text-align: center; margin-top: 25px; font-size: 13px;">
                <a href="#" id="tryQrBtn" style="color: var(--accent); text-decoration: none; font-weight: 500; transition: color 0.3s;" onmouseover="this.style.color='#34d399'" onmouseout="this.style.color='var(--accent)'">¿El código se quedó "conectando"? Escanea un Código QR en su lugar</a>
            </div>

            <button type="button" id="resetBtn" class="btn btn-secondary">Generar otro código</button>
        </div>

        <!-- Éxito Final (Oculto) -->
        <div id="successPanel" class="success-checkmark">
            <svg viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 17l-5-5 1.414-1.414 3.586 3.586 7.586-7.586 1.414 1.414-9 9z"/>
            </svg>
            <h2>¡Conectado Exitosamente!</h2>
            <p class="subtitle" style="margin-bottom: 0; margin-top: 10px;">Tu cuenta ya está lista. Las imágenes aprobadas que se envíen al grupo se publicarán automáticamente en tu estado.</p>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('connectForm');
        const submitBtn = document.getElementById('submitBtn');
        const btnSpinner = document.getElementById('btnSpinner');
        const errorAlert = document.getElementById('errorAlert');
        const resultPanel = document.getElementById('resultPanel');
        const pairingCodeDisplay = document.getElementById('pairingCode');
        const resetBtn = document.getElementById('resetBtn');
        const codeBox = document.getElementById('codeBox');
        const copyText = document.getElementById('copyText');
        const successPanel = document.getElementById('successPanel');
        
        const methodInput = document.getElementById('methodInput');
        const tryQrBtn = document.getElementById('tryQrBtn');
        const pairingCodeContainer = document.getElementById('pairingCodeContainer');
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        const qrImage = document.getElementById('qrImage');
        const qrAlternativeBox = document.getElementById('qrAlternativeBox');
        const instructionStep4 = document.getElementById('instructionStep4');
        const instructionStep5 = document.getElementById('instructionStep5');
        
        let checkStatusInterval = null;
        let activeInstance = null;


        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // UI State - Loading
            submitBtn.disabled = true;
            btnSpinner.style.display = 'block';
            errorAlert.style.display = 'none';

            const formData = new FormData(form);

            try {
                const response = await fetch('{{ route("whatsapp.pairing-code") }}', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                        'Accept': 'application/json'
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    if (data.already_connected) {
                        form.style.display = 'none';
                        successPanel.style.display = 'block';
                    } else {
                        form.style.display = 'none';
                        resultPanel.style.display = 'block';
                        activeInstance = data.instance;

                        if (data.qr) {
                            // Mostrar QR
                            pairingCodeContainer.style.display = 'none';
                            qrCodeContainer.style.display = 'block';
                            qrImage.src = data.qr;
                            qrAlternativeBox.style.display = 'none';
                            
                            // Ajustar instrucciones para QR
                            instructionStep4.style.display = 'none';
                            instructionStep5.style.display = 'none';
                            document.querySelector('#instructionsList li:nth-child(3) .instruction-text').innerHTML = 'Apunta la cámara de tu teléfono hacia el <strong>Código QR</strong> para escanearlo.';
                        } else {
                            // Mostrar Código de Vinculación
                            pairingCodeContainer.style.display = 'block';
                            qrCodeContainer.style.display = 'none';
                            pairingCodeDisplay.textContent = formatPairingCode(data.code);
                            qrAlternativeBox.style.display = 'block';
                            
                            // Ajustar instrucciones para código
                            instructionStep4.style.display = 'flex';
                            instructionStep5.style.display = 'flex';
                            document.querySelector('#instructionsList li:nth-child(3) .instruction-text').innerHTML = 'Selecciona <strong>Vincular un dispositivo</strong>.';
                        }

                        // Comenzar a monitorear si el usuario se conecta exitosamente
                        startPollingConnection(activeInstance);
                    }
                } else {
                    showError(data.message || 'Error al obtener el código. Inténtalo de nuevo.');
                }
            } catch (err) {
                showError('Error de red. Verifica tu conexión a internet.');
                console.error(err);
            } finally {
                submitBtn.disabled = false;
                btnSpinner.style.display = 'none';
            }
        });

        // Evento para cambiar al método de Código QR
        tryQrBtn.addEventListener('click', (e) => {
            e.preventDefault();
            methodInput.value = 'qr';
            // Simular submit para volver a consultar la API
            submitBtn.click();
        });

        // Formatea el código de ABCD1234 a ABCD-1234
        function formatPairingCode(code) {
            if (!code) return '';
            const cleaned = code.replace(/[^a-zA-Z0-9]/g, '');
            if (cleaned.length === 8) {
                return cleaned.substring(0, 4) + '-' + cleaned.substring(4);
            }
            return code;
        }

        function showError(msg) {
            errorAlert.textContent = msg;
            errorAlert.style.display = 'block';
        }

        // Copiar al portapapeles
        codeBox.addEventListener('click', () => {
            if (methodInput.value === 'qr') return; // Desactivar copia en modo QR
            const rawCode = pairingCodeDisplay.textContent.replace('-', '');
            navigator.clipboard.writeText(rawCode).then(() => {
                copyText.textContent = '¡Copiado!';
                copyText.style.color = '#10b981';
                setTimeout(() => {
                    copyText.textContent = 'Copiar código';
                    copyText.style.color = '#94a3b8';
                }, 2000);
            }).catch(err => {
                console.error('Error al copiar: ', err);
            });
        });

        resetBtn.addEventListener('click', () => {
            clearInterval(checkStatusInterval);
            methodInput.value = 'pairing';
            resultPanel.style.display = 'none';
            form.style.display = 'block';
            form.reset();
        });


        // Polling para chequear si el vendedor finalizó la vinculación
        function startPollingConnection(instanceName) {
            if (checkStatusInterval) clearInterval(checkStatusInterval);
            
            // Cada 3 segundos verificamos el estado en el backend
            checkStatusInterval = setInterval(async () => {
                try {
                    const response = await fetch(`{{ url('/api/whatsapp/active-instances') }}?token={{ urlencode('Rd2GcVzGM3Bh8j0V+2XCriMqsdWqSSWv8mmdPyL8eMY=') }}`);
                    if (response.ok) {
                        const instances = await response.json();
                        // Buscar si la instancia actual está conectada
                        const connected = instances.some(inst => inst.instance_name === instanceName && inst.status === 'connected');
                        
                        if (connected) {
                            clearInterval(checkStatusInterval);
                            resultPanel.style.display = 'none';
                            successPanel.style.display = 'block';
                        }
                    }
                } catch (e) {
                    console.error('Error polling connection state: ', e);
                }
            }, 3000);
        }
    });
</script>
</body>
</html>
