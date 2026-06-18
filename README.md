# Controle Financeiro — Acta Robotics

## Setup

### 1. Variáveis de ambiente
Crie `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://sjuzirbvogqppqmdtbhp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
APP_PASSWORD=sua_senha_aqui
```

### 2. Banco de dados
Execute o arquivo `supabase-migration.sql` no SQL Editor do Supabase.

### 3. Instalar e rodar
```bash
npm install
npm run dev
```

### 4. Deploy no Vercel
- Conecte o repositório no Vercel
- Configure as variáveis de ambiente
- Root Directory: `controle-financeiro`
