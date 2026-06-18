import * as XLSX from 'xlsx'
import { BudgetRow, ExtratoRow } from './types'

function normProj(p: string): string {
  const u = (p || '').trim().toUpperCase()
  if (u === 'FINEP') return 'Finep'
  if (u === 'NAVE ANP') return 'NAVE ANP'
  return p?.trim() || ''
}

function normProjFromConta(conta: string): string {
  const u = (conta || '').toUpperCase()
  if (u.includes('NAVE ANP')) return 'NAVE ANP'
  if (u.includes('FINEP')) return 'Finep'
  return ''
}

function parseMes(v: any): string | null {
  if (!v) return null
  let d: Date | null = null
  if (v instanceof Date) d = v
  else if (typeof v === 'number') {
    const info = XLSX.SSF.parse_date_code(v)
    d = new Date(info.y, info.m - 1, info.d)
  } else if (typeof v === 'string') {
    const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) d = new Date(+iso[1], +iso[2] - 1, +iso[3])
    const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (br) d = new Date(+br[3], +br[2] - 1, +br[1])
  }
  if (!d || isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function parseBudget(file: ArrayBuffer): { rows: BudgetRow[], classMap: Record<string, any> } {
  const wb = XLSX.read(file, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('extrato')) || wb.SheetNames[0]
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null }) as any[]

  const rows: BudgetRow[] = []
  const classMap: Record<string, any> = {}

  for (const r of data) {
    const pvr = String(r['Previsto x Real'] || '').trim()
    const proj = normProj(String(r['Projeto'] || ''))
    const sub = String(r['De para - SubItem da Despesa'] || '').trim()
    const item = String(r['De para - Item da Despesa'] || '').trim()
    const tipo = String(r['De para - Tipo da Despesa'] || '').trim()

    if (proj && sub && item) {
      classMap[`${proj}||${sub.toLowerCase()}`] = { sub, item, tipo }
    }

    if (pvr !== 'Previsto') continue
    const mes = parseMes(r['Mês / Ano'])
    if (!mes || !proj) continue

    rows.push({ proj, mes, tipo, item, sub, valor: parseFloat(r['Valor (R$)']) || 0 })
  }

  return { rows, classMap }
}

export function parseExtrato(
  file: ArrayBuffer,
  classMap: Record<string, any>
): ExtratoRow[] {
  const wb = XLSX.read(file, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('extrato')) || wb.SheetNames[0]
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null }) as any[]

  const rows: ExtratoRow[] = []
  const RESGATE_APLICA = /RESGATE|APLICA/i

  for (const r of data) {
    const origem = String(r['Origem do lançamento'] || '').trim()
    if (origem === 'Transferência') continue

    const valor = parseFloat(String(r['Valor (R$)'] || '0').replace(',', '.')) || 0
    if (valor === 0) continue

    const desc = String(r['Descrição'] || '').toUpperCase()
    if (RESGATE_APLICA.test(desc)) continue

    const conta = String(r['Conta bancária'] || '')
    const proj = normProjFromConta(conta)
    const obs = String(r['Observações'] || '').trim()

    const dataMov = r['Data movimento']
    let mes: string | null = null
    if (dataMov instanceof Date) {
      mes = `${dataMov.getFullYear()}-${String(dataMov.getMonth() + 1).padStart(2, '0')}-01`
    } else {
      mes = parseMes(dataMov)
    }

    const key = `${proj}||${obs.toLowerCase()}`
    const cl = classMap[key]
      || classMap[`Finep||${obs.toLowerCase()}`]
      || classMap[`NAVE ANP||${obs.toLowerCase()}`]

    rows.push({
      data: String(r['Data movimento'] || ''),
      proj,
      mes,
      obs,
      valor,
      fornecedor: String(r['Nome do fornecedor/cliente'] || '').trim(),
      conta,
      situacao: String(r['Situação'] || '').trim(),
      descricao: String(r['Descrição'] || '').trim(),
      origem,
      sub: cl ? cl.sub : obs,
      item: cl ? cl.item : '',
      tipo: cl ? cl.tipo : '',
      classified: !!cl,
    })
  }

  return rows
}
