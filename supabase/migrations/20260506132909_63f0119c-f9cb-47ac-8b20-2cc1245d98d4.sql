ALTER TABLE public.user_mt5_terminals
ADD COLUMN IF NOT EXISTS bridge_secret_hash text,
ADD COLUMN IF NOT EXISTS bridge_secret_hint text,
ADD COLUMN IF NOT EXISTS bridge_secret_set_at timestamptz;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

UPDATE public.user_mt5_terminals
SET bridge_secret_hash = encode(extensions.digest(terminal_uid, 'sha256'), 'hex'),
    bridge_secret_hint = right(terminal_uid, 4),
    bridge_secret_set_at = now()
WHERE bridge_secret_hash IS NULL;