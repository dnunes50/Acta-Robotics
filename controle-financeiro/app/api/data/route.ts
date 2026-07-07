import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const dynamic = 'force-dynamic'

async function fetchAll(table: string, order: string) {
  const allRows: any[] = []
  const pageSize = 500
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table).select('*').order(order).range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return allRows
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')

  try {
    if (table === 'budget') {
      const data = await fetchAll('cf_budget_rows', 'mes')
      return NextResponse.json({ rows: data.map(r => ({ ...r, valor: Number(r.valor) })) })
    }
    if (table === 'extrato') {
      const data = await fetchAll('cf_extrato_rows', 'mes')
      return NextResponse.json({ rows: data.map(r => ({ ...r, valor: Number(r.valor) })) })
    }
    if (table === 'classmap') {
      const { data, error } = await supabase.from('cf_class_map').select('*')
      if (error) throw error
      const map: Record<string, any> = {}
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
