"""
Script para conectar Evolution API escaneando el QR.
Ejecutar: python get_qr.py
"""
import requests
import base64
import os
import tempfile
import json
import time

EVOLUTION_URL = "https://evolution.sekaitech.com.pe"
API_KEY = "6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c="
INSTANCE = "sekaitech"
HEADERS = {"apikey": API_KEY, "Content-Type": "application/json"}


def open_image(path):
    """Abre la imagen con el visor predeterminado de Windows."""
    os.startfile(path)


def save_and_show_qr(b64_string):
    """Decodifica el base64 del QR, lo guarda y lo abre como imagen."""
    # Eliminar el prefijo data:image/png;base64,
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png", prefix="whatsapp_qr_")
    tmp.write(img_bytes)
    tmp.close()
    print(f"  → QR guardado en: {tmp.name}")
    open_image(tmp.name)
    return tmp.name


def delete_instance():
    print("\n[1/3] Eliminando instancia anterior...")
    r = requests.delete(f"{EVOLUTION_URL}/instance/delete/{INSTANCE}", headers=HEADERS)
    print(f"  Respuesta: {r.status_code} {r.text[:100]}")


def create_instance():
    print("\n[2/3] Creando instancia nueva...")
    payload = {
        "instanceName": INSTANCE,
        "qrcode": True,
        "integration": "WHATSAPP-BAILEYS"
    }
    r = requests.post(f"{EVOLUTION_URL}/instance/create", headers=HEADERS, json=payload)
    if r.status_code not in (200, 201):
        print(f"  ERROR al crear: {r.status_code} {r.text}")
        return None
    data = r.json()
    print(f"  Instancia creada. Estado: {data.get('instance', {}).get('status', 'desconocido')}")
    return data


def get_fresh_qr():
    """Llama al endpoint connect para obtener un QR fresco."""
    r = requests.get(f"{EVOLUTION_URL}/instance/connect/{INSTANCE}", headers=HEADERS)
    if r.status_code != 200:
        print(f"  ERROR connect: {r.status_code} {r.text}")
        return None
    data = r.json()
    count = data.get("count", 0)
    if count > 0:
        b64list = data.get("base64", [])
        if b64list:
            return b64list[0]
    return None


def check_status():
    """Verifica si la instancia ya está conectada."""
    r = requests.get(f"{EVOLUTION_URL}/instance/fetchInstances", headers=HEADERS)
    instances = r.json()
    if isinstance(instances, list):
        for inst in instances:
            if inst.get("instance", {}).get("instanceName") == INSTANCE:
                state = inst.get("instance", {}).get("connectionStatus", "desconocido")
                return state
    return "no_encontrada"


# ── Flujo principal ──────────────────────────────────────────────────────────

print("=" * 55)
print("  WhatsApp QR Connector — Evolution API")
print("=" * 55)

# Verificar si ya está conectado
estado = check_status()
print(f"\nEstado actual de la instancia: {estado}")

if estado == "open":
    print("\n✅ La instancia YA ESTÁ CONECTADA a WhatsApp.")
    print("   Puedes proceder a crear el grupo directamente.")
else:
    # Limpiar y recrear
    delete_instance()
    time.sleep(2)
    data = create_instance()

    qr_shown = False

    # Intentar sacar QR del response de create
    if data:
        qr_obj = data.get("qrcode", {})
        b64 = qr_obj.get("base64") or qr_obj.get("qrcode")
        if b64:
            print("\n[3/3] QR obtenido del response de creación.")
            print("⚠️  TIENES ~45 SEGUNDOS PARA ESCANEARLO")
            save_and_show_qr(b64)
            qr_shown = True

    # Si no vino en el create, hacer polling con connect
    if not qr_shown:
        print("\n[3/3] Esperando generación de QR...")
        for intento in range(1, 7):
            time.sleep(3)
            b64 = get_fresh_qr()
            if b64:
                print(f"  QR obtenido (intento {intento}).")
                print("⚠️  TIENES ~45 SEGUNDOS PARA ESCANEARLO")
                save_and_show_qr(b64)
                qr_shown = True
                break
            else:
                print(f"  Intento {intento}/6: aún no hay QR...")

    if not qr_shown:
        print("\n❌ No se pudo obtener el QR. Verifica que Evolution API responde:")
        print(f"   curl {EVOLUTION_URL}/instance/fetchInstances -H 'apikey: {API_KEY}'")
    else:
        # Esperar y verificar conexión
        print("\nEsperando que escanees el QR...")
        for i in range(12):
            time.sleep(10)
            estado = check_status()
            print(f"  Estado ({(i+1)*10}s): {estado}")
            if estado == "open":
                print("\n✅ WhatsApp CONECTADO exitosamente.")
                break
            if i == 3:
                # A los 40 segundos, ofrecer QR fresco
                print("\n  El QR podría estar por expirar. Intentando obtener QR fresco...")
                b64 = get_fresh_qr()
                if b64:
                    save_and_show_qr(b64)
                    print("  ⚠️  Nuevo QR mostrado — escanéalo ahora.")
        else:
            estado_final = check_status()
            if estado_final != "open":
                print(f"\n⚠️  Estado final: {estado_final}. Vuelve a ejecutar el script.")

print("\nDone.")
