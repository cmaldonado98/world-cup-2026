-- ============================================================
--  Migración v3 – Cromo logo FWC: renombrar 'FWC' → '00'
--
--  El cromo de portada/logo del álbum tiene código físico "00".
--  La migración v2 lo había guardado como 'FWC' (sin número).
--  Esta migración lo corrige y actualiza la restricción check.
--
--  Es IDEMPOTENTE: se puede ejecutar varias veces sin error.
-- ============================================================

BEGIN;

-- ── 1. Eliminar la restricción check actual ─────────────────
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

-- ── 2. Renombrar el cromo logo: 'FWC' → '00' ───────────────
--  Solo afecta el registro exacto 'FWC' (logo sin número).
--  Los numerados 'FWC1'–'FWC19' no se tocan.
UPDATE public.user_cards
  SET card_id = '00'
  WHERE card_id = 'FWC';

-- ── 3. Añadir la nueva restricción check ───────────────────
--  Acepta: "00" (logo), "FWC1"–"FWC19", "MEX1"–"MEX20", "CC1"–"CC14"
ALTER TABLE public.user_cards
  ADD CONSTRAINT user_cards_card_id_check
  CHECK (card_id ~ '^([A-Z]{2,5}[0-9]{0,3}|00)$');

-- ── 4. Verificación post-migración ─────────────────────────
--  Confirma que no quedan filas con card_id = 'FWC':
--
-- SELECT count(*) FROM public.user_cards WHERE card_id = 'FWC';
-- → debe devolver 0

COMMIT;
