# Contribuindo com o Ifinho

Obrigado por querer contribuir! O Ifinho é o assistente virtual do IFRS Campus Canoas. Siga este guia para configurar o ambiente e começar a contribuir.

## Índice

- [Pré-requisitos](#pré-requisitos)
- [1. Clonar o repositório](#1-clonar-o-repositório)
- [2. Instalar dependências](#2-instalar-dependências)
- [3. Configurar variáveis de ambiente](#3-configurar-variáveis-de-ambiente)
- [4. Subir o banco de dados e o Ollama](#4-subir-o-banco-de-dados-e-o-ollama)
- [5. Instalar o modelo Llama](#5-instalar-o-modelo-llama)
- [6. Configurar o banco de dados](#6-configurar-o-banco-de-dados)
- [7. Rodar o projeto](#7-rodar-o-projeto)
- [Fluxo de contribuição](#fluxo-de-contribuição)
- [Padrão de commits](#padrão-de-commits)
- [Estrutura do projeto](#estrutura-do-projeto)

---

## Pré-requisitos

Antes de começar, instale as seguintes ferramentas:

| Ferramenta | Versão mínima | Link |
|------------|---------------|------|
| Node.js | v20+ | https://nodejs.org |
| npm | v10+ | (incluso no Node.js) |
| Docker | qualquer recente | https://docs.docker.com/get-docker |
| Docker Compose | v2+ | (incluso no Docker Desktop) |

> **Sem Docker?** Você pode instalar PostgreSQL e Ollama manualmente, mas recomendamos Docker para facilitar o setup.

---

## 1. Clonar o repositório

```bash
git clone <url-do-repositório>
cd ifinho
```

---

## 2. Instalar dependências

```bash
npm install

# Configura os git hooks (Husky)
npm run prepare
```

---

## 3. Configurar variáveis de ambiente

O projeto tem dois arquivos `.env`, um para o servidor e um para o frontend. Copie os exemplos:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example    apps/web/.env
```

Edite `apps/server/.env` com os valores desejados:

```env
# Conexão com o banco PostgreSQL
DATABASE_URL=postgresql://ifinho:change_me@localhost:5432/ifinho

# URL do frontend (para CORS)
CORS_ORIGIN=http://localhost:5173

# Endpoint do Ollama (deixe assim para desenvolvimento local com Docker)
OLLAMA_BASE_URL=http://localhost:11434

# Modelo a usar — veja opções na seção abaixo
OLLAMA_MODEL=llama3.2:3b

NODE_ENV=development
```

O `apps/web/.env` normalmente não precisa de alteração para desenvolvimento local:

```env
VITE_SERVER_URL=http://localhost:3000
```

---

## 4. Subir o banco de dados e o Ollama

Use o Docker Compose para subir o PostgreSQL e o Ollama:

```bash
docker compose up -d postgres ollama
```

Verifique se os containers estão rodando:

```bash
docker compose ps
```

Você deve ver `ifinho-postgres` e `ifinho-ollama` com status `running`.

---

## 5. Instalar o modelo Llama

O Ollama precisa baixar o modelo de linguagem antes de ser usado. Execute dentro do container:

```bash
docker exec -it ifinho-ollama ollama pull llama3.2:3b
```

> O download pode demorar alguns minutos dependendo da sua conexão (o modelo `llama3.2:3b` tem ~2GB).

### Modelos disponíveis

| Modelo | Tamanho | Indicado para |
|--------|---------|---------------|
| `llama3.2:3b` | ~2 GB | Desenvolvimento (padrão) |
| `llama3.2:1b` | ~1.3 GB | Máquinas com pouca RAM |
| `llama3.1:8b` | ~4.7 GB | Melhor qualidade de resposta |

Para trocar o modelo, altere `OLLAMA_MODEL` no `apps/server/.env` e baixe o modelo correspondente:

```bash
docker exec -it ifinho-ollama ollama pull llama3.1:8b
```

Para listar os modelos já instalados:

```bash
docker exec -it ifinho-ollama ollama list
```

---

## 6. Configurar o banco de dados

Com o PostgreSQL rodando, aplique o schema:

```bash
npm run db:push
```

Opcionalmente, abra o Drizzle Studio para visualizar o banco:

```bash
npm run db:studio
```

---

## 7. Rodar o projeto

```bash
npm run dev
```

| Serviço | URL |
|---------|-----|
| Frontend (React) | http://localhost:5173 |
| Backend (Express) | http://localhost:3000 |
| Ollama API | http://localhost:11434 |

Para verificar se o Ollama está respondendo:

```bash
curl http://localhost:11434
# Resposta esperada: "Ollama is running"
```

---

## Fluxo de contribuição

O projeto segue o [GitHub Flow](https://docs.github.com/pt/get-started/using-github/github-flow): toda contribuição parte de `main`, é desenvolvida em uma branch isolada e volta via Pull Request.

```
main
 └── feat/nome-da-feature
 └── fix/nome-do-bug
```

### Passo a passo

1. **Abra uma issue** descrevendo o bug ou feature antes de começar — isso evita trabalho duplicado
2. **Faça um fork** do repositório e clone localmente
3. **Crie uma branch** a partir de `main`:
   ```bash
   git checkout -b feat/nome-da-feature
   # ou
   git checkout -b fix/nome-do-bug
   ```
4. **Desenvolva** com commits pequenos e frequentes seguindo o [padrão de commits](#padrão-de-commits)
5. **Verifique** antes de abrir o PR:
   ```bash
   npm run check          # lint + formatação (Biome)
   npm run check-types    # TypeScript
   ```
6. **Abra um Pull Request** para `main` referenciando a issue:
   > No corpo do PR escreva `Closes #<número-da-issue>` para fechar automaticamente ao fazer merge
7. **Aguarde o code review** — pelo menos 1 aprovação é necessária antes do merge

---

## Padrão de commits

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/).

---

## Estrutura do projeto

```
ifinho/
├── apps/
│   ├── web/        # Frontend (React + React Router + TailwindCSS + shadcn/ui)
│   └── server/     # Backend (Express + Ollama)
├── packages/
│   ├── db/         # Schema e queries do banco (Drizzle + PostgreSQL)
│   ├── env/        # Validação de variáveis de ambiente (Zod)
│   ├── http/       # Cliente HTTP compartilhado
│   └── config/     # Configurações compartilhadas (TypeScript, Biome)
├── docker-compose.yml
└── package.json    # Monorepo root (npm workspaces)
```

---

## Dúvidas?

Abra uma issue com a label `question`.
