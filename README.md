
<img src="axion-logo.png" alt="Logotipo do Axion - Uma letra A estilizada de forma tecnologica" width="150">

Framework de Spec-Driven Development (SDD). A especificação é a fonte da verdade; o código deriva dela. O Cursor é o adapter **default** (`--tool cursor`); Claude Code entra com `--tool claude-code`, OpenAI Codex com `--tool codex`, Windsurf com `--tool windsurf` e Google Antigravity com `--tool antigravity`.

Repositório: [zanetta/axion](https://github.com/zanetta/axion) · Pacote: [`@zanetta/axion@1.3.4`](https://www.npmjs.com/package/@zanetta/axion)

| | |
| --- | --- |
| [Introdução](#spec-driven-development) | O que o kit é |
| [Instalação](#quick-start) | `init`, profiles, o que é copiado |
| [Troubleshooting da instalação](#troubleshooting-da-instalação) | `npx`, diretório, profile, arquivos protegidos |
| [FSM](#spec-driven-development) | Estados e o que cada um exige |
| [Fluxo de trabalho](#fluxo-de-trabalho) | Projeto do zero e projeto que já existe |
| [Comandos e skills](#comandos-e-skills) | O que cada `/comando` carrega |
| [Cada comando](#cada-comando) | Quando usar e o que ele produz |

---

## Spec-Driven Development

O trabalho segue a FSM: `discover → specify → plan → implement → verify → remember`. Cada fase fecha um acordo (artefato) antes da próxima escrever código.

| Estado | Artefato / decisão | Command |
| --- | --- | --- |
| `discover` | Notas de exploração, opções e trade-offs (sem fechar SPEC) | `/ax-discover` |
| `specify` | SPEC (`{slug}.spec.md`: problema, actors, constraints, non-goals) | `/ax-specify` |
| `plan` | PLAN (`{slug}.plan.md`) + links para SPEC/ACCEPTANCE | `/ax-plan` |
| `implement` | código que segue o PLAN (app novo ou código existente) | `/ax-implement` |
| `verify` | ACCEPTANCE + evidência de execução | `/ax-verify` (e `/ax-test`, `checklist.py`) |
| `remember` | decisões cross-session | `/ax-remember` |

O que cada estado exige:

| Estado | Pode avançar quando |
| --- | --- |
| `discover` | ≥3 perguntas socráticas exploradas e o usuário escolheu uma direção para `/ax-specify`. |
| `specify` | Existe `{slug}.spec.md` com ≥3 perguntas respondidas (ou registradas no PLAN). Célula com `{placeholder}` não conta. |
| `plan` | O usuário aprovou `{slug}.plan.md` (ou o legado `{slug}.md`) e o `{slug}.acceptance.md`. |
| `implement` | O plano está aprovado. `/ax-implement` cobre tanto app novo quanto código que já existe. Correção pequena pode seguir depois de confirmar o impacto. |
| `verify` | Os critérios AC-* têm evidência e `[x]`, o checklist sai 0 e o `verify_gate.py` sai 0. |
| `remember` | A nota passou no `memory_secret_scan.py`. Segredo não entra em `.agents/memory/`. |

Commands de apoio: `/ax-debug`, `/ax-preview`, `/ax-status`, `/ax-deploy`, `/ax-orchestrate`, `/ax-test`, `/ax-design`.

---

## Quick Start

### Instalar no projeto

Na raiz do repositório da aplicação:

```bash
npx @zanetta/axion init
npx @zanetta/axion init --profile standard
npx @zanetta/axion init --tool claude-code
npx @zanetta/axion init --tool codex
npx @zanetta/axion init --tool windsurf
npx @zanetta/axion init --tool antigravity
npx @zanetta/axion init --profile security   # inclui red-team / penetration-tester
```

O `init` instala no diretório atual. Exemplo: `cd ~/dev/meu-app && npx @zanetta/axion init`. Profiles e `--enable-offensive`: [`cli/README.md`](cli/README.md).

```bash
npm install -g @zanetta/axion
axion init --profile standard
```

**O que o** `init` **copia** (`--tool cursor`, default):

| Item | Destino |
| --- | --- |
| Agents do profile | `.claude/agents/` |
| Skills do profile (+ sub-skills de game-dev), memória e schemas | `.agents/` |
| 13 slash commands, 7 regras por domínio, scripts, MCP | `.cursor/` |
| Regras globais e fluxo | `AGENTS.md`, `AGENT_FLOW.md` |
| Template de env | `.env.example` |

`--tool claude-code` projeta o mesmo pack para `.claude/commands/` (`$ARGUMENTS`, com `/ax-design`), `.claude/skills/`, `CLAUDE.md`, `.mcp.json` e `.agents/shared/`. `--tool codex` projeta `.agents/skills/`, `.agents/shared/`, `.axion/scripts/`, `AGENTS.md` e `.codex/config.toml` (`[mcp_servers.<id>]` com merge aditivo; omite agents, commands e rules). `--tool windsurf` projeta `.agents/skills/`, `.agents/shared/`, `.axion/scripts/`, `AGENTS.md` e `.windsurf/mcp_config.json` (JSON `mcpServers`, merge aditivo; omite agents, commands e rules). `--tool antigravity` projeta `.agents/skills/` (`ax-*/SKILL.md`), `.agents/rules/` (`.md` com `trigger`), `.agents/shared/`, `.axion/scripts/`, `AGENTS.md`, `GEMINI.md` e `.agents/mcp_config.json`. Detalhes: [`cli/README.md`](cli/README.md).

O `init` (e o `update`) também grava `.axion/kit.manifest.json` — estado local do kit (SemVer, profile). Não faz parte do template do pack. `npx @zanetta/axion status` lê esse manifesto e mostra a versão instalada (e compara com o latest no npm, se a rede responder).

**Merge é o padrão.** Arquivos novos entram; arquivos que já existem ficam como estão.

| Caminho | Comportamento |
| --- | --- |
| `.cursor/mcp.json` | Merge de servidores. Em conflito de nome, a config do projeto prevalece |
| `.cursor/rules/*.mdc` | Arquivo existente não é sobrescrito |
| Demais arquivos do kit | Ignorados se já existirem |

```bash
npx @zanetta/axion init --force     # sobrescreve arquivos do kit que não são protegidos
npx @zanetta/axion init --dry-run   # simula sem escrever
npx @zanetta/axion status
npx @zanetta/axion update           # merge de arquivos novos
npx @zanetta/axion update --force
npx @zanetta/axion update --dry-run
```

Use `--force` só quando quiser substituir customizações do kit.

### npm — erros comuns

| Erro | Ajuste |
| --- | --- |
| `E404` / `ENOVERSIONS` / `min-release-age` | `NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init` ou `npm config delete min-release-age` |
| `ENEEDAUTH` | Registry `registry.npmjs.org` (veja o `.npmrc` do projeto) |
| `E403` (2FA) | 2FA com `--otp=…`, ou token granular com bypass de 2FA |

Detalhes, publish e desenvolvimento local: [`cli/README.md`](cli/README.md). Tag `v*` dispara [`.github/workflows/publish-npm.yml`](.github/workflows/publish-npm.yml) (`NPM_TOKEN` no GitHub), que só publica após o gate de CI (lint de paths + contratos + paridade doc/inventário + testes/smoke) e se a tag for igual à versão de `cli/package.json`.

### Troubleshooting da instalação

| Sintoma | O que fazer |
| --- | --- |
| `npx` não acha o pacote recém-publicado | `NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init`. Confira com `npm view @zanetta/axion version`. |
| O kit caiu na pasta errada | `init` grava no diretório atual. Entre na raiz do app e rode de novo. |
| `/comando` não aparece no chat | Cursor: `.cursor/commands/`. Claude Code: `.claude/commands/` (`init --tool claude-code`). Antigravity: `.agents/skills/ax-*/SKILL.md` (`init --tool antigravity`). |
| Troquei para `minimal` e os agents antigos continuam | O CLI não apaga arquivo do projeto. O que ficou de fora do profile aparece como *outside profile* e sai só se você remover. |
| `--force` e o SPEC/PLAN sumiu | Não deve sumir. `*.spec.md`, `*.plan.md`, `*.acceptance.md`, `.agents/memory/`, `.axion/logs/` e `.axion/trace/` (exceto o `README.md`) não são sobrescritos se já existem. |
| `update` diz que há drift | A lista é informativa. Sem `--force`, o arquivo local fica. Com `--force`, só arquivo do kit que não é protegido é substituído. |
| `status` não mostra o manifesto | Rode `init` ou `update` de novo. O `.axion/kit.manifest.json` é gravado pelo CLI, não vem no template. |
| Script Python falha ao verificar | Vários commands chamam `python3`. Sem Python 3 no PATH, checklist e gate não rodam. |

### Cópia manual

```bash
git clone https://github.com/zanetta/axion.git
# ou copie .claude/, .agents/, .cursor/, AGENTS.md e AGENT_FLOW.md
```

### MCP (opcional)

```bash
cp .env.example .env
# Edite CONTEXT7_API_KEY
```

Servidores em [`.cursor/mcp.json`](.cursor/mcp.json) (Context7, Playwright, shadcn).

---

## Fluxo de trabalho

Um command por mensagem, no chat do Agent: `/<comando>` e o pedido em texto livre. Commands que editam arquivos pedem permissão de escrita.

| Command | Quando | Exemplo |
| --- | --- | --- |
| `/ax-discover` | Explorar opções e arquitetura antes da SPEC | `/ax-discover qual stack usar para um SaaS multi-tenant?` |
| `/ax-specify` | Formalizar e fechar `{slug}.spec.md` | `/ax-specify saas-multitenant` |
| `/ax-plan` | Plano e checklist a partir do que foi especificado | `/ax-plan implementar autenticação JWT com refresh token` |
| `/ax-implement` | Construir app novo ou evoluir código existente seguindo o plano | `/ax-implement landing page Next.js` ou `/ax-implement adicionar paginação em usuários` |
| `/ax-debug` | Bug com método sistemático | `/ax-debug login retorna 401 após deploy` |
| `/ax-test` | Gerar ou executar testes | `/ax-test cobrir fluxo de checkout com Playwright` |
| `/ax-verify` | Executar e provar que funciona | `/ax-verify build passa após o refactor do módulo auth` |
| `/ax-deploy` | Pré-flight e deploy | `/ax-deploy preparar release para Vercel` |
| `/ax-preview` | Servidor local | `/ax-preview iniciar dev server na porta 3000` |
| `/ax-status` | Progresso da tarefa atual | `/ax-status` |
| `/ax-orchestrate` | Vários specialists (mínimo 3) e coordenação em paralelo | `/ax-orchestrate painel admin com CRUD e testes E2E` |
| `/ax-remember` | Convenção entre sessões | `/ax-remember prefiro bun em vez de npm neste projeto` |
| `/ax-design` | Direção visual (slash no Cursor e no Claude Code; skill nas quatro IDEs) | `/ax-design dashboard fintech dark mode minimalista` |

Definição de cada workflow: [`.cursor/commands/`](.cursor/commands/). A lista com as skills e o texto de cada command estão em [Comandos e skills](#comandos-e-skills) e [Cada comando](#cada-comando).

### a) Projeto iniciado do zero

App que ainda não existe. Instale o kit, feche o SPEC e o PLAN, e só então peça código.

```bash
npx @zanetta/axion init
git add . && git commit -m "chore: add axion kit"
```

Descobrir, fixar o acordo e planejar:

```text
/ax-discover MVP de gestão de tarefas: web, auth, equipes, mobile depois. Restrição: deploy na Vercel.

/ax-specify mvp-tarefas

/ax-remember Stack: Next.js App Router, Prisma, PostgreSQL, Tailwind v4, bun. Sem tons roxo/violeta na UI.

/ax-plan MVP com auth email/senha, CRUD de projetos e tarefas, dashboard. Incluir testes e schema DB.
```

Implementar em blocos. Um bloco do plano, `/ax-verify`, o próximo. Escopo full-stack pode ir para `/ax-orchestrate` depois do `/ax-plan`.

```text
/ax-implement seguir o plano em [nome-do-plano].plan.md — monorepo não, app Next.js na raiz.

/ax-design dashboard produtividade, estilo clean, paleta neutra com acento verde.

/ax-preview iniciar dev server e confirmar que a home carrega.
```

Verificar e, quando o plano estiver cumprido, preparar o release:

```text
/ax-test unitários para services de tarefas e integração para API /api/projects

/ax-verify rodar build, migrations e smoke test do fluxo login → criar tarefa

/ax-status

/ax-orchestrate revisão final: segurança (auth), performance (LCP), testes E2E dos fluxos críticos

/ax-deploy preparar release produção Vercel — variáveis de ambiente e migrations
```

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/verify_all.py . --url http://localhost:3000
```

```mermaid
flowchart LR
  A["discover\n/discover"] --> B["specify\n/specify → SPEC"]
  B --> C["plan\n/plan → PLAN"]
  C --> D["implement\n/implement"]
  D --> E["verify\n/verify + ACCEPTANCE"]
  E --> F{Cumpre ACCEPTANCE?}
  F -->|Não| D
  F -->|Sim| G["remember\n/remember"]
  G --> H["/ax-deploy"]
```

### b) Projeto que já está em andamento

```bash
npx @zanetta/axion init
```

O merge preserva rules e `mcp.json` do projeto. Não substitua `package.json` nem `src/` na cópia manual. Registre o que o repositório já faz:

```text
/ax-remember Este projeto usa npm (não bun). ESLint flat config em eslint.config.mjs. API em src/server/.
```

Antes de uma mudança grande, peça um mapa do repo (agent `explorer-agent`, skill `architecture`):

```text
Explorar a estrutura do repo e resumir: stack, pastas principais, como rodar testes e build.
```

| Situação | Sequência |
| --- | --- |
| Feature no código existente | `/ax-plan` → `/ax-implement` |
| Refatoração | `/ax-discover` → `/ax-specify` → `/ax-plan` → `/ax-implement` |
| Bug | `/ax-debug` → `/ax-verify` |
| Várias camadas | `/ax-orchestrate` |

Feature:

```text
/ax-plan adicionar exportação CSV na listagem de pedidos — respeitar padrões em src/features/orders/

/ax-implement implementar export CSV async, limite 10k linhas, testes unitários no service

/ax-test cobrir service de export e rota GET /api/orders/export

/ax-verify build + testes + curl na rota com token de teste
```

Bug:

```text
/ax-debug checkout falha no Safari iOS — cart fica vazio após refresh. Logs e passos anexados.

/ax-verify reproduzir fix no fluxo guest checkout e logged-in
```

No dia a dia: leia `.agents/memory/MEMORY.md` no início da sessão; tarefa pequena vai de `/ax-implement`; tarefa média passa por `/ax-plan` e `/ax-verify`; antes do PR, `/ax-test` e `python3 .axion/scripts/checklist.py .`.

| Prefira | Evite |
| --- | --- |
| `/ax-implement` com plano incremental | Reescrever a aplicação sem PLAN |
| Convenções já presentes no código, gravadas com `/ax-remember` | Inventar um estilo paralelo |
| `/ax-verify` antes de `/ax-deploy` | Release sem build e testes na sessão |
| Segredos em `.env` | Segredos no `/ax-remember` |

```mermaid
flowchart TD
  A[Axion na raiz do repo] --> B["/ax-remember convenções"]
  B --> C{Tipo de trabalho?}
  C -->|Feature| D["/ax-plan → /ax-implement"]
  C -->|Bug| E["/ax-debug → /ax-verify"]
  C -->|Várias camadas| F["/ax-orchestrate"]
  D --> G["/ax-test + /ax-verify"]
  E --> G
  F --> G
  G --> H["checklist.py"]
  H --> I["/ax-deploy quando couber"]
```

Memória fica em `.agents/memory/` e volta nas sessões seguintes pela skill `memory-system`.

---

## Comandos e skills

O frontmatter de cada arquivo em `.cursor/commands/` declara as skills que o agent deve ler. Onde a coluna está vazia, o command não declara `required_skills`.

| Command | Skills |
| --- | --- |
| `/ax-discover` | `brainstorming` |
| `/ax-specify` | `brainstorming`, `plan-writing` |
| `/ax-plan` | `plan-writing`, `brainstorming` |
| `/ax-implement` | `app-builder`, `plan-writing`, `brainstorming` |
| `/ax-verify` | `verify-changes` |
| `/ax-remember` | `memory-system` |
| `/ax-orchestrate` | `parallel-agents`, `coordinator-mode`, `plan-writing` |
| `/ax-status` | — |
| `/ax-debug` | — |
| `/ax-test` | — |
| `/ax-deploy` | — |
| `/ax-preview` | — (usa `.axion/scripts/auto_preview.py`) |
| `/ax-design` | `design-guide` (usa `.agents/shared/ui-ux-pro-max/scripts/search.py`) |

## Cada comando

### `/ax-discover`

Estado `discover`. Explora o problema, aplica o Socratic Gate (≥3 perguntas sobre propósito, usuários e escopo) e apresenta ao menos 3 opções com prós, contras e esforço. **Não fecha `{slug}.spec.md` nem escreve código** — quando você escolhe a direção, entrega para `/ax-specify {slug}`.

### `/ax-specify`

Estado `specify`. Exige que as ≥3 perguntas socráticas tenham sido respondidas e grava `{slug}.spec.md` a partir de `.agents/skills/plan-writing/templates/SPEC.template.md` com rastreabilidade (`SPEC-{slug}-1..N`). Não escreve código da aplicação e entrega para `/ax-plan {slug}`.

### `/ax-plan`

Estado `plan`. O `project-planner` produz `{slug}.plan.md` e `{slug}.acceptance.md` a partir dos templates. Exige SPEC ou três respostas reais, e para antes de codar até você aprovar. A seção `## Write allowlist` lista os paths que a implementação pode alterar.

### `/ax-implement`

Estado `implement`. Unifica criação de aplicação nova (Modo A — Greenfield, coordenando `app-builder` + schema/API/UI) e evolução de código existente (Modo B — Existing codebase, lendo `session_manager.py info` e aplicando mudanças incrementais). Exige PLAN aprovado para escopo não trivial e valida cada escrita com `side_effect_guard.py`.

### `/ax-verify`

Estado `verify`. Prova por execução. Ordem: gravar evidência em cada AC-*, `python3 .axion/scripts/checklist.py .`, depois `python3 .axion/scripts/verify_gate.py . --acceptance {slug}.acceptance.md`. Os dois precisam sair 0. O gate roda o checklist de novo e não repete os comandos dos AC-*. Sem arquivo de acceptance, o gate aceita `--allow-missing-acceptance` e o checklist continua. Em seguida, `trace_report.py` (se houver slug) e o log em `.axion/logs/runs.jsonl`.

### `/ax-test`

Gera ou roda testes do alvo que você nomear, inclusive coverage e watch. Não substitui o `/ax-verify`: o teste é uma evidência; o gate é quem fecha a tarefa.

### `/ax-debug`

Investigação sistemática: sintoma, hipóteses, teste de cada hipótese, causa e correção.

### `/ax-preview`

Sobe, para ou consulta o servidor local. Por baixo, `python3 .axion/scripts/auto_preview.py start|stop|status`.

### `/ax-status`

Mostra o quadro do projeto e pede o doctor do kit: `python3 .axion/scripts/session_manager.py doctor .` (linhas do índice de memória, path lint e o último `/ax-verify`).

### `/ax-deploy`

Pré-flight e release. O command cobre checagem, preview, produção e rollback. Ele não publica o pacote npm do Axion; isso é a tag `v*` e o workflow `publish-npm.yml`.

### `/ax-orchestrate`

Vários specialists no mesmo pedido (mínimo três) e coordenação paralela (`coordinator-mode`). Não despacha workers sem SPEC ou três respostas e sem PLAN. Antes de cada escrita, o path tem de estar na allowlist. Antes de cada dispatch ou retry, `circuit_breaker.py` decide se ainda dá para lançar. No fim, o log pode receber os contadores `--workers`, `--failures`, `--duration-ms` e `--breaker-trips`.

### `/ax-remember`

Estado `remember`. Grava preferência ou decisão em `.agents/memory/`. Antes de escrever, `python3 .axion/scripts/memory_secret_scan.py` precisa sair 0. Exit 1 recusa o texto e não mostra o segredo.

### `/ax-design`

Consulta o guia visual em `.agents/shared/ui-ux-pro-max/` (estilos, paletas, tipos, UX). A busca é `python3 .agents/shared/ui-ux-pro-max/scripts/search.py`. Em seguida sintetiza o design system e implementa a tela. Slash `/ax-design` no Cursor, Claude Code e nas skills Antigravity (`ax-*`); nos cinco tools o agente usa a skill `design-guide`. `update` é aditivo: leftover `.agents/skills/design/` (e `.claude/skills/design/` no Claude Code) pode ficar no disco, unused.

## Configuração

| Item | Onde | Nota |
| --- | --- | --- |
| `CONTEXT7_API_KEY` | `.env`, a partir de `.env.example` | MCP Context7. `.env` não vai para o git |
| Regras sempre ativas | `AGENTS.md` | Ciclo, roteamento, checklist |
| Regras por domínio | `.cursor/rules/*.mdc` | Sete arquivos. O `init` não sobrescreve os que já existem |
| MCP | `.cursor/mcp.json` | Merge; o projeto ganha em conflito de nome |
| Memória | `.agents/memory/MEMORY.md` | Preferências e convenções. Sem segredos |

Deixe `.agents/` indexado pelo Cursor se quiser autocomplete dos slash commands. Para tirá-lo do remoto sem perder a indexação local:

```bash
echo ".agents/" >> .git/info/exclude
```

---

## Estrutura

```
.
├── AGENTS.md                 # Regras sempre ativas
├── AGENT_FLOW.md             # Fluxo de agents e validação
├── README.md
├── package.json              # Workspace cli/
├── .npmrc                    # @zanetta → registry.npmjs.org
├── cli/                      # @zanetta/axion
├── .github/workflows/        # ci.yml (reusável) + publish-npm.yml (tag v*, gate pre-publish)
├── .axion/                   # kit.manifest.json, inventory.json, trace/ (consumidor recebe só trace/README.md)
├── .claude/agents/           # 21 agents
├── .agents/
│   ├── schemas/              # Contratos skill/command
│   ├── skills/               # 56 skills (+ templates SPEC/PLAN/ACCEPTANCE)
│   ├── shared/ui-ux-pro-max/ # Dados e search.py do fluxo /ax-design
│   └── memory/
└── .cursor/
    ├── ARCHITECTURE.md
    ├── commands/             # 13 slash commands
    ├── rules/                # 7 regras por domínio
    ├── scripts/              # leftover v1; masters are `.axion/scripts/`
    └── mcp.json
```

| Documento | Conteúdo |
| --- | --- |
| [`.cursor/ARCHITECTURE.md`](.cursor/ARCHITECTURE.md) | Agents, skills, FSM SDD, npm, P0/P1 |
| [`AGENT_FLOW.md`](AGENT_FLOW.md) | Fluxo de agents, FSM e gates |
| [`AGENTS.md`](AGENTS.md) | Regras sempre ativas |
| [`cli/README.md`](cli/README.md) | CLI, profiles, manifesto SemVer, publish |
| [`.axion/scripts/README.md`](.axion/scripts/README.md) | Scripts de validação e sync |

---

## Manutenção do kit

O script compara agents, skills, memória e commands com [zanetta/axion](https://github.com/zanetta/axion). Sincroniza `/ax-design`; preserva `AGENTS.md`, `.cursor/rules/` e este README.

```bash
python3 .axion/scripts/lint_paths.py .                  # drift de paths (legado .agents/scripts/)
python3 .axion/scripts/sync_upstream.py                 # comparar
python3 .axion/scripts/sync_upstream.py --apply         # aplicar
python3 .axion/scripts/sync_upstream.py --apply --clone # clonar a origem e aplicar
```

Revise o diff do dry-run antes de `--apply`.

---

## Licença

[MIT](LICENSE).
