'use client'
import { useState, useMemo } from 'react'
import { BudgetRow, ExtratoRow } from '@/lib/types'
import { mesLbl, fmtM, fmtF, sortedMonths, groupByMes } from '@/lib/utils'
import KpiCard from './KpiCard'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const RESGATE_APLICA = /RESGATE|APLICA/i

interface Props {
  budgetRows: BudgetRow[]
  extratoRows: ExtratoRow[]
  allMes: string[]
}

type TableRowDef = {
  lbl: string
  fn: (p: string) => number | null
  bold?: boolean
  pct?: boolean
}

export default function TabCaixa({ budgetRows, extratoRows, allMes }: Props) {
  const [proj, setProj] = useState('all')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')

  const mesDateMap = useMemo(() => {
    const m: Record<string, Date> = {}
    for (const r of [...budgetRows, ...extratoRows]) {
      if (r.mes) { const k = mesLbl(r.mes); if (!m[k]) m[k] = new Date(r.mes + 'T00:00:00') }
    }
    return m
  }, [budgetRows, extratoRows])

  function inPeriodo(r: ExtratoRow) {
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

  const receitas = useMemo(() => extratoRows.filter(r =>
    r.valor > 0 &&
    r.origem !== 'Transferência' &&
    !RESGATE_APLICA.test(r.descricao || '') &&
    (proj === 'all' || r.proj === proj) &&
    inPeriodo(r)
  ), [extratoRows, proj, de, ate])

  const despesas = useMemo(() => extratoRows.filter(r =>
    r.valor < 0 &&
    (proj === 'all' || r.proj === proj) &&
    inPeriodo(r)
  ), [extratoRows, proj, de, ate])

  function getBudRest(p: string): number {
    const bud = budgetRows.filter(r => p === 'all' || r.proj === p)
    const ext = extratoRows.filter(r => (p === 'all' || r.proj === p) && r.valor < 0)
    return Math.abs(bud.reduce((s, r) => s + r.valor, 0)) - Math.abs(ext.reduce((s, r) => s + r.valor, 0))
  }

  function getRecAll(p: string): number {
    return extratoRows.filter(r => r.valor > 0 && r.origem !== 'Transferência' && !RESGATE_APLICA.test(r.descricao || '') && (p === 'all' || r.proj === p)).reduce((s, r) => s + r.valor, 0)
  }

  function getDepAll(p: string): number {
    return Math.abs(extratoRows.filter(r => r.valor < 0 && (p === 'all' || r.proj === p)).reduce((s, r) => s + r.valor, 0))
  }

  function getSaldo(p: string): number {
    return getRecAll(p) - getDepAll(p)
  }

  function getCob(p: string): number | null {
    const s = getSaldo(p)
    const b = getBudRest(p)
    return b > 0 ? s / b * 100 : null
  }

  const totalRec = receitas.reduce((s, r) => s + r.valor, 0)
  const totalDesp = Math.abs(despesas.reduce((s, r) => s + r.valor, 0))
  const saldo = totalRec - totalDesp
  const budRest = getBudRest(proj)
  const cobertura = budRest > 0 ? (saldo / budRest * 100) : null

  const chartData = useMemo(() => {
    const recMap = groupByMes(receitas)
    const despMap: Record<string, number> = {}
    for (const r of despesas) {
      const k = mesLbl(r.mes); if (k) despMap[k] = (despMap[k] || 0) + Math.abs(r.valor)
    }
    let acc = 0
    return allMes.map(m => {
      acc += (recMap[m] || 0) - (despMap[m] || 0)
      return { mes: m, entradas: recMap[m] || 0, saidas: despMap[m] || 0, saldoAcc: acc }
    })
  }, [receitas, despesas, allMes])

  const ttStyle = { backgroundColor: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11 }

  const tableRows: TableRowDef[] = [
    { lbl: 'Receita Total',     fn: (p) => getRecAll(p) },
    { lbl: 'Despesa Realizada', fn: (p) => getDepAll(p) },
    { lbl: 'Saldo em Caixa',   fn: (p) => getSaldo(p), bold: true },
    { lbl: 'Budget Restante',  fn: (p) => getBudRest(p) },
    { lbl: 'Cobertura %',      fn: (p) => getCob(p), pct: true, bold: true },
  ]

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[11px] mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Projeto</span>
          <select value={proj} onChange={e => setProj(e.target.value)} className="cf-select">
            <option value="all">Todos</option>
            <option value="Finep">FINEP</option>
            <option value="NAVE ANP">NAVE ANP</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>De</span>
          <select value={de} onChange={e => setDe(e.target.value)} className="cf-select">
            <option value="">Todos</option>
            {allMes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Até</span>
          <select value={ate} onChange={e => setAte(e.target.value)} className="cf-select">
            <option value="">Todos</option>
            {allMes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {(de || ate) && (
          <button onClick={() => { setDe(''); setAte('') }}
                  className="text-[11px] mono px-2.5 py-1 rounded"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            ✕ Limpar
          </button>
        )}
      </div>

      {/* Alert */}
      {cobertura !== null && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{
          background: cobertura >= 100 ? 'rgba(46,204,113,.08)' : 'rgba(231,76,60,.08)',
          border: `1px solid ${cobertura >= 100 ? 'rgba(46,204,113,.25)' : 'rgba(231,76,60,.25)'}`,
          color: cobertura >= 100 ? 'var(--green)' : 'var(--red)'
        }}>
          {cobertura >= 100
            ? `✓ Caixa suficiente: cobre ${cobertura.toFixed(1)}% do budget restante.`
            : `⚠ Atenção: caixa cobre apenas ${cobertura.toFixed(1)}% do budget restante. Faltam ${fmtF(budRest - saldo)}.`}
        </div>
      )}

      {/* KPIs */}
      <div className="sec-title mb-3">Resumo de Caixa</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
        <KpiCard label="Total Receitas" value={fmtM(totalRec)} sub="Entradas no caixa" />
        <KpiCard label="Total Despesas" value={fmtM(totalDesp)} sub="Saídas realizadas" />
        <KpiCard label="Saldo em Caixa" value={fmtM(saldo)} sub={saldo >= 0 ? 'Positivo' : 'Negativo'} accent={saldo >= 0 ? 'green' : 'red'} />
        <KpiCard label="Budget Restante" value={fmtM(budRest)} sub="A executar" />
        <KpiCard label="Cobertura" value={cobertura !== null ? cobertura.toFixed(1) + '%' : '—'} sub="Caixa ÷ Budget restante" accent={cobertura === null ? 'default' : cobertura >= 100 ? 'green' : cobertura >= 60 ? 'yellow' : 'red'} />
      </div>

      {/* Charts */}
      <div className="sec-title mb-3">Evolução</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <div className="cf-card p-5">
          <div className="cf-card-title mb-4">Entradas × Saídas por Mês</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} tickFormatter={fmtM} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => fmtF(v)} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#888' }} />
              <Bar dataKey="entradas" name="Entradas" fill="rgba(46,204,113,.7)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="rgba(231,76,60,.6)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="cf-card p-5">
          <div className="cf-card-title mb-4">Saldo de Caixa Acumulado</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#555' }} tickFormatter={fmtM} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => fmtF(v)} />
              <Line type="monotone" dataKey="saldoAcc" name="Saldo Acumulado" stroke="#3498DB" fill="rgba(52,152,219,.08)" dot={{ r: 3, fill: '#3498DB' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table by project */}
      <div className="sec-title mb-3">Detalhamento por Projeto</div>
      <div className="cf-card mb-6 overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="cf-th"></th>
            <th className="cf-th text-right">FINEP</th>
            <th className="cf-th text-right">NAVE ANP</th>
            <th className="cf-th text-right">Total</th>
          </tr></thead>
          <tbody>
            {tableRows.map(row => {
              const vF = row.fn('Finep')
              const vN = row.fn('NAVE ANP')
              const vT = row.pct ? getCob('all') : (typeof vF === 'number' && typeof vN === 'number' ? vF + vN : null)
              const fmt = (v: number | null) => v === null ? '—' : row.pct ? v.toFixed(1) + '%' : fmtF(v)
              return (
                <tr key={row.lbl} style={row.bold ? { fontWeight: 600, borderTop: '1px solid var(--border)' } : {}}>
                  <td className="cf-td" style={{ color: 'var(--muted)', fontSize: 12 }}>{row.lbl}</td>
                  <td className="cf-td text-right mono">{fmt(vF)}</td>
                  <td className="cf-td text-right mono">{fmt(vN)}</td>
                  <td className="cf-td text-right mono">{fmt(vT)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Receitas table */}
      <div className="sec-title mb-3">Entradas Detalhadas</div>
      <div className="cf-card overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead><tr>
              <th className="cf-th">Data</th>
              <th className="cf-th">Projeto</th>
              <th className="cf-th">Descrição</th>
              <th className="cf-th">Fornecedor</th>
              <th className="cf-th text-right">Valor</th>
            </tr></thead>
            <tbody>
              {receitas.length === 0
                ? <tr><td colSpan={5} className="cf-td text-center" style={{ color: 'var(--muted)' }}>Sem receitas</td></tr>
                : [...receitas].sort((a, b) => (b.mes || '').localeCompare(a.mes || '')).map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="cf-td mono text-xs" style={{ color: 'var(--muted)' }}>{r.data}</td>
                    <td className="cf-td"><span className={`pill ${r.proj === 'Finep' ? 'pill-finep' : 'pill-nave'}`}>{r.proj}</span></td>
                    <td className="cf-td text-xs" style={{ color: 'var(--dim)', maxWidth: 220 }}>{r.descricao}</td>
                    <td className="cf-td text-xs">{r.fornecedor}</td>
                    <td className="cf-td text-right mono text-xs" style={{ color: 'var(--green)' }}>{fmtF(r.valor)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
