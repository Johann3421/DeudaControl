#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────────
# Backup automático de PostgreSQL
# • Se ejecuta al arrancar y luego cada 24 horas
# • Guarda dumps en /backups (volumen Docker persistente "db_backups")
# • Retiene los últimos 7 backups (≈ 1 semana)
# • El volumen db_backups es INDEPENDIENTE de postgres_data_v2:
#   si postgres_data_v2 se borra accidentalmente, los backups siguen aquí
# ──────────────────────────────────────────────────────────────────────────────

set -e

echo "==> [backup] Servicio de respaldo iniciado. Esperando DB..."
sleep 20   # margen para que postgres termine su startup

mkdir -p /backups

do_backup() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="/backups/backup_${TIMESTAMP}.sql"

    echo "==> [backup] Iniciando pg_dump a ${BACKUP_FILE} ..."

    if pg_dump \
        -h "${DB_HOST:-db}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USERNAME:-deudas_user}" \
        -d "${DB_DATABASE:-control_deudas}" \
        --no-owner \
        --no-acl \
        > "${BACKUP_FILE}"; then

        SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
        echo "==> [backup] OK — ${BACKUP_FILE} (${SIZE})"

        # Rotar: conservar sólo los últimos 7 backups
        TOTAL=$(ls /backups/backup_*.sql 2>/dev/null | wc -l)
        if [ "$TOTAL" -gt 7 ]; then
            REMOVE=$((TOTAL - 7))
            ls -t /backups/backup_*.sql | tail -n "${REMOVE}" | xargs rm -f
            echo "==> [backup] Rotación: eliminados ${REMOVE} backup(s) viejo(s), quedan 7."
        fi

    else
        echo "==> [backup] ERROR: pg_dump falló en ${TIMESTAMP}"
        rm -f "${BACKUP_FILE}"
    fi

    echo "==> [backup] Backups disponibles:"
    ls -lh /backups/backup_*.sql 2>/dev/null || echo "   (ninguno)"
}

# Primer backup inmediato al arrancar
do_backup

# Luego cada 24 horas
while true; do
    echo "==> [backup] Próximo backup en 24h..."
    sleep 86400
    do_backup
done
