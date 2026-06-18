import { NextResponse } from 'next/server'
import { saveBudget, saveExtrato, saveClassMap } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { type, rows, classMap } = await req.json()
    if (type === 'budget') {
      await saveBudget(rows)
      if (classMap) await saveClassMap(classMap)
    } else if (type === 'extrato') {
      await saveExtrato(rows)
    }
    return NextResponse.json({ ok: true, count: rows.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
