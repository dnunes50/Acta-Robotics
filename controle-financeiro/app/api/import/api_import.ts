import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { type, rows, classMap } = await req.json()

    if (type === 'budget') {
      // Clear and reinsert budget
      await supabase.from('cf_budget_rows').delete().neq('id', 0)
      if (rows?.length) {
        const toInsert = rows.map((r: any) => ({
          proj: r.proj, mes: r.mes instanceof Date ? r.mes.toISOString().slice(0,10) : r.mes,
          tipo: r.tipo, item: r.item, sub: r.sub, valor: r.valor
        }))
        for (let i = 0; i < toInsert.length; i += 500) {
          const { error } = await supabase.from('cf_budget_rows').insert(toInsert.slice(i, i+500))
          if (error) throw error
        }
      }
      // Save classMap
      if (classMap && Object.keys(classMap).length) {
        await supabase.from('cf_class_map').delete().neq('id', 0)
        const cmRows = Object.entries(classMap).map(([key, val]: [string, any]) => {
          const [proj, sub_key] = key.split('||')
          return { proj, sub_key, sub: val.sub, item: val.item, tipo: val.tipo }
        })
        for (let i = 0; i < cmRows.length; i += 500) {
          await supabase.from('cf_class_map').insert(cmRows.slice(i, i+500))
        }
      }
    }

    if (type === 'extrato') {
      await supabase.from('cf_extrato_rows').delete().neq('id', 0)
      if (rows?.length) {
        const toInsert = rows.map((r: any) => ({
          data: r.data, proj: r.proj,
          mes: r.mes instanceof Date ? r.mes.toISOString().slice(0,10) : r.mes,
          obs: r.obs, valor: r.valor, fornecedor: r.fornecedor,
          conta: r.conta, situacao: r.situacao, descricao: r.descricao,
          origem: r._origem || r.origem || '',
          sub: r.sub, item: r.item, tipo: r.tipo, classified: r.classified
        }))
        for (let i = 0; i < toInsert.length; i += 500) {
          const { error } = await supabase.from('cf_extrato_rows').insert(toInsert.slice(i, i+500))
          if (error) throw error
        }
      }
    }

    return NextResponse.json({ ok: true, count: rows?.length || 0 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
