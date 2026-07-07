import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function normProj(p: string): string {
  const u = (p || '').trim().toUpperCase()
  if (u === 'FINEP') return 'Finep'
  if (u === 'NAVE ANP') return 'NAVE ANP'
  return (p || '').trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function clearTable(table: string) {
  // Delete in batches to avoid timeout on large tables
  let deleted = 0
  while (true) {
    const { data, error } = await supabase.from(table).select('id').limit(1000)
    if (error) throw error
    if (!data || data.length === 0) break
    const ids = data.map((r: any) => r.id)
    const { error: delError } = await supabase.from(table).delete().in('id', ids)
    if (delError) throw delError
    deleted += ids.length
    if (ids.length < 1000) break
  }
  return deleted
}

export async function POST(req: Request) {
  try {
    const { type, rows, classMap } = await req.json()

    if (type === 'budget') {
      await clearTable('cf_budget_rows')
      if (rows?.length) {
        const toInsert = rows.map((r: any) => ({
          proj: normProj(r.proj),
          mes: r.mes ? String(r.mes).slice(0, 10) : null,
          tipo: r.tipo, item: r.item, sub: r.sub, valor: Number(r.valor)
        }))
        for (let i = 0; i < toInsert.length; i += 500) {
          const { error } = await supabase.from('cf_budget_rows').insert(toInsert.slice(i, i + 500))
          if (error) throw error
        }
      }
      if (classMap && Object.keys(classMap).length) {
        await clearTable('cf_class_map')
        const cmRows = Object.entries(classMap).map(([key, val]: [string, any]) => {
          const [proj, sub_key] = key.split('||')
          return { proj, sub_key, sub: val.sub, item: val.item, tipo: val.tipo }
        })
        for (let i = 0; i < cmRows.length; i += 500) {
          const { error } = await supabase.from('cf_class_map').insert(cmRows.slice(i, i + 500))
          if (error) throw error
        }
      }
    }

    if (type === 'extrato') {
      await clearTable('cf_extrato_rows')
      if (rows?.length) {
        // Filter Transferência before saving — never persist them
        const toInsert = rows
          .filter((r: any) => (r._origem || r.origem || '').trim() !== 'Transferência')
          .map((r: any) => ({
            data: r.data,
            proj: normProj(r.proj),
            mes: r.mes ? String(r.mes).slice(0, 10) : null,
            obs: r.obs,
            valor: Number(r.valor),
            fornecedor: r.fornecedor || '',
            conta: r.conta || '',
            situacao: r.situacao || '',
            descricao: r.descricao || '',
            origem: r._origem || r.origem || '',
            sub: r.sub || '',
            item: r.item || '',
            tipo: r.tipo || '',
            classified: !!r.classified
          }))
        for (let i = 0; i < toInsert.length; i += 500) {
          const { error } = await supabase.from('cf_extrato_rows').insert(toInsert.slice(i, i + 500))
          if (error) throw error
        }
        return NextResponse.json({ ok: true, count: toInsert.length })
      }
    }

    return NextResponse.json({ ok: true, count: rows?.length || 0 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
