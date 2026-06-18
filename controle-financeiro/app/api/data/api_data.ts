import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')

  try {
    if (table === 'budget') {
      const { data, error } = await supabase.from('cf_budget_rows').select('*').order('mes')
      if (error) throw error
      return NextResponse.json({ rows: data || [] })
    }
    if (table === 'extrato') {
      const { data, error } = await supabase.from('cf_extrato_rows').select('*').order('mes')
      if (error) throw error
      return NextResponse.json({ rows: data || [] })
    }
    if (table === 'classmap') {
      const { data, error } = await supabase.from('cf_class_map').select('*')
      if (error) throw error
      const map: Record<string, { sub: string; item: string; tipo: string }> = {}
      for (const r of data || []) {
        map[`${r.proj}||${r.sub_key}`] = { sub: r.sub, item: r.item, tipo: r.tipo }
      }
      return NextResponse.json({ map })
    }
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
