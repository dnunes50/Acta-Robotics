import { supabase } from './supabase'
import { BudgetRow, ExtratoRow, ClassMapEntry } from './types'

// ── CREATE TABLES IF NOT EXIST (via RPC or direct) ────────────────────────────
export async function ensureTables() {
  // Try to query each table; if it fails, create it
  const tables = [
    {
      name: 'cf_budget_rows',
      sql: `
        CREATE TABLE IF NOT EXISTS cf_budget_rows (
          id bigserial PRIMARY KEY,
          proj text NOT NULL,
          mes date NOT NULL,
          tipo text,
          item text,
          sub text,
          valor numeric NOT NULL,
          created_at timestamptz DEFAULT now()
        );`
    },
    {
      name: 'cf_extrato_rows',
      sql: `
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
        );`
    },
    {
      name: 'cf_class_map',
      sql: `
        CREATE TABLE IF NOT EXISTS cf_class_map (
          id bigserial PRIMARY KEY,
          proj text NOT NULL,
          sub_key text NOT NULL,
          sub text,
          item text,
          tipo text,
          UNIQUE(proj, sub_key)
        );`
    }
  ]

  for (const t of tables) {
    const { error } = await supabase.rpc('exec_sql', { sql: t.sql }).select()
    if (error) {
      // RPC may not exist — try a simple select to check if table exists
      const { error: e2 } = await supabase.from(t.name).select('id').limit(1)
      if (e2 && e2.code === '42P01') {
        console.warn(`Table ${t.name} does not exist. Run migration SQL manually.`)
      }
    }
  }
}

// ── LOAD ──────────────────────────────────────────────────────────────────────
export async function loadBudget(): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from('cf_budget_rows')
    .select('*')
    .order('mes', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadExtrato(): Promise<ExtratoRow[]> {
  const { data, error } = await supabase
    .from('cf_extrato_rows')
    .select('*')
    .order('mes', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadClassMap(): Promise<Record<string, { sub: string; item: string; tipo: string }>> {
  const { data, error } = await supabase.from('cf_class_map').select('*')
  if (error) throw error
  const map: Record<string, { sub: string; item: string; tipo: string }> = {}
  for (const r of data || []) {
    map[`${r.proj}||${r.sub_key}`] = { sub: r.sub, item: r.item, tipo: r.tipo }
  }
  return map
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
export async function saveBudget(rows: BudgetRow[]) {
  // Clear and reinsert
  await supabase.from('cf_budget_rows').delete().neq('id', 0)
  if (!rows.length) return
  const { error } = await supabase.from('cf_budget_rows').insert(rows)
  if (error) throw error
}

export async function saveExtrato(rows: ExtratoRow[]) {
  await supabase.from('cf_extrato_rows').delete().neq('id', 0)
  if (!rows.length) return
  // Insert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('cf_extrato_rows').insert(rows.slice(i, i + 500))
    if (error) throw error
  }
}

export async function saveClassMap(map: Record<string, { sub: string; item: string; tipo: string }>) {
  await supabase.from('cf_class_map').delete().neq('id', 0)
  const rows = Object.entries(map).map(([key, val]) => {
    const [proj, sub_key] = key.split('||')
    return { proj, sub_key, ...val }
  })
  if (!rows.length) return
  const { error } = await supabase.from('cf_class_map').insert(rows)
  if (error) throw error
}
