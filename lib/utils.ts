export const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function mesLbl(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

export function fmtM(v: number): string {
  const a = Math.abs(v)
  const s = v < 0 ? '-' : ''
  if (a >= 1e6) return `${s}R$${(a / 1e6).toFixed(1)}M`
  if (a >= 1e3) return `${s}R$${(a / 1e3).toFixed(0)}K`
  return `${s}R$${a.toFixed(0)}`
}

export function fmtF(v: number): string {
  return 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function sortedMonths(dateStrings: (string | null)[]): string[] {
  const map: Record<string, Date> = {}
  for (const d of dateStrings) {
    if (!d) continue
    const lbl = mesLbl(d)
    if (!map[lbl]) map[lbl] = new Date(d + 'T00:00:00')
  }
  return Object.entries(map).sort((a, b) => a[1].getTime() - b[1].getTime()).map(x => x[0])
}

export function groupByMes<T extends { mes: string | null; valor: number }>(rows: T[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) {
    const k = mesLbl(r.mes)
    if (k) out[k] = (out[k] || 0) + r.valor
  }
  return out
}
