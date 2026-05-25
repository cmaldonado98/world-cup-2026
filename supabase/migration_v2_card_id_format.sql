-- ============================================================
--  Migración v2 – Cambio de formato de card_id
--  Antiguo: "[CÓDIGO] [N]"  →  "ARG 1",  "FIFA 0"
--  Nuevo:   "[CÓDIGO][N]"   →  "ARG1",   "00",   "FWC1"
--
--  Cambios estructurales:
--    · Sección FIFA  → FWC  (FIFA0 → 00 / logo; FIFA1..19 → FWC1..19)
--    · Sección CC nueva (CC1–CC14) — no requiere migración de datos
--    · Selecciones retiradas del álbum: JAM, HON, VEN, ITA, DEN,
--      POL, SRB, NGA, CMR, IDN, KAZ  (ver paso 4)
--
--  Es IDEMPOTENTE: se puede ejecutar varias veces sin error.
-- ============================================================

BEGIN;

-- ── 1. Eliminar la restricción check antigua ────────────────
--  PostgreSQL auto-nombra los check inline como <tabla>_<col>_check.
--  Usamos un bloque dinámico para eliminarla aunque el nombre varíe.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM   pg_constraint
    WHERE  conrelid = 'public.user_cards'::regclass
      AND  contype  = 'c'
      AND  pg_get_constraintdef(oid) LIKE '%card_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_cards DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Constraint eliminada: %', r.conname;
  END LOOP;
END;
$$;

-- ── 2. Quitar el espacio de todos los card_id con formato viejo ─
--  "ARG 1"  → "ARG1"
--  "FIFA 0" → "FIFA0"   (se renombra a FWC en el paso 3)
UPDATE public.user_cards
  SET card_id = replace(card_id, ' ', '')
  WHERE card_id ~ '^[A-Z]{2,5} [0-9]{1,3}$';

-- ── 3. Renombrar sección FIFA → FWC ────────────────────────────
--  "FIFA0"  → "00"    (cromo Logo)
--  "FIFA1"  → "FWC1"
--  "FIFA19" → "FWC19"
UPDATE public.user_cards
  SET card_id = CASE
    WHEN card_id = 'FIFA0' THEN '00'
    ELSE 'FWC' || substring(card_id FROM 5)   -- quita los 4 chars 'FIFA'
  END
  WHERE card_id LIKE 'FIFA%';

-- ── 4. (OPCIONAL) Borrar cromos de selecciones retiradas ───────
--  Las siguientes selecciones ya no aparecen en el álbum 2026:
--    JAM, HON, VEN, ITA, DEN, POL, SRB, NGA, CMR, IDN, KAZ
--  Descomenta el bloque si prefieres limpiar esos registros.
--
-- DELETE FROM public.user_cards
--   WHERE card_id ~ '^(JAM|HON|VEN|ITA|DEN|POL|SRB|NGA|CMR|IDN|KAZ)[0-9]+$';

-- ── 5. Añadir la nueva restricción check ───────────────────────
--  Acepta: "00" (logo), "FWC1"–"FWC19", "MEX1"–"MEX20", "CC1"–"CC14"
ALTER TABLE public.user_cards
  ADD CONSTRAINT user_cards_card_id_check
  CHECK (card_id ~ '^([A-Z]{2,5}[0-9]{0,3}|00)$');

-- ── 6. Verificación rápida post-migración ──────────────────────
--  Ejecuta esto (o simplemente revisa la consola) para confirmar:
--
-- SELECT card_id, count(*) AS usuarios
-- FROM   public.user_cards
-- GROUP  BY card_id
-- ORDER  BY card_id;

COMMIT;
