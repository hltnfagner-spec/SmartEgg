# Configuração de Recuperação de Senha - Supabase

## 📋 Como funciona o fluxo

1. **Usuário clica em "Esqueceu a senha?"** no Login
2. **Digita o email** na tela de recuperação
3. **Supabase envia email** com link contendo token
4. **Usuário clica no link** do email
5. **Aplicação detecta o token** e mostra formulário de redefinição
6. **Usuário define nova senha**
7. **Volta para login** com senha atualizada

## ⚙️ Configuração no Supabase Dashboard

### Passo 1: Acessar Authentication Settings

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **SmartEgg**
3. Vá em **Authentication** → **URL Configuration**

### Passo 2: Configurar Site URL

**Site URL:** Configure para o domínio onde sua aplicação está rodando

- **Desenvolvimento:** `http://localhost:3001`
- **Produção:** `https://smartegg.app.br`

⚠️ **IMPORTANTE:** Use `https://` para produção (com SSL)

### Passo 3: Configurar Redirect URLs

Adicione as seguintes URLs na lista de **Redirect URLs**:

**Para Desenvolvimento:**
```
http://localhost:3001/**
http://localhost:3001?type=recovery
http://localhost:3001?type=signup
```

**Para Produção (smartegg.app.br):**
```
https://smartegg.app.br/**
https://smartegg.app.br?type=recovery
https://smartegg.app.br?type=signup
https://smartegg.app.br#access_token=*
```

⚠️ **CRÍTICO:** Certifique-se de adicionar TODAS as URLs acima no Supabase Dashboard

### Passo 4: Configurar Email Template (Opcional)

1. Vá em **Authentication** → **Email Templates**
2. Selecione **Reset Password**
3. Verifique se o template contém `{{ .ConfirmationURL }}`

**Template padrão:**
```html
<h2>Redefinir Senha</h2>
<p>Clique no link abaixo para redefinir sua senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
```

## 🔍 Como o código detecta o token

### No componente `ForgotPassword.tsx`:
```typescript
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}?type=recovery`,
});
```

### No componente `App.tsx`:
```typescript
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type');
const isRecoveryRoute = urlParams.has('token_hash') && type === 'recovery';

if (isRecoveryRoute) {
  return <ResetPassword onSuccess={() => { /* ... */ }} />;
}
```

## 📧 Formato do link de recuperação

Quando o usuário clica no link do email, a URL será algo como:

```
http://localhost:3001?type=recovery&token_hash=abc123...&access_token=xyz789...
```

A aplicação detecta automaticamente:
- ✅ `type=recovery` → Identifica que é recuperação de senha
- ✅ `token_hash` → Token de autenticação do Supabase
- ✅ Exibe o formulário `ResetPassword`

## 🧪 Como testar

### 1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### 2. Acesse a aplicação:
```
http://localhost:3001
```

### 3. Teste o fluxo:
1. Clique em **"Entrar"**
2. Clique em **"Esqueceu a senha?"**
3. Digite um email cadastrado
4. Clique em **"Enviar Link de Recuperação"**
5. Verifique sua caixa de entrada (e spam)
6. Clique no link do email
7. Defina a nova senha
8. Faça login com a nova senha

## ⚠️ Problemas comuns

### Email não chega
- ✅ Verifique a pasta de **spam/lixo eletrônico**
- ✅ Confirme que o email está cadastrado no Supabase
- ✅ Veja os logs em **Authentication** → **Logs**

### Link não funciona
- ✅ Verifique se as **Redirect URLs** estão configuradas
- ✅ Confirme que a **Site URL** está correta
- ✅ Limpe o cache do navegador (`Ctrl + Shift + Delete`)

### Erro "Invalid redirect URL"
- ✅ Adicione a URL exata nas **Redirect URLs** do Supabase
- ✅ Inclua o wildcard `/**` para permitir todas as rotas

## 🔐 Segurança

- ✅ O token é válido por **1 hora** (padrão do Supabase)
- ✅ O token só pode ser usado **uma vez**
- ✅ A senha antiga é invalidada após a redefinição
- ✅ O usuário precisa fazer login novamente após redefinir

## 📱 Suporte a múltiplas portas

A aplicação usa `window.location.origin`, então funciona automaticamente em qualquer porta:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- Etc.

## ✅ Checklist de configuração

- [ ] Site URL configurada no Supabase
- [ ] Redirect URLs adicionadas no Supabase
- [ ] Email template verificado
- [ ] Servidor de desenvolvimento rodando
- [ ] Teste completo realizado
- [ ] Email de recuperação recebido
- [ ] Link do email funcionando
- [ ] Nova senha definida com sucesso
- [ ] Login com nova senha funcionando

---

**Última atualização:** 15/12/2025
