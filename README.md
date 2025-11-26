# SmartEgg - Sistema de Gestão Avícola

Sistema completo para gestão de granjas de poedeiras, desenvolvido com React, TypeScript e Supabase.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Git instalado

### Passos para Deploy

1. **Fazer push do código para GitHub**
   ```bash
   git add .
   git commit -m "Preparando para deploy na Vercel"
   git push origin main
   ```

2. **Configurar projeto na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Importe seu repositório do GitHub
   - Configure as variáveis de ambiente

3. **Variáveis de Ambiente na Vercel**
   ```
   VITE_SUPABASE_URL=seu_supabase_url
   VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
   VITE_GEMINI_API_KEY=sua_gemini_api_key (opcional)
   ```

4. **Deploy automático**
   - A Vercel fará o build automaticamente
   - URL será gerada: `https://seu-projeto.vercel.app`

## 📋 Funcionalidades

- ✅ Autenticação com Supabase
- ✅ Gestão de Galpões e Lotes
- ✅ Controle de Produção Diária
- ✅ Gestão de Estoque Automática
- ✅ Controle Financeiro (Despesas e Vendas)
- ✅ Gestão de Clientes
- ✅ Sistema de Tarefas
- ✅ Formulações de Ração
- ✅ Dashboard com KPIs em tempo real
- ✅ IA Assistente (Gemini)

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Build Tool**: Vite
- **Deployment**: Vercel
- **AI**: Google Gemini (opcional)

## 🔧 Configuração Local

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Configure `.env.local` com as variáveis do Supabase:
   ```
   VITE_SUPABASE_URL=seu_supabase_url
   VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
   VITE_GEMINI_API_KEY=sua_gemini_api_key (opcional)
   ```
3. Run the app:
   `npm run dev`

## 📊 Supabase Schema

O sistema utiliza as seguintes tabelas:
- `sheds` - Galpões
- `flocks` - Lotes de aves
- `daily_records` - Registros diários
- `inventory` - Estoque
- `expenses` - Despesas
- `sales` - Vendas
- `clients` - Clientes
- `tasks` - Tarefas
- `feed_formulations` - Formulações de ração

## 🌐 Deploy Status

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/smartegg)

---

**Desenvolvido com ❤️ para avicultores brasileiros**
