#!/usr/bin/env python3
"""
Convert phpMyAdmin MySQL dump → PostgreSQL init.sql
Specific to the sekaitec_control_deudas schema.

Usage:
    python scripts/mysql_to_postgres.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
INPUT  = ROOT / "sekaitec_control_deudas (7).sql"
OUTPUT = ROOT / "docker" / "postgres" / "init.sql"

# Columns that are BOOLEAN (tinyint(1)) per table
BOOL_COLS = {
    "users":           {"is_active", "activo"},
    "deuda_entidades": {"cerrado"},
}

# Migrations that exist in the repo but are MISSING from the dump's migrations table.
# We add them to the migrations table at batch 11 so Laravel skips them on first deploy.
MISSING_MIGRATIONS = [
    "2026_02_16_add_siaf_fields_to_deuda_entidades",
    "2026_02_25_add_empresa_factura_to_deuda_entidades",
    "2026_03_10_100000_create_ordenes_compra_table",
    "2026_03_10_100001_create_gastos_oc_table",
    "2026_03_10_100002_create_pagos_oc_table",
    "2026_03_11_000000_add_deuda_id_to_ordenes_compra",
    "2026_03_12_000000_add_empresa_fields_to_ordenes_compra",
]

# Sequence values: table → (column, next_value)
# next_value = max(id in dump) + 1  OR  explicit AUTO_INCREMENT from ALTER TABLE
SEQUENCES = {
    "clientes":         ("id", 11),
    "configuraciones":  ("id", 1),
    "deudas":           ("id", 36),
    "deuda_alquileres": ("id", 4),
    "deuda_entidades":  ("id", 21),
    "deuda_historial":  ("id", 48),
    "entidades":        ("id", 8),
    "failed_jobs":      ("id", 1),
    "gastos_oc":        ("id", 16),
    "inmuebles":        ("id", 2),
    "jobs":             ("id", 1),
    "migrations":       ("id", 33),  # 25 in dump + 7 missing + spare
    "movimientos":      ("id", 61),
    "notificaciones":   ("id", 1),
    "ordenes_compra":   ("id", 5),
    "pagos":            ("id", 24),
    "pagos_oc":         ("id", 1),
    "recibos_alquiler": ("id", 6),
    "roles":            ("id", 1),
    "users":            ("id", 8),
}

# Insertion order that satisfies FK constraints
TABLE_ORDER = [
    "users", "roles", "clientes", "entidades", "inmuebles",
    "deudas", "deuda_alquileres", "deuda_entidades", "deuda_historial",
    "movimientos", "notificaciones", "ordenes_compra", "gastos_oc",
    "pagos", "pagos_oc", "recibos_alquiler",
    "sessions", "migrations", "cache", "cache_locks",
    "password_reset_tokens", "configuraciones",
    "jobs", "job_batches", "failed_jobs",
]

# ─── PostgreSQL Schema ─────────────────────────────────────────────────────────
PG_SCHEMA = """\
CREATE TABLE IF NOT EXISTS "users" (
    "id"                BIGSERIAL     NOT NULL,
    "name"              VARCHAR(255)  NOT NULL,
    "email"             VARCHAR(255)  NOT NULL,
    "email_verified_at" TIMESTAMP,
    "password"          VARCHAR(255)  NOT NULL,
    "role"              VARCHAR(20)   NOT NULL DEFAULT 'user',
    "approved_at"       TIMESTAMP,
    "is_active"         BOOLEAN       NOT NULL DEFAULT TRUE,
    "rol"               VARCHAR(50)   NOT NULL DEFAULT 'user',
    "activo"            BOOLEAN       NOT NULL DEFAULT TRUE,
    "remember_token"    VARCHAR(100),
    "created_at"        TIMESTAMP,
    "updated_at"        TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON "users" ("email");

CREATE TABLE IF NOT EXISTS "roles" (
    "id"          BIGSERIAL    NOT NULL,
    "name"        VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMP,
    "updated_at"  TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_unique ON "roles" ("name");
CREATE INDEX        IF NOT EXISTS roles_name_index  ON "roles" ("name");

CREATE TABLE IF NOT EXISTS "clientes" (
    "id"         BIGSERIAL    NOT NULL,
    "user_id"    BIGINT       NOT NULL,
    "nombre"     VARCHAR(100) NOT NULL,
    "apellido"   VARCHAR(100) NOT NULL,
    "cedula"     VARCHAR(20),
    "telefono"   VARCHAR(20),
    "email"      VARCHAR(150),
    "direccion"  TEXT,
    "notas"      TEXT,
    "estado"     VARCHAR(20)  NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP,
    "updated_at" TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT clientes_user_id_foreign FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS clientes_user_id_estado_index ON "clientes" ("user_id", "estado");
CREATE INDEX IF NOT EXISTS clientes_cedula_index         ON "clientes" ("cedula");

CREATE TABLE IF NOT EXISTS "configuraciones" (
    "id"          BIGSERIAL    NOT NULL,
    "key"         VARCHAR(255) NOT NULL,
    "value"       TEXT,
    "descripcion" VARCHAR(255),
    "tipo"        VARCHAR(20)  NOT NULL DEFAULT 'string',
    "created_at"  TIMESTAMP,
    "updated_at"  TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS configuraciones_key_unique ON "configuraciones" ("key");

CREATE TABLE IF NOT EXISTS "entidades" (
    "id"                BIGSERIAL    NOT NULL,
    "user_id"           BIGINT       NOT NULL,
    "razon_social"      VARCHAR(200) NOT NULL,
    "ruc"               VARCHAR(20),
    "tipo"              VARCHAR(20)  NOT NULL DEFAULT 'publica',
    "contacto_nombre"   VARCHAR(150),
    "contacto_telefono" VARCHAR(20),
    "contacto_email"    VARCHAR(150),
    "direccion"         TEXT,
    "notas"             TEXT,
    "estado"            VARCHAR(20)  NOT NULL DEFAULT 'activa',
    "created_at"        TIMESTAMP,
    "updated_at"        TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT entidades_user_id_foreign FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS entidades_user_id_estado_index ON "entidades" ("user_id", "estado");
CREATE INDEX IF NOT EXISTS entidades_ruc_index            ON "entidades" ("ruc");

CREATE TABLE IF NOT EXISTS "inmuebles" (
    "id"          BIGSERIAL    NOT NULL,
    "user_id"     BIGINT       NOT NULL,
    "nombre"      VARCHAR(150) NOT NULL,
    "direccion"   TEXT         NOT NULL,
    "tipo"        VARCHAR(20)  NOT NULL DEFAULT 'otro',
    "descripcion" TEXT,
    "estado"      VARCHAR(20)  NOT NULL DEFAULT 'disponible',
    "created_at"  TIMESTAMP,
    "updated_at"  TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT inmuebles_user_id_foreign FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS inmuebles_user_id_estado_index ON "inmuebles" ("user_id", "estado");

CREATE TABLE IF NOT EXISTS "deudas" (
    "id"               BIGSERIAL     NOT NULL,
    "tipo_deuda"       VARCHAR(20)   NOT NULL DEFAULT 'particular',
    "user_id"          BIGINT        NOT NULL,
    "cliente_id"       BIGINT,
    "descripcion"      VARCHAR(255)  NOT NULL,
    "monto_total"      DECIMAL(12,2) NOT NULL,
    "monto_pendiente"  DECIMAL(12,2) NOT NULL,
    "currency_code"    VARCHAR(3)    NOT NULL DEFAULT 'PEN',
    "tasa_interes"     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    "fecha_inicio"     DATE          NOT NULL,
    "fecha_vencimiento" DATE,
    "estado"           VARCHAR(20)   NOT NULL DEFAULT 'activa',
    "frecuencia_pago"  VARCHAR(20)   NOT NULL DEFAULT 'mensual',
    "numero_cuotas"    INTEGER,
    "notas"            TEXT,
    "created_at"       TIMESTAMP,
    "updated_at"       TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT deudas_user_id_foreign    FOREIGN KEY ("user_id")    REFERENCES "users"    ("id") ON DELETE CASCADE,
    CONSTRAINT deudas_cliente_id_foreign FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS deudas_user_id_estado_index              ON "deudas" ("user_id",  "estado");
CREATE INDEX IF NOT EXISTS deudas_cliente_id_estado_index           ON "deudas" ("cliente_id","estado");
CREATE INDEX IF NOT EXISTS deudas_fecha_vencimiento_index           ON "deudas" ("fecha_vencimiento");
CREATE INDEX IF NOT EXISTS deudas_tipo_deuda_index                  ON "deudas" ("tipo_deuda");
CREATE INDEX IF NOT EXISTS deudas_user_id_tipo_deuda_estado_index   ON "deudas" ("user_id","tipo_deuda","estado");

CREATE TABLE IF NOT EXISTS "deuda_alquileres" (
    "id"                   BIGSERIAL     NOT NULL,
    "deuda_id"             BIGINT        NOT NULL,
    "inmueble_id"          BIGINT        NOT NULL,
    "monto_mensual"        DECIMAL(12,2) NOT NULL,
    "periodicidad"         VARCHAR(20)   NOT NULL DEFAULT 'mensual',
    "fecha_inicio_contrato" DATE         NOT NULL,
    "fecha_corte"          DATE,
    "servicios_incluidos"  TEXT,
    "created_at"           TIMESTAMP,
    "updated_at"           TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT deuda_alquileres_deuda_id_foreign    FOREIGN KEY ("deuda_id")    REFERENCES "deudas"   ("id") ON DELETE CASCADE,
    CONSTRAINT deuda_alquileres_inmueble_id_foreign FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS deuda_alquileres_deuda_id_unique   ON "deuda_alquileres" ("deuda_id");
CREATE        INDEX IF NOT EXISTS deuda_alquileres_inmueble_id_index ON "deuda_alquileres" ("inmueble_id");
CREATE        INDEX IF NOT EXISTS deuda_alquileres_fecha_corte_index ON "deuda_alquileres" ("fecha_corte");

CREATE TABLE IF NOT EXISTS "deuda_entidades" (
    "id"                BIGSERIAL     NOT NULL,
    "deuda_id"          BIGINT        NOT NULL,
    "entidad_id"        BIGINT        NOT NULL,
    "orden_compra"      VARCHAR(100)  NOT NULL,
    "fecha_emision"     DATE          NOT NULL,
    "producto_servicio" VARCHAR(255)  NOT NULL,
    "codigo_siaf"       VARCHAR(50),
    "estado_siaf"       CHAR(1),
    "fase_siaf"         VARCHAR(10),
    "estado_expediente" VARCHAR(50),
    "fecha_proceso"     TIMESTAMP,
    "fecha_limite_pago" DATE          NOT NULL,
    "estado_seguimiento" VARCHAR(20)  NOT NULL DEFAULT 'emitido',
    "empresa_factura"   VARCHAR(255),
    "unidad_ejecutora"  VARCHAR(150),
    "cerrado"           BOOLEAN       NOT NULL DEFAULT FALSE,
    "created_at"        TIMESTAMP,
    "updated_at"        TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT deuda_entidades_deuda_id_foreign   FOREIGN KEY ("deuda_id")   REFERENCES "deudas"    ("id") ON DELETE CASCADE,
    CONSTRAINT deuda_entidades_entidad_id_foreign FOREIGN KEY ("entidad_id") REFERENCES "entidades" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS deuda_entidades_deuda_id_unique                       ON "deuda_entidades" ("deuda_id");
CREATE        INDEX IF NOT EXISTS deuda_entidades_entidad_id_estado_seguimiento_index   ON "deuda_entidades" ("entidad_id","estado_seguimiento");
CREATE        INDEX IF NOT EXISTS deuda_entidades_codigo_siaf_index                     ON "deuda_entidades" ("codigo_siaf");
CREATE        INDEX IF NOT EXISTS deuda_entidades_fecha_limite_pago_index               ON "deuda_entidades" ("fecha_limite_pago");

CREATE TABLE IF NOT EXISTS "deuda_historial" (
    "id"              BIGSERIAL    NOT NULL,
    "deuda_id"        BIGINT       NOT NULL,
    "user_id"         BIGINT       NOT NULL,
    "evento"          VARCHAR(100) NOT NULL,
    "datos_anteriores" TEXT,
    "datos_nuevos"    TEXT,
    "descripcion"     TEXT,
    "created_at"      TIMESTAMP,
    "updated_at"      TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT deuda_historial_deuda_id_foreign FOREIGN KEY ("deuda_id") REFERENCES "deudas" ("id") ON DELETE CASCADE,
    CONSTRAINT deuda_historial_user_id_foreign  FOREIGN KEY ("user_id")  REFERENCES "users"  ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS deuda_historial_user_id_foreign          ON "deuda_historial" ("user_id");
CREATE INDEX IF NOT EXISTS deuda_historial_deuda_id_created_at_index ON "deuda_historial" ("deuda_id","created_at");
CREATE INDEX IF NOT EXISTS deuda_historial_evento_index              ON "deuda_historial" ("evento");

CREATE TABLE IF NOT EXISTS "movimientos" (
    "id"             BIGSERIAL     NOT NULL,
    "user_id"        BIGINT        NOT NULL,
    "tipo"           VARCHAR(30)   NOT NULL,
    "referencia_tipo" VARCHAR(50),
    "referencia_id"  BIGINT,
    "monto"          DECIMAL(12,2) NOT NULL,
    "descripcion"    VARCHAR(255)  NOT NULL,
    "created_at"     TIMESTAMP,
    "updated_at"     TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT movimientos_user_id_foreign FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS movimientos_user_id_tipo_index ON "movimientos" ("user_id","tipo");
CREATE INDEX IF NOT EXISTS movimientos_created_at_index   ON "movimientos" ("created_at");

CREATE TABLE IF NOT EXISTS "notificaciones" (
    "id"           BIGSERIAL    NOT NULL,
    "user_id"      BIGINT       NOT NULL,
    "deuda_id"     BIGINT       NOT NULL,
    "canal"        VARCHAR(20)  NOT NULL DEFAULT 'whatsapp',
    "estado"       VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    "mensaje"      TEXT         NOT NULL,
    "destinatario" VARCHAR(100) NOT NULL,
    "fecha_envio"  TIMESTAMP,
    "error"        TEXT,
    "created_at"   TIMESTAMP,
    "updated_at"   TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT notificaciones_user_id_foreign  FOREIGN KEY ("user_id")  REFERENCES "users"  ("id") ON DELETE CASCADE,
    CONSTRAINT notificaciones_deuda_id_foreign FOREIGN KEY ("deuda_id") REFERENCES "deudas" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS notificaciones_user_id_estado_index    ON "notificaciones" ("user_id","estado");
CREATE INDEX IF NOT EXISTS notificaciones_deuda_id_canal_index    ON "notificaciones" ("deuda_id","canal");
CREATE INDEX IF NOT EXISTS notificaciones_fecha_envio_index       ON "notificaciones" ("fecha_envio");

CREATE TABLE IF NOT EXISTS "ordenes_compra" (
    "id"              BIGSERIAL     NOT NULL,
    "user_id"         BIGINT        NOT NULL,
    "deuda_id"        BIGINT,
    "numero_oc"       VARCHAR(50)   NOT NULL,
    "cliente"         VARCHAR(200)  NOT NULL,
    "empresa_factura" VARCHAR(200),
    "entidad_recibe"  VARCHAR(200),
    "fecha_oc"        DATE          NOT NULL,
    "fecha_entrega"   DATE,
    "estado"          VARCHAR(20)   NOT NULL DEFAULT 'pendiente',
    "total_oc"        DECIMAL(12,2) NOT NULL,
    "currency_code"   VARCHAR(10)   NOT NULL DEFAULT 'PEN',
    "notas"           TEXT,
    "created_at"      TIMESTAMP,
    "updated_at"      TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT fk_ordenes_compra_user  FOREIGN KEY ("user_id")  REFERENCES "users"  ("id") ON DELETE CASCADE,
    CONSTRAINT fk_ordenes_compra_deuda FOREIGN KEY ("deuda_id") REFERENCES "deudas" ("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ordenes_compra_numero_oc_unique    ON "ordenes_compra" ("numero_oc");
CREATE        INDEX IF NOT EXISTS fk_ordenes_compra_user_index       ON "ordenes_compra" ("user_id");
CREATE        INDEX IF NOT EXISTS fk_ordenes_compra_deuda_index      ON "ordenes_compra" ("deuda_id");

CREATE TABLE IF NOT EXISTS "gastos_oc" (
    "id"              BIGSERIAL     NOT NULL,
    "orden_compra_id" BIGINT        NOT NULL,
    "tipo_gasto"      VARCHAR(30)   NOT NULL,
    "descripcion"     VARCHAR(255),
    "monto"           DECIMAL(12,2) NOT NULL,
    "fecha"           DATE,
    "created_at"      TIMESTAMP,
    "updated_at"      TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT fk_gastos_oc_orden FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS fk_gastos_oc_orden_index ON "gastos_oc" ("orden_compra_id");

CREATE TABLE IF NOT EXISTS "pagos" (
    "id"           BIGSERIAL     NOT NULL,
    "deuda_id"     BIGINT        NOT NULL,
    "monto"        DECIMAL(12,2) NOT NULL,
    "currency_code" VARCHAR(3)   NOT NULL DEFAULT 'PEN',
    "fecha_pago"   DATE          NOT NULL,
    "metodo_pago"  VARCHAR(20)   NOT NULL DEFAULT 'efectivo',
    "referencia"   VARCHAR(100),
    "notas"        TEXT,
    "created_at"   TIMESTAMP,
    "updated_at"   TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT pagos_deuda_id_foreign FOREIGN KEY ("deuda_id") REFERENCES "deudas" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS pagos_deuda_id_index  ON "pagos" ("deuda_id");
CREATE INDEX IF NOT EXISTS pagos_fecha_pago_index ON "pagos" ("fecha_pago");

CREATE TABLE IF NOT EXISTS "pagos_oc" (
    "id"              BIGSERIAL     NOT NULL,
    "orden_compra_id" BIGINT        NOT NULL,
    "monto"           DECIMAL(12,2) NOT NULL,
    "fecha_pago"      DATE          NOT NULL,
    "metodo_pago"     VARCHAR(20)   NOT NULL DEFAULT 'transferencia',
    "referencia"      VARCHAR(100),
    "notas"           TEXT,
    "created_at"      TIMESTAMP,
    "updated_at"      TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT fk_pagos_oc_orden FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS fk_pagos_oc_orden_index ON "pagos_oc" ("orden_compra_id");

CREATE TABLE IF NOT EXISTS "recibos_alquiler" (
    "id"                BIGSERIAL     NOT NULL,
    "deuda_alquiler_id" BIGINT        NOT NULL,
    "numero_recibo"     VARCHAR(50)   NOT NULL,
    "monto"             DECIMAL(12,2) NOT NULL,
    "periodo_inicio"    DATE          NOT NULL,
    "periodo_fin"       DATE          NOT NULL,
    "estado"            VARCHAR(20)   NOT NULL DEFAULT 'pendiente',
    "fecha_pago"        DATE,
    "notas"             TEXT,
    "created_at"        TIMESTAMP,
    "updated_at"        TIMESTAMP,
    PRIMARY KEY ("id"),
    CONSTRAINT recibos_alquiler_deuda_alquiler_id_foreign FOREIGN KEY ("deuda_alquiler_id") REFERENCES "deuda_alquileres" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS recibos_alquiler_deuda_alquiler_id_estado_index
    ON "recibos_alquiler" ("deuda_alquiler_id","estado");
CREATE INDEX IF NOT EXISTS recibos_alquiler_periodo_inicio_periodo_fin_index
    ON "recibos_alquiler" ("periodo_inicio","periodo_fin");

CREATE TABLE IF NOT EXISTS "cache" (
    "key"        VARCHAR(255) NOT NULL,
    "value"      TEXT         NOT NULL,
    "expiration" INTEGER      NOT NULL,
    PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS cache_expiration_index ON "cache" ("expiration");

CREATE TABLE IF NOT EXISTS "cache_locks" (
    "key"        VARCHAR(255) NOT NULL,
    "owner"      VARCHAR(255) NOT NULL,
    "expiration" INTEGER      NOT NULL,
    PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS cache_locks_expiration_index ON "cache_locks" ("expiration");

CREATE TABLE IF NOT EXISTS "sessions" (
    "id"            VARCHAR(255) NOT NULL,
    "user_id"       BIGINT,
    "ip_address"    VARCHAR(45),
    "user_agent"    TEXT,
    "payload"       TEXT         NOT NULL,
    "last_activity" INTEGER      NOT NULL,
    PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS sessions_user_id_index       ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS sessions_last_activity_index ON "sessions" ("last_activity");

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "email"      VARCHAR(255) NOT NULL,
    "token"      VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP,
    PRIMARY KEY ("email")
);

CREATE TABLE IF NOT EXISTS "migrations" (
    "id"        SERIAL       NOT NULL,
    "migration" VARCHAR(255) NOT NULL,
    "batch"     INTEGER      NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "jobs" (
    "id"           BIGSERIAL    NOT NULL,
    "queue"        VARCHAR(255) NOT NULL,
    "payload"      TEXT         NOT NULL,
    "attempts"     SMALLINT     NOT NULL,
    "reserved_at"  INTEGER,
    "available_at" INTEGER      NOT NULL,
    "created_at"   INTEGER      NOT NULL,
    PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS jobs_queue_index ON "jobs" ("queue");

CREATE TABLE IF NOT EXISTS "job_batches" (
    "id"             VARCHAR(255) NOT NULL,
    "name"           VARCHAR(255) NOT NULL,
    "total_jobs"     INTEGER      NOT NULL,
    "pending_jobs"   INTEGER      NOT NULL,
    "failed_jobs"    INTEGER      NOT NULL,
    "failed_job_ids" TEXT         NOT NULL,
    "options"        TEXT,
    "cancelled_at"   INTEGER,
    "created_at"     INTEGER      NOT NULL,
    "finished_at"    INTEGER,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "failed_jobs" (
    "id"         BIGSERIAL    NOT NULL,
    "uuid"       VARCHAR(255) NOT NULL,
    "connection" TEXT         NOT NULL,
    "queue"      TEXT         NOT NULL,
    "payload"    TEXT         NOT NULL,
    "exception"  TEXT         NOT NULL,
    "failed_at"  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS failed_jobs_uuid_unique ON "failed_jobs" ("uuid");
"""

# ─── Value parser ──────────────────────────────────────────────────────────────

def mysql_unescape(s: str) -> str:
    """Convert MySQL string escape sequences to a raw Python string."""
    result = []
    i = 0
    while i < len(s):
        if s[i] == '\\' and i + 1 < len(s):
            c = s[i + 1]
            if   c == 'n':  result.append('\n')
            elif c == 'r':  result.append('\r')
            elif c == 't':  result.append('\t')
            elif c == '\\': result.append('\\')
            elif c == "'":  result.append("'")
            elif c == '"':  result.append('"')
            elif c == '0':  result.append('\x00')
            else:           result.append('\\'); result.append(c)
            i += 2
        else:
            result.append(s[i])
            i += 1
    return ''.join(result)


def to_pg_literal(raw: str) -> str:
    """Build a PostgreSQL string literal from a raw Python string."""
    needs_e = any(c in raw for c in '\n\r\t\x00')
    if needs_e:
        inner = (raw
                 .replace('\\', '\\\\')
                 .replace("'",  "''")
                 .replace('\n', '\\n')
                 .replace('\r', '\\r')
                 .replace('\t', '\\t')
                 .replace('\x00', '\\000'))
        return "E'" + inner + "'"
    else:
        return "'" + raw.replace("'", "''") + "'"


def convert_value(token: str, is_bool: bool = False) -> str:
    """Convert one MySQL VALUE token to its PostgreSQL equivalent."""
    t = token.strip()
    if t.upper() == 'NULL':               return 'NULL'
    if t.upper() == 'CURRENT_TIMESTAMP':  return 'CURRENT_TIMESTAMP'
    if t.startswith("'") and t.endswith("'"):
        raw = mysql_unescape(t[1:-1])
        return to_pg_literal(raw)
    if is_bool:
        return 'true' if t == '1' else 'false'
    return t  # numeric / other literal


# ─── Row tokenizer ─────────────────────────────────────────────────────────────

def split_row_values(row_body: str) -> list:
    """
    Split the body of a single VALUES row (without outer parentheses) into
    individual value tokens, respecting nesting and string literals.
    """
    tokens = []
    current = []
    in_string   = False
    escape_next = False
    depth = 0

    for ch in row_body:
        if escape_next:
            current.append(ch)
            escape_next = False
            continue
        if ch == '\\' and in_string:
            current.append(ch)
            escape_next = True
            continue
        if ch == "'" and not in_string:
            in_string = True
            current.append(ch)
        elif ch == "'" and in_string:
            in_string = False
            current.append(ch)
        elif not in_string:
            if ch == '(':
                depth += 1
                current.append(ch)
            elif ch == ')':
                depth -= 1
                current.append(ch)
            elif ch == ',' and depth == 0:
                tokens.append(''.join(current).strip())
                current = []
            else:
                current.append(ch)
        else:
            current.append(ch)

    if current:
        tokens.append(''.join(current).strip())

    return tokens


def split_all_rows(values_section: str) -> list:
    """
    Split a VALUES section (text after VALUES keyword, before semicolon) into
    a list of row body strings (content inside each top-level parentheses pair).
    """
    rows = []
    current = []
    in_string   = False
    escape_next = False
    depth = 0

    for ch in values_section:
        if escape_next:
            current.append(ch)
            escape_next = False
            continue
        if ch == '\\' and in_string:
            current.append(ch)
            escape_next = True
            continue
        if ch == "'" and not in_string:
            in_string = True
            current.append(ch)
        elif ch == "'" and in_string:
            in_string = False
            current.append(ch)
        elif not in_string:
            if ch == '(':
                depth += 1
                if depth > 1:
                    current.append(ch)
            elif ch == ')':
                depth -= 1
                if depth == 0:
                    rows.append(''.join(current))
                    current = []
                else:
                    current.append(ch)
            elif ch == ',' and depth == 0:
                pass  # row separator
            elif ch == ';' and depth == 0:
                break
            else:
                current.append(ch)
        else:
            current.append(ch)

    return rows


# ─── INSERT parser / converter ─────────────────────────────────────────────────

INSERT_RE = re.compile(
    r"INSERT\s+INTO\s+`(\w+)`\s*\(([^)]+)\)\s*VALUES\s*(.*)",
    re.DOTALL | re.IGNORECASE,
)


def collect_inserts(sql_text: str) -> dict:
    """
    Read the full MySQL dump and return a dict {table_name: converted_pg_insert_sql}.
    Handles multi-line INSERT statements.
    """
    inserts = {}

    # Collect complete INSERT statements (they end with a line that has ';')
    in_stmt  = False
    stmt_buf = []

    for line in sql_text.splitlines():
        if re.match(r'\s*INSERT\s+INTO\s+`', line, re.IGNORECASE):
            in_stmt  = True
            stmt_buf = [line]
        elif in_stmt:
            stmt_buf.append(line)
            if line.rstrip().endswith(';'):
                full = '\n'.join(stmt_buf)
                m = INSERT_RE.match(full)
                if m:
                    table        = m.group(1)
                    cols_raw     = m.group(2)
                    values_block = m.group(3).rstrip(';').strip()
                    cols         = [c.strip().strip('`') for c in cols_raw.split(',')]
                    bool_set     = BOOL_COLS.get(table, set())
                    row_bodies   = split_all_rows(values_block)

                    pg_rows = []
                    for body in row_bodies:
                        tokens = split_row_values(body)
                        pg_vals = [
                            convert_value(tok, col in bool_set)
                            for tok, col in zip(tokens, cols)
                        ]
                        pg_rows.append("    (" + ", ".join(pg_vals) + ")")

                    col_list = ", ".join(f'"{c}"' for c in cols)
                    insert_sql = (
                        f'INSERT INTO "{table}" ({col_list}) VALUES\n'
                        + ',\n'.join(pg_rows)
                        + ";"
                    )
                    inserts[table] = insert_sql

                in_stmt  = False
                stmt_buf = []

    return inserts


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"Reading  : {INPUT}")
    with open(INPUT, encoding='utf-8') as fh:
        sql_text = fh.read()

    print("Parsing MySQL INSERT statements...")
    inserts = collect_inserts(sql_text)
    for t in sorted(inserts):
        lines_count = inserts[t].count('\n')
        print(f"  ✓  {t:40s} ({lines_count} lines)")

    # Build output
    out = []
    out.append("-- ================================================================")
    out.append("-- PostgreSQL init script — Control de Deudas")
    out.append("-- Auto-generated by scripts/mysql_to_postgres.py")
    out.append("-- This file runs automatically the FIRST time the PG container")
    out.append("-- starts (via /docker-entrypoint-initdb.d).")
    out.append("-- ================================================================")
    out.append("")
    out.append("SET client_encoding = 'UTF8';")
    out.append("SET standard_conforming_strings = on;")
    out.append("")
    out.append("BEGIN;")
    out.append("")

    # Schema
    out.append("-- ────────── SCHEMA ──────────────────────────────────────────────")
    out.append(PG_SCHEMA)

    # Data (in FK-safe order)
    out.append("-- ────────── DATA ────────────────────────────────────────────────")
    out.append("")

    for table in TABLE_ORDER:
        if table == "migrations":
            # Include dump data first (with explicit IDs), then append missing migrations.
            # We MUST advance the SERIAL sequence before the auto-id inserts or we get
            # "duplicate key value violates unique constraint" because SERIAL still starts
            # at 1 even though we just inserted rows 1-N with explicit IDs.
            if "migrations" in inserts:
                out.append(f"-- {table}")
                out.append(inserts["migrations"])
                out.append("")
                # Advance sequence to MAX(id) so next auto-assigned id = MAX(id)+1
                out.append("-- Advance migrations sequence beyond the explicitly-inserted rows")
                out.append(
                    "SELECT setval(pg_get_serial_sequence('\"migrations\"', 'id'), "
                    "(SELECT MAX(id) FROM \"migrations\"), true);"
                )
                out.append("")
            missing_vals = ',\n'.join(
                f"    ('{m}', 11)" for m in MISSING_MIGRATIONS
            )
            out.append("-- Missing migrations (repo migrations not recorded in dump)")
            out.append(
                f'INSERT INTO "migrations" ("migration", "batch") VALUES\n'
                + missing_vals + ";"
            )
        elif table in inserts:
            out.append(f"-- {table}")
            out.append(inserts[table])

        out.append("")

    # Sequence resets
    out.append("-- ────────── RESET SEQUENCES ─────────────────────────────────────")
    out.append("")
    for table, (col, nextval) in SEQUENCES.items():
        out.append(
            f"SELECT setval(pg_get_serial_sequence('\"{table}\"', '{col}'), {nextval}, false);"
        )

    out.append("")
    out.append("COMMIT;")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(out) + '\n')

    print(f"\n✓ Written : {OUTPUT}")
    print(f"  Size    : {OUTPUT.stat().st_size / 1024:.1f} KB")


if __name__ == '__main__':
    main()
