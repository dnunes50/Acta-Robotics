import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const html = readFileSync(join(process.cwd(), 'public', 'dashboard.html'), 'utf-8')
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch {
    return new NextResponse('Dashboard not found', { status: 500 })
  }
}
