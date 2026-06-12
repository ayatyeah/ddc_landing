-- schema.sql — таблица заявок/клиентов с сайта ЦЦР
-- Применяется автоматически через `npm run init-db`, либо вручную.

CREATE TABLE IF NOT EXISTS leads (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  email         TEXT,
  phone         TEXT,
  subject       TEXT,
  message       TEXT,
  -- статус обслуживания клиента (меняется админом из выпадающего списка)
  status        TEXT        NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','in_progress','on_hold','served','rejected')),
  -- комментарий админа по клиенту
  admin_comment TEXT        DEFAULT '',
  -- оценка клиента 0..5 (0 = не оценён)
  rating        SMALLINT    NOT NULL DEFAULT 0
                CHECK (rating BETWEEN 0 AND 5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- Автообновление updated_at при изменении строки
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
