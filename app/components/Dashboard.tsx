'use client'
import { useState, useEffect, useCallback } from 'react'
import { loadBudget, loadExtrato, loadClassMap } from '@/lib/db'
import { BudgetRow, ExtratoRow } from '@/lib/types'
import { mesLbl, fmtM, fmtF, sortedMonths } from '@/lib/utils'
import ImportModal from './ImportModal'
import TabFinanceiro from './TabFinanceiro'
import TabCaixa from './TabCaixa'

export type ActiveTab = 'financeiro' | 'caixa'
export type ActiveProj = 'all' | 'Finep' | 'NAVE ANP'

export interface DashFilters {
  proj: ActiveProj
  ano: string
  mes: string
  tipo: string
  item: string
  sub: string
}

export default function Dashboard() {
  const [tab, setTab] = useState<ActiveTab>('financeiro')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading] = useState(true)

  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([])
  const [extratoRows, setExtratoRows] = useState<ExtratoRow[]>([])
  const [classMap, setClassMap] = useState<Record<string, any>>({})

  const [filters, setFilters] = useState<DashFilters>({
    proj: 'all', ano: 'all', mes: 'all', tipo: 'all', item: 'all', sub: 'all'
  })

  async function fetchData() {
    setLoading(true)
    try {
      const [bud, ext, cm] = await Promise.all([loadBudget(), loadExtrato(), loadClassMap()])
      setBudgetRows(bud)
      setExtratoRows(ext)
      setClassMap(cm)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const saved = localStorage.getItem('cf-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('cf-theme', next)
    document.documentElement.classList.toggle('light', next === 'light')
  }

  function logout() {
    localStorage.removeItem('cf-auth')
    window.location.reload()
  }

  const allMes = sortedMonths([...budgetRows, ...extratoRows].map(r => r.mes))
  const allAnos = [...new Set(allMes.map(m => {
    const parts = m.split('/')
    return parts.length === 2 ? `20${parts[1]}` : ''
  }).filter(Boolean))].sort()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-7 h-[52px]"
              style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold mono"
               style={{ background: 'var(--orange)' }}>A</div>
          <span className="text-xs font-medium mono uppercase tracking-wider" style={{ color: 'var(--dim)' }}>
            Acta Robotics · Controle Financeiro
          </span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs mono" style={{ color: 'var(--muted)' }}>carregando...</span>}
          <button onClick={toggleTheme} className="btn-sm">{theme === 'dark' ? '☀' : '🌙'}</button>
          <button onClick={() => setShowImport(true)} className="btn-sm">📥 Importar</button>
          <button onClick={logout} className="btn-sm">↩ Sair</button>
        </div>
      </header>

      <div className="px-7 py-5">
        {/* TABS */}
        <div className="flex gap-0 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          {(['financeiro', 'caixa'] as ActiveTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className="px-5 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      borderBottom: tab === t ? '2px solid var(--orange)' : '2px solid transparent',
                      color: tab === t ? 'var(--orange)' : 'var(--muted)',
                      background: 'transparent',
                      marginBottom: '-1px',
                    }}>
              {t === 'financeiro' ? '📊 Controle Financeiro' : '💰 Posição de Caixa'}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {tab === 'financeiro' && (
          <TabFinanceiro
            budgetRows={budgetRows}
            extratoRows={extratoRows}
            allMes={allMes}
            allAnos={allAnos}
            filters={filters}
            setFilters={setFilters}
          />
        )}
        {tab === 'caixa' && (
          <TabCaixa
            budgetRows={budgetRows}
            extratoRows={extratoRows}
            allMes={allMes}
          />
        )}
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={fetchData}
          classMap={classMap}
        />
      )}
    </div>
  )
}
