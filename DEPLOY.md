# 🚀 Guia de Deploy - Elithe Racing

## Visão Geral

Este guia orienta o deploy do Elithe Racing em produção:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway ou Render (Express API)
- **Database**: Supabase (já configurado)

---

## 📋 Pré-requisitos

- [ ] Conta no [Vercel](https://vercel.com) (grátis)
- [ ] Conta no [Railway](https://railway.app) ou [Render](https://render.com) (grátis)
- [ ] Código no GitHub (recomendado para deploy automático)
- [ ] Credenciais do Supabase

---

## 🎯 Parte 1: Deploy do Backend (Railway)

### 1.1. Criar projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Autorize o Railway a acessar seu repositório
5. Selecione o repositório **ElitheRace**

### 1.2. Configurar o Backend

1. No Railway, selecione a pasta **server** como root directory:
   - Settings → **Root Directory** → `server`

2. Configure as **Environment Variables**:
   - Vá em **Variables** e adicione:
   
   ```bash
   PORT=3000
   SUPABASE_URL=https://qzsimgtlhaebdtljyozt.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c2ltZ3RsaGFlYmR0bGp5b3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDg2OTAsImV4cCI6MjA3OTMyNDY5MH0.BmpdtrReuRkAo6QzZB4aSrFWbdVaWePz8WdhlAPD-d0
   FRONTEND_URL=https://seu-app.vercel.app
   ```
   
   ⚠️ **IMPORTANTE**: Você vai atualizar `FRONTEND_URL` depois que fizer deploy do frontend na Vercel.

3. O Railway vai fazer deploy automaticamente. Aguarde finalizar.

4. **Copie a URL do backend**:
   - Ex: `https://elithe-race-production.up.railway.app`
   - Você vai precisar dessa URL no próximo passo!

---

## 🎨 Parte 2: Deploy do Frontend (Vercel)

### 2.1. Preparar Variáveis de Ambiente Localmente

1. Na pasta `client/`, copie o `.env.example`:
   ```bash
   cd client
   cp .env.example .env
   ```

2. **NÃO** faça commit do arquivo `.env` (já está no .gitignore)

### 2.2. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório **ElitheRace**
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Configure as **Environment Variables**:
   
   Clique em **Environment Variables** e adicione:
   
   ```bash
   VITE_SUPABASE_URL=https://qzsimgtlhaebdtljyozt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c2ltZ3RsaGFlYmR0bGp5b3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDg2OTAsImV4cCI6MjA3OTMyNDY5MH0.BmpdtrReuRkAo6QzZB4aSrFWbdVaWePz8WdhlAPD-d0
   VITE_API_URL=https://SUA-URL-DO-RAILWAY.up.railway.app
   ```
   
   ⚠️ **IMPORTANTE**: Substitua `VITE_API_URL` pela URL do Railway que você copiou no Passo 1.2.4!

6. Clique em **Deploy**

7. Aguarde o deploy finalizar (1-2 minutos)

8. **Copie a URL do frontend**:
   - Ex: `https://elithe-race.vercel.app`

### 2.3. Atualizar FRONTEND_URL no Railway

1. Volte ao Railway
2. Vá em **Variables**
3. Atualize `FRONTEND_URL` com a URL da Vercel:
   ```bash
   FRONTEND_URL=https://elithe-race.vercel.app
   ```
4. Salve. O Railway vai fazer redeploy automaticamente.

---

## ✅ Verificação

### 1. Testar Backend

Abra no navegador:
```
https://SUA-URL-DO-RAILWAY.up.railway.app
```

Deve aparecer: `Elithe Racing API is running`

### 2. Testar Frontend

1. Abra a URL da Vercel no navegador
2. Faça login com um usuário existente
3. Verifique se os eventos aparecem
4. Confirme presença em um evento
5. Abra o **DevTools** (F12) → **Console** e verifique se não há erros

### 3. Checklist Final

- [ ] Backend responde na URL do Railway
- [ ] Frontend carrega na URL da Vercel
- [ ] Login funciona
- [ ] Dados do Supabase aparecem (eventos, perfil)
- [ ] Confirmação de presença funciona
- [ ] Não há erros no console do navegador
- [ ] Imagens/avatars carregam corretamente

---

## 🔄 Deploys Futuros

### Deploy Automático (Recomendado)

Tanto Vercel quanto Railway fazem **deploy automático** quando você faz push para o GitHub:

```bash
git add .
git commit -m "Atualização do app"
git push
```

Aguarde 1-2 minutos e suas mudanças estarão no ar! 🎉

### Deploy Manual na Vercel

1. Acesse seu projeto na Vercel
2. Clique em **Deployments** → **Redeploy**

---

## 🐛 Troubleshooting

### Erro: "API request failed"

**Causa**: CORS ou URL da API incorreta

**Solução**:
1. Verifique se `VITE_API_URL` na Vercel aponta para a URL correta do Railway
2. Verifique se `FRONTEND_URL` no Railway aponta para a URL correta da Vercel
3. Redeploy ambos os serviços

### Erro: "Supabase client error"

**Causa**: Variáveis de ambiente do Supabase não configuradas

**Solução**:
1. Vá em Vercel → Settings → Environment Variables
2. Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas
3. Redeploy na Vercel

### Erro 404 ao navegar

**Causa**: Configuração de SPA incorreta

**Solução**:
1. Confirme que existe o arquivo `client/vercel.json`
2. Redeploy na Vercel

### Backend não inicia no Railway

**Causa**: Variáveis de ambiente faltando

**Solução**:
1. Vá em Railway → Variables
2. Confirme que todas as variáveis estão configuradas:
   - `PORT`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `FRONTEND_URL`
3. Salve e aguarde redeploy

---

## 🎉 Pronto!

Seu app está no ar! Compartilhe a URL com sua galera:

**Frontend**: `https://seu-app.vercel.app`

---

## 📱 Dica: Adicionar à Tela Inicial (Mobile)

Para transformar em "app" no celular:

### iPhone (Safari):
1. Abra a URL no Safari
2. Toque no botão Compartilhar
3. Selecione "Adicionar à Tela Inicial"

### Android (Chrome):
1. Abra a URL no Chrome
2. Toque no menu (⋮)
3. Selecione "Adicionar à tela inicial"

---

## 🔐 Segurança

✅ **O que já está seguro:**
- Credenciais movidas para variáveis de ambiente
- CORS configurado para seu domínio
- `.env` no `.gitignore`

⚠️ **Recomendações futuras:**
- Adicione autenticação 2FA no Supabase
- Configure alertas de segurança no Railway/Vercel
- Monitore logs de acesso regularmente
