# Ifinho

[![CI](https://github.com/patrickluzdev/ifinho/actions/workflows/ci.yml/badge.svg)](https://github.com/patrickluzdev/ifinho/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> Assistente virtual do IFRS Campus Canoas — acesse em **[ifinho.com.br](https://ifinho.com.br)**

O Ifinho centraliza o acesso a informações institucionais do campus: editais, calendário acadêmico, regulamentos, contatos e normas. Alunos, professores e servidores fazem perguntas em linguagem natural e recebem respostas contextualizadas, sem precisar navegar por sites, PDFs ou enviar e-mails.

## Stack

- **React + React Router** — frontend web
- **Express** — backend API
- **Ollama + Llama 3.2** — LLM local, gratuito
- **Drizzle + PostgreSQL** — banco de dados
- **TypeScript** — tipagem em todo o projeto
- **TailwindCSS + shadcn/ui** — interface
- **Biome + Husky** — lint, formatação e git hooks
- **Docker Compose** — infra de desenvolvimento

## Início rápido

Veja o guia completo em [CONTRIBUTING.md](./CONTRIBUTING.md).

```bash
# 1. Instalar dependências
npm install && npm run prepare

# 2. Configurar variáveis de ambiente
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example    apps/web/.env

# 3. Subir banco e Ollama
docker compose up -d postgres ollama

# 4. Baixar o modelo Llama
docker exec -it ifinho-ollama ollama pull llama3.2:3b

# 5. Aplicar schema do banco
npm run db:push

# 6. Rodar
npm run dev
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |

## Scripts disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe todos os apps em modo desenvolvimento |
| `npm run build` | Build de todos os apps |
| `npm run check` | Lint + formatação (Biome) |
| `npm run check-types` | Verificação de tipos TypeScript |
| `npm run db:push` | Aplica o schema no banco |
| `npm run db:migrate` | Roda as migrations |
| `npm run db:generate` | Gera tipos do banco |
| `npm run db:studio` | Abre o Drizzle Studio |

## Estrutura do projeto

```
ifinho/
├── apps/
│   ├── web/        # Frontend (React + React Router + TailwindCSS)
│   └── server/     # Backend (Express + Ollama)
├── packages/
│   ├── db/         # Schema e queries (Drizzle + PostgreSQL)
│   ├── env/        # Validação de variáveis de ambiente (Zod)
│   ├── http/       # Cliente HTTP compartilhado
│   └── config/     # Configurações compartilhadas
└── docker-compose.yml
```

## Contribuindo

Leia o [CONTRIBUTING.md](./CONTRIBUTING.md) para configurar o ambiente e entender o fluxo de contribuição.

## Licença

[MIT](./LICENSE) © Patrick Luz
