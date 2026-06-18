-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cf_budget_rows (
  id bigserial PRIMARY KEY,
  proj text NOT NULL,
  mes date NOT NULL,
  tipo text,
  item text,
  sub text,
  valor numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_extrato_rows (
  id bigserial PRIMARY KEY,
  data text,
  proj text,
  mes date,
  obs text,
  valor numeric NOT NULL,
  fornecedor text,
  conta text,
  situacao text,
  descricao text,
  origem text,
  sub text,
  item text,
  tipo text,
  classified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_class_map (
  id bigserial PRIMARY KEY,
  proj text NOT NULL,
  sub_key text NOT NULL,
  sub text,
  item text,
  tipo text,
  UNIQUE(proj, sub_key)
);

-- Enable RLS
ALTER TABLE cf_budget_rows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_extrato_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_class_map    ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single-tenant, password protected at app level)
CREATE POLICY "allow_all" ON cf_budget_rows  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cf_extrato_rows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cf_class_map    FOR ALL USING (true) WITH CHECK (true);
