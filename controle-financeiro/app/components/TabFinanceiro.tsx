'use client'
import { useState, useMemo } from 'react'
import { BudgetRow, ExtratoRow } from '@/lib/types'
import { mesLbl, fmtM, fmtF, sortedMonths } from '@/lib/utils'
import { DashFilters } from './Dashboard'
import KpiCard from './KpiCard'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

interface Props {
  budgetRows: BudgetRow[]
  extratoRows: ExtratoRow[]
  allMes: string[]
  allAnos: string[]
  filters: DashFilters
  setFilters: (f: DashFilters) => void
}

interface BudTableRow {
  proj: string; tipo: string; item: string; sub: string
  bt: number; bp: number; real: number; realAcc: number
}

export default function TabFinanceiro({ budgetRows, extratoRows, allMes, allAnos, filters, setFilters }: Props) {
  const [sortCol, setSortCol] = useState('data')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [pDe, setPDe] = useState('')
  const [pAte, setPAte] = useState('')
  const [budDe, setBudDe] = useState('')
  const [budAte, setBudAte] = useState('')
  const PAGE_SIZE = 50
  const f = filters

  const mesDateMap = useMemo(() => {
    const m: Record<string, Date> = {}
    for (const r of [...budgetRows, ...extratoRows]) {
      if (r.mes) { const k = mesLbl(r.mes); if (!m[k]) m[k] = new Date(r.mes + 'T00:00:00') }
    }
    return m
  }, [budgetRows, extratoRows])

  const todos_tipos = useMemo(() => [...new Set(budgetRows.map(r => r.tipo).filter(Boolean))].sort(), [budgetRows])
  const todos_items = useMemo(() => [...new Set(budgetRows.filter(r => f.tipo === 'all' || r.tipo === f.tipo).map(r => r.item).filter(Boolean))].sort(), [budgetRows, f.tipo])
  const todos_subs  = useMemo(() => [...new Set(budgetRows.filter(r => (f.tipo === 'all' || r.tipo === f.tipo) && (f.item === 'all' || r.item === f.item)).map(r => r.sub).filter(Boolean))].sort(), [budgetRows, f.tipo, f.item])

  function fBud(extra?: Partial<DashFilters>) {
    const ff = { ...f, ...extra }
    return budgetRows.filter(r => {
      if (ff.proj !== 'all' && r.proj !== ff.proj) return false
      if (ff.ano !== 'all' && r.mes && new Date(r.mes).getFullYear().toString() !== ff.ano) return false
      if (ff.mes !== 'all' && mesLbl(r.mes) !== ff.mes) return false
      if (ff.tipo !== 'all' && r.tipo !== ff.tipo) return false
      if (ff.item !== 'all' && r.item !== ff.item) return false
      if (ff.sub !== 'all' && r.sub !== ff.sub) return false
      return true
    })
  }

  function fExt(extra?: Partial<DashFilters>) {
    const ff = { ...f, ...extra }
    return extratoRows.filter(r => {
      if (r.valor >= 0) return false
      if (ff.proj !== 'all' && r.proj !== ff.proj) return false
      if (ff.ano !== 'all' && r.mes && new Date(r.mes).getFullYear().toString() !== ff.ano) return false
      if (ff.mes !== 'all' && mesLbl(r.mes) !== ff.mes) return false
      if (ff.tipo !== 'all' && r.tipo !== ff.tipo) return false
      if (ff.item !== 'all' && r.item !== ff.item) return false
      if (ff.sub !== 'all' && r.sub !== ff.sub) return false
      return true
    })
  }

  function inPer(r: BudgetRow | ExtratoRow, de: string, ate: string): boolean {
    if (!de && !ate) return true
    if (!r.mes) return false
    const d = new Date(r.mes + 'T00:00:00')
    if (de && mesDateMap[de] && d < mesDateMap[de]) return false
    if (ate && mesDateMap[ate]) {
      const end = new Date(mesDateMap[ate].getFullYear(), mesDateMap[ate].getMonth() + 1, 0)
      if (d > end) return false
    }
    return true
  }

  const bud = fBud()
  const ext = fExt()
  const budAll = budgetRows.filter(r =>
    (f.proj === 'all' || r.proj === f.proj) &&
    (f.tipo === 'all' || r.tipo === f.tipo) &&
    (f.item === 'all' || r.item === f.item) &&
    (f.sub === 'all' || r.sub === f.sub)
  )
  const extAll = extratoRows.filter(r =>
    r.valor < 0 &&
    (f.proj === 'all' || r.proj === f.proj) &&
    (f.tipo === 'all' || r.tipo === f.tipo) &&
    (f.item === 'all' || r.item === f.item) &&
    (f.sub === 'all' || r.sub === f.sub)
  )

  const budTot = budAll.reduce((s, r) => s + r.valor, 0)
  const realTot = extAll.reduce((s, r) => s + r.valor, 0)
  const budPer = bud.reduce((s, r) => s + r.valor, 0)
  const realPer = ext.reduce((s, r) => s + r.valor, 0)
  const saldoTot = budTot - realTot
  const pctTot = budTot !== 0 ? (realTot / budTot * 100) : 0
  const pctPer = budPer !== 0 ? (realPer / budPer * 100) : 0

  const budPerR = budAll.filter(r => inPer(r, pDe, pAte)).reduce((s, r) => s + r.valor, 0)
  const realPerR = extAll.filter(r => inPer(r, pDe, pAte)).reduce((s, r) => s + r.valor, 0)
  const saldoPerR = budPerR - realPerR
  const pctPerR = budPerR !== 0 ? (realPerR / budPerR * 100) : 0

  const ttStyle = { backgroundColor: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11 }

  const catData = useMemo(() => {
    const cats = [...new Set([...bud.map(r => r.item), ...ext.map(r => r.item)].filter(Boolean))]
    const gB: Record<string, number> = {}; bud.forEach(r => { gB[r.item] = (gB[r.item] || 0) + r.valor })
    const gE: Record<string, number> = {}; ext.forEach(r => { gE[r.item] = (gE[r.item] || 0) + r.valor })
    return cats.map(c => ({ cat: c, budget: Math.abs(gB[c] || 0), realizado: Math.abs(gE[c] || 0) }))
  }, [bud, ext])

  const mesData = useMemo(() => {
    const gB: Record<string, number> = {}; bud.forEach(r => { const k = mesLbl(r.mes); if (k) gB[k] = (gB[k] || 0) + r.valor })
    const gE: Record<string, number> = {}; ext.forEach(r => { const k = mesLbl(r.mes); if (k) gE[k] = (gE[k] || 0) + r.valor })
    return allMes.map(m => ({ mes: m, budget: Math.abs(gB[m] || 0), realizado: Math.abs(gE[m] || 0) }))
  }, [bud, ext, allMes])

  const budTableData = useMemo<BudTableRow[]>(() => {
    const budPerFilter = budAll.filter(r => inPer(r, budDe, budAte))
    const extPerFilter = extAll.filter(r => inPer(r, budDe, budAte))
    const map: Record<string, BudTableRow> = {}
    const key = (r: { proj: string; tipo: string; item: string; sub: string }) =>
      `${r.proj}||${r.tipo}||${r.item}||${r.sub}`
    const init = (r: { proj: string; tipo: string; item: string; sub: string }): BudTableRow =>
      ({ proj: r.proj, tipo: r.tipo, item: r.item, sub: r.sub, bt: 0, bp: 0, real: 0, realAcc: 0 })
    budAll.forEach(r => { const k = key(r); if (!map[k]) map[k] = init(r); map[k].bt += r.valor })
    budPerFilter.forEach(r => { const k = key(r); if (!map[k]) map[k] = init(r); map[k].bp += r.valor })
    extPerFilter.forEach(r => { const k = key(r); if (!map[k]) map[k] = init(r); map[k].real += r.valor })
    extAll.forEach(r => { const k = key(r); if (!map[k]) map[k] = init(r); map[k].realAcc += r.valor })
    return Object.values(map).sort((a, b) => a.proj.localeCompare(b.proj) || a.item.localeCompare(b.item))
  }, [budAll, extAll, budDe, budAte])

  const lancamentos = useMemo(() => {
    let rows = ext.filter(r => {
      if (!search) return true
      return (r.fornecedor + r.obs + r.sub + r.item + r.descricao).toLowerCase().includes(search.toLowerCase())
    })
    rows = [...rows].sort((a, b) => {
      const av: string | number = sortCol === 'valor' ? a.valor : sortCol === 'data' ? (a.mes || '') : ((a as Record<string, unknown>)[sortCol] as string) || ''
      const bv: string | number = sortCol === 'valor' ? b.valor : sortCol === 'data' ? (b.mes || '') : ((b as Record<string, unknown>)[sortCol] as string) || ''
      const c = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? c : -c
    })
    return rows
  }, [ext, search, sortCol, sortDir])

  const pageRows = lancamentos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(lancamentos.length / PAGE_SIZE)

  function setF(key: keyof DashFilters, val: string) {
    setFilters({ ...f, [key]: val })
  }

  function sortBy(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function Sel({ val, set, opts, lbl }: { val: string; set: (v: string) => void; opts: [string, string][]; lbl: string }) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{lbl}</span>
        <select value={val} onChange={e => set(e.target.value)} className="cf-select">
          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div>
      {/* Global filters */}
      <div className="flex flex-wrap gap-2.5 mb-5 items-center">
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg3)' }}>
          {(['all', 'Finep', 'NAVE ANP'] as const).map(p => (
            <button key={p} onClick={() => setF('proj', p)}
                    className="px-3 py-1 rounded-md text-xs font-medium mono transition-all"
                    style={{
                      background: f.proj === p ? p === 'Finep' ? 'rgba(255,107,0,.2)' : p === 'NAVE ANP' ? 'rgba(52,152,219,.2)' : 'rgba(255,255,255,.08)' : 'transparent',
                      color: f.proj === p ? p === 'Finep' ? 'var(--orange)' : p === 'NAVE ANP' ? 'var(--blue)' : 'var(--text)' : 'var(--muted)',
                      border: f.proj === p ? `1px solid ${p === 'Finep' ? 'var(--orange)' : p === 'NAVE ANP' ? 'var(--blue)' : 'rgba(255,255,255,.15)'}` : '1px solid transparent'
                    }}>
              {p === 'all' ? 'Todos' : p === 'Finep' ? 'FINEP' : 'NAVE ANP'}
            </button>
          ))}
        </div>
        <div className="w-px h-6" style={{ background: 'var(--border)' }} />
        <Sel val={f.ano} set={v => setF('ano', v)} opts={[['all', 'Todos'], ...allAnos.map(a => [a, a] as [string, string])]} lbl="Ano" />
        <Sel val={f.mes} set={v => setF('mes', v)} opts={[['all', 'Todos os Meses'], ...allMes.map(m => [m, m] as [string, string])]} lbl="Mês" />
        <Sel val={f.tipo} set={v => setFilters({ ...f, tipo: v, item: 'all', sub: 'all' })} opts={[['all', 'Todos'], ...todos_tipos.map(t => [t, t] as [string, string])]} lbl="Tipo" />
        <Sel val={f.item} set={v => setFilters({ ...f, item: v, sub: 'all' })} opts={[['all', 'Todos'], ...todos_items.map(t => [t, t] as [string, string])]} lbl="Item" />
        <Sel val={f.sub} set={v => setF('sub', v)} opts={[['all', 'Todos'], ...todos_subs.map(t => [t, t] as [string, string])]} lbl="SubItem" />
      </div>

      {/* KPIs Total */}
      <div className="sec-title mb-3">Resumo Total</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
        <KpiCard label="Budget Total" value={fmtM(Math.abs(budTot))} sub="Orçamento completo" />
        <KpiCard label="Realizado Total" value={fmtM(Math.abs(realTot))} sub={`<span style="background:rgba(255,107,0,.15);color:var(--orange);padding:1px 6px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:10px">${Math.abs(pctTot).toFixed(1)}% executado</span>`} />
        <KpiCard label="Saldo Total" value={fmtM(Math.abs(saldoTot))} sub={saldoTot <= 0 ? 'Dentro do orçamento' : 'Acima do orçamento'} accent={saldoTot <= 0 ? 'green' : 'red'} />
      </div>

      {/* KPIs Período */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="sec-title flex-1 mb-0">Acumulado do Período</div>
        <div className="flex gap-2 items-center flex-wrap">
          <Sel val={pDe} set={setPDe} opts={[['', 'Início'], ...allMes.map(m => [m, m] as [string, string])]} lbl="De" />
          <Sel val={pAte} set={setPAte} opts={[['', 'Fim'], ...allMes.map(m => [m, m] as [string, string])]} lbl="Até" />
          {(pDe || pAte) && <button onClick={() => { setPDe(''); setPAte('') }} className="text-[11px] mono px-2 py-1 rounded" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--muted)' }}>✕</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-6">
        <KpiCard label="Budget Período" value={fmtM(Math.abs(budPerR))} sub={pDe || pAte ? `${pDe || 'início'} – ${pAte || 'fim'}` : 'Todo o período'} />
        <KpiCard label="Realizado Acumulado" value={fmtM(Math.abs(realPerR))} sub={`<span style="background:rgba(255,107,0,.15);color:var(--orange);padding:1px 6px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:10px">${Math.abs(pctPerR).toFixed(1)}% do período</span>`} />
        <KpiCard label="Saldo Período" value={fmtM(Math.abs(saldoPerR))} sub={saldoPerR <= 0 ? 'Dentro do orçamento' : 'Acima do orçamento'} accent={saldoPerR <= 0 ? 'green' : 'red'} />
      </div>

      {/* Charts */}
      <div className="sec-title mb-3">Evolução</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <div className="cf-card p-5">
          <div className="cf-card-title mb-4">Budget × Realizado por Categoria</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={catData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="cat" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} tickFormatter={fmtM} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => fmtF(v)} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#888' }} />
              <Bar dataKey="budget" name="Budget" fill="rgba(255,255,255,.1)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="rgba(255,107,0,.75)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="cf-card p-5">
          <div className="cf-card-title mb-4">Budget × Realizado por Mês</div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={mesData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} tickFormatter={fmtM} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => fmtF(v)} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#888' }} />
              <Line type="monotone" dataKey="budget" name="Budget" stroke="rgba(255,255,255,.3)" strokeDasharray="4 3" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="realizado" name="Realizado" stroke="var(--orange)" dot={{ r: 3, fill: 'var(--orange)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Table */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="sec-title flex-1 mb-0">Budget × Realizado por Item</div>
        <div className="flex gap-2 items-center">
          <Sel val={budDe} set={setBudDe} opts={[['', 'Início'], ...allMes.map(m => [m, m] as [string, string])]} lbl="De" />
          <Sel val={budAte} set={setBudAte} opts={[['', 'Fim'], ...allMes.map(m => [m, m] as [string, string])]} lbl="Até" />
          {(budDe || budAte) && <button onClick={() => { setBudDe(''); setBudAte('') }} className="text-[11px] mono px-2 py-1 rounded" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--muted)' }}>✕</button>}
        </div>
      </div>
      <div className="cf-card mb-6 overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead><tr>
              {['Projeto','Tipo','Item','SubItem','Budget Total','Budget Per.','Real Per.','Saldo Per.','Real Acc.','Saldo Total','%','Prog.'].map(h => (
                <th key={h} className={`cf-th ${['Budget Total','Budget Per.','Real Per.','Saldo Per.','Real Acc.','Saldo Total','%'].includes(h) ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {budTableData.map((r, i) => {
                const aBT = Math.abs(r.bt), aBP = Math.abs(r.bp), aR = Math.abs(r.real), aRA = Math.abs(r.realAcc)
                const sP = r.bp - r.real, sT = r.bt - r.realAcc
                const pct = aBP > 0 ? (aR / aBP * 100) : 0
                const bW = Math.min(pct, 100)
                return (
                  <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="cf-td"><span className={`pill ${r.proj === 'Finep' ? 'pill-finep' : 'pill-nave'}`}>{r.proj}</span></td>
                    <td className="cf-td text-xs" style={{ color: 'var(--muted)' }}>{r.tipo || '—'}</td>
                    <td className="cf-td text-xs">{r.item || '—'}</td>
                    <td className="cf-td text-xs" style={{ color: 'var(--muted)' }}>{r.sub || '—'}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--red)' }}>{aBT > 0 ? fmtF(-aBT) : '—'}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--red)' }}>{aBP > 0 ? fmtF(-aBP) : '—'}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: aR > 0 ? 'var(--red)' : undefined }}>{aR > 0 ? fmtF(-aR) : '—'}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: sP <= 0 ? 'var(--green)' : 'var(--red)' }}>{aBP > 0 ? fmtF(sP) : '—'}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: aRA > 0 ? 'var(--red)' : undefined }}>{aRA > 0 ? fmtF(-aRA) : '—'}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: sT <= 0 ? 'var(--green)' : 'var(--red)' }}>{aBT > 0 ? fmtF(sT) : '—'}</td>
                    <td className="cf-td text-right mono text-xs">{aBP > 0 ? pct.toFixed(1) + '%' : '—'}</td>
                    <td className="cf-td">
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.07)' }}>
                        <div className="h-full rounded-full" style={{ width: bW + '%', background: pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--yellow)' : 'var(--green)' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {budTableData.length > 0 && (() => {
                const tBT = budTableData.reduce((s, r) => s + r.bt, 0)
                const tBP = budTableData.reduce((s, r) => s + r.bp, 0)
                const tR  = budTableData.reduce((s, r) => s + r.real, 0)
                const tRA = budTableData.reduce((s, r) => s + r.realAcc, 0)
                const tSP = tBP - tR, tST = tBT - tRA
                const tPct = tBP !== 0 ? (tR / tBP * 100) : 0
                return (
                  <tr style={{ fontWeight: 600, borderTop: '2px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.03)' }}>
                    <td className="cf-td mono" colSpan={4}>TOTAL</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--red)' }}>{fmtF(-Math.abs(tBT))}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--red)' }}>{fmtF(-Math.abs(tBP))}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--red)' }}>{fmtF(-Math.abs(tR))}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: tSP <= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtF(tSP)}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--red)' }}>{fmtF(-Math.abs(tRA))}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: tST <= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtF(tST)}</td>
                    <td className="cf-td text-right mono text-xs">{tPct.toFixed(1)}%</td>
                    <td className="cf-td" />
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lancamentos */}
      <div className="sec-title mb-3">Lançamentos Realizados</div>
      <div className="cf-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs mono" style={{ color: 'var(--muted)' }}>{lancamentos.length} lançamentos</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                 placeholder="Buscar..."
                 className="px-3 py-1.5 text-xs rounded-lg outline-none w-48"
                 style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead><tr>
              {[['data','Data'],['proj','Projeto'],['tipo','Tipo'],['item','Item'],['sub','SubItem'],['descricao','Descrição'],['fornecedor','Fornecedor'],['valor','Valor']].map(([col, lbl]) => (
                <th key={col} className="cf-th cursor-pointer hover:text-white" onClick={() => { sortBy(col); setPage(1) }}>
                  {lbl}{sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {pageRows.length === 0
                ? <tr><td colSpan={8} className="cf-td text-center" style={{ color: 'var(--muted)' }}>Nenhum lançamento</td></tr>
                : pageRows.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="cf-td mono text-xs" style={{ color: 'var(--muted)' }}>{r.data}</td>
                    <td className="cf-td"><span className={`pill ${r.proj === 'Finep' ? 'pill-finep' : 'pill-nave'}`}>{r.proj}</span></td>
                    <td className="cf-td text-xs" style={{ color: 'var(--muted)' }}>{r.tipo}</td>
                    <td className="cf-td text-xs">{r.item}</td>
                    <td className="cf-td text-xs" style={{ color: 'var(--muted)' }}>{r.sub}</td>
                    <td className="cf-td text-xs" style={{ color: 'var(--dim)', maxWidth: 200 }} title={r.descricao}>{r.descricao}</td>
                    <td className="cf-td text-xs" style={{ maxWidth: 160 }}>{r.fornecedor}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--red)' }}>{fmtF(r.valor)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 px-4 py-2.5 text-xs mono flex-wrap" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
            <span>{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', opacity: page === 1 ? 0.3 : 1 }}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages).map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">…</span>}
                <button onClick={() => setPage(p)} className="px-2 py-0.5 rounded" style={{ background: p === page ? 'var(--orange)' : 'var(--bg3)', color: p === page ? 'white' : 'var(--dim)', border: '1px solid var(--border)' }}>{p}</button>
              </span>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', opacity: page === totalPages ? 0.3 : 1 }}>→</button>
          </div>
        )}
      </div>
    </div>
  )
}
