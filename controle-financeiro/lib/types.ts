export interface BudgetRow {
  id?: number
  proj: string
  mes: string // ISO date YYYY-MM-DD
  tipo: string
  item: string
  sub: string
  valor: number
}

export interface ExtratoRow {
  id?: number
  data: string
  proj: string
  mes: string | null
  obs: string
  valor: number
  fornecedor: string
  conta: string
  situacao: string
  descricao: string
  origem: string
  sub: string
  item: string
  tipo: string
  classified: boolean
}

export interface ClassMapEntry {
  id?: number
  proj: string
  sub_key: string // lowercase sub
  sub: string
  item: string
  tipo: string
}

export type ActiveTab = 'financeiro' | 'caixa'
export type ActiveProj = 'all' | 'Finep' | 'NAVE ANP'
