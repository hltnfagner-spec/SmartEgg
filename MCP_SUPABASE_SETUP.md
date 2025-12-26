# Configuração MCP Supabase

## Passo 1: Obter Token de Acesso

1. **Acesse o Dashboard Supabase:**
   - Vá para https://supabase.com/dashboard
   - Faça login com sua conta

2. **Vá para Configurações da Organização:**
   - Clique no seu avatar (canto superior direito)
   - Selecione "Organization settings"
   - Vá para "Access tokens"

3. **Crie um Token de Acesso:**
   - Clique em "Generate new token"
   - Dê um nome: "MCP Access Token"
   - Selecione permissões: "Read & Write"
   - Copie o token (não será mostrado novamente)

## Passo 2: Configurar Variável de Ambiente

**No Windows (PowerShell):**
```powershell
$env:SUPABASE_ACCESS_TOKEN = "seu_token_aqui"
```

**No Windows (CMD):**
```cmd
set SUPABASE_ACCESS_TOKEN=seu_token_aqui
```

**No Linux/Mac:**
```bash
export SUPABASE_ACCESS_TOKEN="seu_token_aqui"
```

## Passo 3: Verificar Conexão

Após configurar o token, execute:
```bash
mcp0_list_organizations
```

## Passo 4: Listar Projetos

```bash
mcp0_list_projects
```

## Passo 5: Operações Disponíveis

Com MCP integrado, você pode:

### Gerenciamento de Projetos
- `mcp0_create_project` - Criar novo projeto
- `mcp0_get_project` - Obter detalhes do projeto
- `mcp0_pause_project` - Pausar projeto
- `mcp0_restore_project` - Restaurar projeto

### Gerenciamento de Branches
- `mcp0_create_branch` - Criar branch de desenvolvimento
- `mcp0_list_branches` - Listar branches
- `mcp0_merge_branch` - Mergear branch
- `mcp0_reset_branch` - Resetar branch
- `mcp0_rebase_branch` - Rebasear branch
- `mcp0_delete_branch` - Deletar branch

### Banco de Dados
- `mcp0_execute_sql` - Executar SQL
- `mcp0_apply_migration` - Aplicar migration
- `mcp0_list_tables` - Listar tabelas
- `mcp0_list_migrations` - Listar migrations
- `mcp0_list_extensions` - Listar extensões

### Edge Functions
- `mcp0_list_edge_functions` - Listar functions
- `mcp0_deploy_edge_function` - Deploy function
- `mcp0_get_edge_function` - Obter function

### Logs e Monitoramento
- `mcp0_get_logs` - Obter logs
- `mcp0_get_advisors` - Obter recomendações

## Exemplo de Uso

```bash
# Listar organizações
mcp0_list_organizations

# Listar projetos
mcp0_list_projects

# Executar SQL no projeto
mcp0_execute_sql --project_id=seu_project_id --query="SELECT COUNT(*) FROM users"

# Listar tabelas
mcp0_list_tables --project_id=seu_project_id
```

## Segurança

- Mantenha o token seguro e nunca compartilhe
- Use tokens com permissões mínimas necessárias
- Revogue tokens quando não forem mais necessários
