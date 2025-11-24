# Elithe Racing MVP

WebApp para gestão de rolês do motoclube Elithe Racing.

## 🚀 Funcionalidades

- **Membros**: Cadastro, Login, Visualização do Rolê Ativo, Confirmação de Presença (com escolha de PE e Moto).
- **Admin**: Criação/Edição de Eventos, Gestão de PEs, Geração de Lista para WhatsApp.
- **Gamification**: Contagem de participações, Estrelinhas (1 a cada 4), Detecção de Aniversariante e Nova Moto.

## 🛠 Tecnologias

- **Frontend**: React + Vite (Estilo Carbon/Gold/Red)
- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite (Arquivo local `elithe.db`)

## 📦 Instalação

### Pré-requisitos
- Node.js instalado (versão 18 ou superior).

### 1. Configurar o Backend

1. Entre na pasta `server`:
   ```bash
   cd server
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.example .env
     ```
   - (Opcional) Edite o `.env` se quiser mudar a porta ou segredo JWT.

4. Inicie o servidor:
   ```bash
   npm start
   ```
   O servidor rodará em `http://localhost:3000`.

### 2. Configurar o Frontend

1. Abra um novo terminal e entre na pasta `client`:
   ```bash
   cd client
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o frontend:
   ```bash
   npm run dev
   ```
   O frontend rodará em `http://localhost:5173` (ou outra porta indicada).

## 📱 Como Usar

1. Acesse o frontend no navegador.
2. **Primeiro Acesso**:
   - Crie uma conta em "Cadastrar".
   - O primeiro usuário criado será apenas "Membro".
   - **Para tornar-se Admin**:
     - Abra o banco de dados `elithe.db` (usando um visualizador SQLite) e mude o campo `role` do seu usuário para `'admin'`.
     - OU, via código, altere a role no banco manualmente.
3. **Como Admin**:
   - Vá em "Admin" no menu.
   - Crie um "Novo Evento".
   - Marque-o como "Ativo".
4. **Como Membro**:
   - Na Home, veja o evento ativo.
   - Clique em "Confirmar Presença".

## 🎨 Identidade Visual
- Fundo: Preto Carbono
- Detalhes: Dourado e Vermelho
- Fonte: Inter / System UI

## ⚠️ Notas
- O banco de dados é criado automaticamente na primeira execução do servidor (`elithe.db` na raiz).
- Se precisar resetar, basta apagar o arquivo `elithe.db`.
