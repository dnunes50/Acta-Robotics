interface Props {
  label: string
  value: string
  sub?: string
  accent?: 'green' | 'red' | 'yellow' | 'orange' | 'blue' | 'default'
}

const accentColors: Record<string, string> = {
  green: 'var(--green)',
  red: 'var(--red)',
  yellow: 'var(--yellow)',
  orange: 'var(--orange)',
  blue: 'var(--blue)',
  default: 'var(--orange)',
}

export default function KpiCard({ label, value, sub, accent = 'default' }: Props) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden"
         style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      <div className="absolute top-0 left-0 w-[3px] h-full rounded-l-xl"
           style={{ background: accentColors[accent] }} />
      <div className="text-[10px] mono uppercase tracking-wider mb-1.5 pl-1" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="text-lg font-semibold mono pl-1 truncate" title={value}>{value}</div>
      {sub && <div className="text-xs mt-0.5 pl-1" style={{ color: 'var(--muted)' }}
                   dangerouslySetInnerHTML={{ __html: sub }} />}
    </div>
  )
}
