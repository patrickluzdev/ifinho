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
- [Criando um novo scraper](#criando-um-novo-scraper)

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
│   ├── server/     # Backend (Express + Ollama)
│   └── worker/     # Worker de scraping (pg-boss + pipeline)
├── packages/
│   ├── db/         # Schema e queries do banco (Drizzle + PostgreSQL)
│   ├── scraper/    # Engine de scraping (plugins + pipeline)
│   ├── env/        # Validação de variáveis de ambiente (Zod)
│   ├── http/       # Cliente HTTP compartilhado
│   └── config/     # Configurações compartilhadas (TypeScript, Biome)
├── docker-compose.yml
└── package.json    # Monorepo root (npm workspaces)
```

---

## Criando um novo scraper

Uma das formas mais valiosas de contribuir é adicionar scrapers para novas fontes de conteúdo do IFRS Canoas (editais, calendários, PDFs, etc).

### Como funciona a arquitetura

```
scrape_configs (banco)
      │
      ▼
  Scheduler (worker) — verifica configs vencidas a cada 15 min
      │
      ▼
  ScraperRunner
      │
      ├── Plugin (seu scraper) → AsyncGenerator<ScrapeResult>
      │
      └── Pipeline (fixo, igual para todos)
            ├── SanitizeStep    — normaliza o texto
            ├── HashCheckStep   — ignora conteúdo que não mudou
            ├── PersistStep     — salva no banco (sources + documents)
            └── EmbedStep       — gera embedding vetorial para busca semântica
```

O plugin é responsável apenas por **buscar e parsear** o conteúdo. O pipeline cuida do resto automaticamente.

---

### Passo 1 — Entender a anatomia de um plugin

Um plugin vive em `packages/scraper/src/plugins/<nome>/` e tem sempre a mesma estrutura:

```
plugins/
└── news/                  ← nome do plugin (mesmo valor que Scraper.id)
    ├── index.ts           ← classe principal — orquestra o scraping
    └── pages/
        ├── list.ts        ← Page Object da página de listagem
        └── detail.ts      ← Page Object da página de detalhe
```

#### `index.ts` — a classe principal

É a única parte obrigatória. Implementa a interface `Scraper`:

```typescript
export interface Scraper {
  readonly id: string;                              // ex: "news", "edital"
  run(request: ScrapeRequest): AsyncGenerator<ScrapeResult>;
}
```

O método `run` é um **async generator**: ele não retorna uma lista, mas vai `yield`ando cada item conforme os processa. Isso permite que o pipeline comece a persistir resultados antes do scraping terminar.

```typescript
// Fluxo típico do index.ts
async *run(request: ScrapeRequest): AsyncGenerator<ScrapeResult> {
  // 1. Busca a página de listagem
  const html = await this.fetcher.get(request.startUrl);

  // 2. Usa o Page Object da lista para extrair links e navegar páginas
  const listPage = new NewsListPage(cheerio.load(html));
  const items = listPage.extractItems();

  // 3. Para cada item, busca e extrai o conteúdo da página de detalhe
  for (const item of items) {
    const detailHtml = await this.fetcher.get(item.url);
    const detailPage = new NewsDetailPage(cheerio.load(detailHtml));

    // 4. Yield do resultado — o pipeline recebe e processa imediatamente
    yield {
      url: item.url,
      title: detailPage.extractTitle(),
      rawText: detailPage.extractContent(),
      contentHash: crypto.createHash("md5").update(rawText).digest("hex"),
      category: "noticia",
      sourceType: "webpage",
    };
  }
}
```

**O `Fetcher`** é injetado via construtor e deve ser sempre usado no lugar de `fetch`/`axios` diretamente. Ele aplica rate limiting automático (delay configurável entre requisições) e define o User-Agent do bot:

```typescript
constructor(private fetcher: Fetcher) {}

// ✅ correto
const html = await this.fetcher.get(url);

// ❌ nunca faça isso dentro de um plugin
const html = await fetch(url).then(r => r.text());
```

---

#### `pages/list.ts` — Page Object da listagem

Responsável por parsear a página que lista os itens (ex: página de notícias com cards). Não faz requisições — recebe o `CheerioAPI` já carregado do `index.ts`.

Deve expor dois métodos:
- `extractItems()` → retorna os links e metadados básicos dos cards
- `nextPageUrl()` → retorna a URL da próxima página, ou `null` se não houver

```typescript
export class NewsListPage {
  constructor(private $: CheerioAPI) {}

  extractItems(): NewsListItem[] {
    const items: NewsListItem[] = [];

    this.$("article.noticia").each((_, el) => {
      const url = this.$(el).find("a.noticia__link").attr("href") ?? "";
      if (!url) return;

      items.push({
        url,
        title: this.$(el).find("h2.noticia__titulo").text().trim(),
        publishedAt: parsePtDate(this.$(el).find("span.noticia__data").text()),
      });
    });

    return items;
  }

  nextPageUrl(): string | null {
    return this.$("a.next.page-link").attr("href") ?? null;
  }
}
```

> Os **seletores CSS** (`article.noticia`, `a.noticia__link`, etc.) são específicos de cada site. Inspecione o HTML da página alvo com o DevTools do navegador para descobrir os corretos.

---

#### `pages/detail.ts` — Page Object do detalhe

Responsável por parsear a página individual de cada item. Também recebe o `CheerioAPI` pronto.

Deve expor os métodos necessários para extrair os dados do `ScrapeResult`:

```typescript
export class NewsDetailPage {
  constructor(private $: CheerioAPI) {}

  extractTitle(): string {
    return this.$("h2.post__title").first().text().trim();
  }

  extractDate(): Date | undefined {
    const content = this.$('meta[property="article:published_time"]').attr("content");
    return content ? new Date(content) : undefined;
  }

  extractContent(): string {
    const $content = this.$("div.post__content").first().clone();
    // Remove elementos que poluem o texto (scripts, iframes, widgets)
    $content.find("script, iframe, style, .ultimos-posts, figcaption").remove();
    return $content.text().replace(/\s+/g, " ").trim();
  }
}
```

> Sempre use `.clone()` antes de remover elementos para não mutar o DOM original. O `replace(/\s+/g, " ").trim()` é importante para normalizar espaços e quebras de linha do HTML.

---

#### Quando usar pages/ e quando não usar

As classes `pages/` são uma convenção para manter o código organizado, não uma obrigação técnica.

| Situação | Recomendação |
|----------|-------------|
| Site com listagem + página de detalhe | Use `list.ts` + `detail.ts` |
| Página única com todo o conteúdo | Pode parsear direto no `index.ts` |
| Muitas variações de página | Crie arquivos separados por tipo |
| Plugin muito simples (1 página, 1 item) | Tudo no `index.ts` é ok |

---

#### O `ScrapeResult` — o que cada campo significa

```typescript
export interface ScrapeResult {
  url: string;
  // URL canônica e permanente do conteúdo. Usada como chave de deduplicação
  // no banco — dois itens com a mesma URL são tratados como o mesmo documento.

  title: string;
  // Título legível do documento. Aparece nas respostas do chat como referência.

  rawText: string;
  // Texto puro extraído, sem nenhuma tag HTML.
  // É esse texto que será dividido em chunks e indexado vetorialmente.
  // Quanto mais limpo e relevante, melhor a qualidade das respostas do Ifinho.

  contentHash: string;
  // MD5 do rawText. O HashCheckStep compara com o hash salvo anteriormente —
  // se for igual, o item é descartado e não reprocessado.
  // Sempre gere assim: crypto.createHash("md5").update(rawText).digest("hex")

  category: SourceCategory;
  // Classificação do conteúdo. Valores disponíveis definidos no enum do banco.
  // Ex: "noticia", "edital", "documento"

  sourceType: SourceType;
  // Tipo da fonte. Ex: "webpage" para páginas HTML, "pdf" para arquivos PDF.

  publishedAt?: Date;
  // Data de publicação, quando disponível. Opcional.

  metadata?: Record<string, unknown>;
  // Dados extras que não cabem nos campos acima. Opcional.
}
```

---

### Passo 2 — Criar o plugin

Com a estrutura clara, crie os arquivos:

```
packages/scraper/src/plugins/edital/
├── index.ts
└── pages/
    ├── list.ts
    └── detail.ts
```

Exemplo de `index.ts` completo:

```typescript
import crypto from "node:crypto";
import * as cheerio from "cheerio";
import type { Fetcher } from "../../core/fetcher.js";
import type { ScrapeRequest, ScrapeResult, Scraper } from "../../core/types.js";
import { EditalListPage } from "./pages/list.js";
import { EditalDetailPage } from "./pages/detail.js";

export class EditalScraper implements Scraper {
  readonly id = "edital";

  constructor(private fetcher: Fetcher) {}

  async *run(request: ScrapeRequest): AsyncGenerator<ScrapeResult> {
    const { startUrl, options } = request;
    const maxPages = options.maxPages ?? 3;

    let listUrl: string | null = startUrl;
    let page = 1;

    while (listUrl !== null && page <= maxPages) {
      const html = await this.fetcher.get(listUrl);
      const $ = cheerio.load(html);
      const listPage = new EditalListPage($);

      for (const item of listPage.extractItems()) {
        try {
          const detailHtml = await this.fetcher.get(item.url);
          const detailPage = new EditalDetailPage(cheerio.load(detailHtml));

          const rawText = detailPage.extractContent();
          if (!rawText) continue;

          yield {
            url: item.url,
            title: detailPage.extractTitle() || item.title,
            rawText,
            contentHash: crypto.createHash("md5").update(rawText).digest("hex"),
            category: "edital",
            sourceType: "webpage",
          };
        } catch (err) {
          console.error(`[EditalScraper] Failed to scrape ${item.url}:`, err);
        }
      }

      listUrl = listPage.nextPageUrl();
      page++;
    }
  }
}
```

> Use `this.fetcher.get(url)` em vez de `fetch` diretamente — o `Fetcher` aplica delay entre requisições para não sobrecarregar o servidor.

---

### Passo 3 — Registrar o plugin no worker

Abra `apps/worker/src/index.ts` e adicione o novo plugin ao `Map`:

```typescript
// antes
const plugins = new Map([
  ["news", new NewsScraper(new Fetcher({ delayMs: 1500 }))],
]);

// depois
const plugins = new Map([
  ["news",   new NewsScraper(new Fetcher({ delayMs: 1500 }))],
  ["edital", new EditalScraper(new Fetcher({ delayMs: 1500 }))],
]);
```

---

### Passo 4 — Criar o `scrape_config` no banco

Com o worker rodando, insira uma configuração para o novo scraper:

```sql
INSERT INTO scrape_configs (id, name, plugin_id, category, base_url, options, priority, check_interval_minutes, enabled)
VALUES (
  gen_random_uuid(),
  'IFRS Canoas — Editais',  -- nome legível
  'edital',                 -- deve bater com Scraper.id
  'edital',                 -- categoria (enum: noticia, edital, documento, ...)
  'https://ifrs.edu.br/canoas/editais/',
  '{"maxPages": 3}',        -- opções passadas para ScrapeRequest.options
  5,                        -- prioridade (1 = mais alta)
  1440,                     -- intervalo em minutos (1440 = 24h)
  true
);
```

O worker vai detectar a nova config no próximo ciclo (até 15 min) e iniciar o scraping automaticamente.

---

### Passo 5 — Exportar o plugin do pacote

Abra `packages/scraper/src/index.ts` e adicione a exportação:

```typescript
export { EditalScraper } from "./plugins/edital/index.js";
```

---

### Dicas de implementação

- **Use `cheerio`** para parsear HTML — já é dependência do pacote
- **Inspecione o HTML** da página alvo com DevTools antes de escrever os seletores
- **Separe list page e detail page** em classes distintas quando a fonte tiver paginação (veja `plugins/news/pages/` como referência)
- **Retorne `null` / pule** itens sem conteúdo relevante — o pipeline ignora automaticamente
- **O `contentHash`** deve ser MD5 do `rawText` — o `HashCheckStep` usa isso para evitar reprocessar conteúdo que não mudou
- **Não se preocupe** com persistência, embeddings ou deduplicação — o pipeline cuida de tudo

---

## Dúvidas?

Abra uma issue com a label `question`.
