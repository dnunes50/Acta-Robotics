# Acta Robotics — Posição de Caixa

Sistema de gestão de caixa com histórico, projeção e alertas de liquidez.

---

## Estrutura do projeto

```
acta-caixa/
├── index.html     ← sistema completo (único arquivo)
├── vercel.json    ← configuração de deploy
└── README.md      ← este arquivo
```

---

## Passo 1 — Configurar o Supabase

### 1.1 Criar conta e projeto
1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **New Project**
3. Nome: `acta-caixa` | Região: **South America (São Paulo)** | Defina uma senha
4. Aguarde ~2 minutos para provisionar

### 1.2 Criar a tabela
No painel do Supabase, vá em **SQL Editor** e execute:

```sql
create table extratos (
  id uuid default gen_random_uuid() primary key,
  data_movimento date not null,
  nome_fornecedor text,
  descricao text,
  tipo text,
  valor numeric not null,
  saldo_conta numeric not null,
  situacao text,
  categoria text,
  centro_custo text,
  created_at timestamp default now()
);

create index on extratos(data_movimento);
create index on extratos(situacao);

-- Libera acesso público (necessário para funcionar sem login)
alter table extratos enable row level security;

create policy "acesso_publico" on extratos
  for all using (true) with check (true);
```

### 1.3 Pegar as credenciais
No painel do Supabase, vá em **Settings → API** e copie:
- **Project URL** → ex: `https://abcdefgh.supabase.co`
- **anon public** key → chave longa começando com `eyJ...`

---

## Passo 2 — Configurar o index.html

Abra o arquivo `index.html` e substitua as linhas no topo do `<script>`:

```javascript
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'   // ← cole aqui
const SUPABASE_KEY = 'SUA_ANON_KEY_AQUI'                  // ← cole aqui
const SALDO_INICIAL = 6490.00                              // ← ajuste se necessário
```

---

## Passo 3 — Publicar no GitHub

```bash
# No terminal, dentro da pasta acta-caixa/
git init
git add .
git commit -m "deploy inicial acta caixa"
git branch -M main

# Crie um repositório no github.com (pode ser privado) e rode:
git remote add origin https://github.com/SEU_USUARIO/acta-caixa.git
git push -u origin main
```

---

## Passo 4 — Deploy no Vercel

1. Acesse https://vercel.com e crie uma conta (pode entrar com GitHub)
2. Clique em **Add New Project**
3. Selecione o repositório `acta-caixa`
4. **Framework Preset:** Other
5. Deixe todo o resto padrão
6. Clique em **Deploy**

Em ~30 segundos você terá uma URL tipo:
```
https://acta-caixa.vercel.app
```

---

## Passo 5 — Usar o sistema

1. Acesse a URL gerada pelo Vercel
2. Vá na aba **Importar**
3. Selecione o arquivo `.xls` do extrato financeiro
4. Clique em **Confirmar e Salvar no Banco**
5. Os dados ficam salvos no Supabase — qualquer pessoa com o link vê o painel atualizado

### Atualizar mês a mês
Quando tiver um novo extrato:
1. Exporte o extrato completo (todos os meses) do Inter
2. Importe pelo sistema — ele substitui os dados antigos pelos novos automaticamente

---

## Atualizar o sistema após mudanças

Se fizer alterações no `index.html`:

```bash
git add .
git commit -m "atualização do sistema"
git push
```

O Vercel faz o novo deploy automaticamente em ~30 segundos.
