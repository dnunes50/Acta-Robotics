import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Controle Financeiro — Acta Robotics',
  description: 'Controle Financeiro de Projetos FINEP e NAVE ANP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
