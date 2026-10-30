# Master Scripts — Axion

Scripts em `.cursor/scripts/` orquestram validações, sync com o repositório Axion e (via `cli/`) instalação npm.

## checklist.py

Validação core durante desenvolvimento:

```bash
python3 .cursor/scripts/checklist.py .
python3 .cursor/scripts/checklist.py . --url http://localhost:3000
```

Ordem: Security → Lint → Schema → Tests → UX → SEO (+ Lighthouse se `--url`).

Usa `sys.executable` (compatível com ambientes só `python3`).

## verify_gate.py

Gate hard do `/verify` (P2 W-03). Checagem executável: exit code real. Ignorar um exit 1 é violação do agent. O FSM de W-01/W-02 continua só instrução.

O script **não** reexecuta os comandos dos AC-*. `/verify` roda cada check, grava o resultado na coluna de evidência, marca Pass `[x]` e só então chama o gate. Exit 1 = tarefa não verificada — não reporte como concluída.

```bash
python3 .cursor/scripts/verify_gate.py . --acceptance {slug}.acceptance.md
python3 .cursor/scripts/verify_gate.py . --allow-missing-acceptance
python3 .cursor/scripts/verify_gate.py . --skip-checklist
```

Falha (exit 1) quando:

- não há `*.acceptance.md` na raiz nem `--acceptance` (salvo `--allow-missing-acceptance`)
- o arquivo indicado não existe, ou não há nenhuma linha AC-* de critério
- uma linha de critério AC-* tem Pass diferente de `[x]`, `[X]` ou `✅` (linhas de rastreabilidade, que não terminam em checkbox, são ignoradas)
- uma linha marcada tem evidência vazia ou com `{` / `}` (placeholder, ex.: `{curl}`)
- a seção `## Sign-off` ainda contém `- [ ]`
- `checklist.py` sai diferente de 0 — ele já sai 1 em check obrigatório/crítico e em qualquer falha. `--skip-checklist` pula essa checagem

| Flag | Efeito |
| --- | --- |
| `--acceptance` | Arquivo ACCEPTANCE (repetível). Sem ele, procura `*.acceptance.md` na raiz do projeto |
| `--allow-missing-acceptance` | Passa a checagem de ACCEPTANCE quando não há arquivo; o checklist ainda roda |
| `--skip-checklist` | Não executa `checklist.py` |
| `--checklist` | Caminho alternativo do checklist (padrão: `.cursor/scripts/checklist.py`) |

Testes: `cli/test/verify-gate.test.js` (10 casos; suíte CLI 50).

## trace_report.py

Relatório de rastreabilidade (P2 O-02). Imprime a cobertura SPEC → PLAN → ACCEPTANCE de um slug. Não reexecuta os checks: a coluna `check` vem do ACCEPTANCE.

Procura na raiz do projeto `{slug}.spec.md`, `{slug}.plan.md` (fallback `{slug}.md`), `{slug}.acceptance.md` e, se existir, `.axion/trace/{slug}.json`.

```bash
python3 .cursor/scripts/trace_report.py . {slug}
```

A tabela é `SPEC / PLAN / AC / check`, com `check` em `pass`, `open` ou `no-evidence`.

| Exit | Significado |
| --- | --- |
| `0` | Cadeia coberta |
| `1` | Gap |
| `2` | Slug inválido (não casa `^[a-z0-9]+(?:-[a-z0-9]+)*$`, inclusive path traversal) |

Um gap é qualquer um destes:

- arquivo SPEC, PLAN ou ACCEPTANCE ausente
- id da tabela de rastreabilidade da SPEC sem link de ACCEPTANCE
- AC sem link SPEC/PLAN
- task citada que não está no PLAN
- critério desmarcado (`open`) ou com evidência vazia ou placeholder (`no-evidence`)
- `.axion/trace/{slug}.json` que discorda dos links no markdown

Linhas de rastreabilidade que ainda são `{placeholders}` são ignoradas. O script não volta a rodar os checks do ACCEPTANCE.

Testes: `cli/test/trace-report.test.js` (9 casos; suíte CLI 50).

## memory_secret_scan.py

Scanner de segredos antes de gravar em `.agents/memory/` (P2 X-02). `/remember` roda este script e só escreve se a saída for limpa. O relatório nomeia o padrão e a linha; nunca inclui o segredo.

Varre um texto (`--text`), um arquivo, stdin (sem argumento) ou um diretório. A `.agents/memory/` deste repositório passa limpa.

```bash
python3 .cursor/scripts/memory_secret_scan.py --text "<texto>"
python3 .cursor/scripts/memory_secret_scan.py nota.md
python3 .cursor/scripts/memory_secret_scan.py .agents/memory
python3 .cursor/scripts/memory_secret_scan.py --redact nota.md
```

| Exit | Significado |
| --- | --- |
| `0` | Limpo (`memory_secret_scan: clean`), ou `--redact` concluiu |
| `1` | Recusado — não grave em `.agents/memory/`. O relatório lista `arquivo:linha: nome-do-padrão` e nunca o segredo |
| `2` | `--redact` apontado para um diretório |

`--redact` imprime uma cópia segura no stdout (segredos trocados por `[REDACTED]`) e a contagem no stderr. Não reescreve arquivos.

Padrões: cabeçalho de chave privada, chave AWS, tokens GitHub/npm/OpenAI/Slack, JWT, Bearer, URL com `user:pass`, atribuições como `token=...`, e linhas `.env` cujo nome termina em `KEY`, `SECRET`, `TOKEN` ou `PASSWORD`. Placeholders (`example`, `changeme`, `your-token`, `<...>`, `{...}`) são ignorados.

Testes: `cli/test/memory-secret-scan.test.js` (6 casos; suíte CLI 50).

## side_effect_guard.py

Allowlist de escrita do PLAN (P2 X-03). Antes de criar ou modificar um arquivo, `coordinator-mode`, `batch-operations`, o agent `orchestrator`, `/orchestrate` e `/coordinate` mandam rodar o guard e manter a allowlist como está. O agente honra o exit code.

Lê a seção exata `## Write allowlist`: bullet `- path` ou a primeira coluna da tabela. O `PLAN.template.md` já traz a seção. Sem seção, ou com ela vazia, todo write sai `no-allowlist`.

```bash
python3 .cursor/scripts/side_effect_guard.py . --plan {slug}.plan.md --effect write-files --write path/to/file
```

| Exit | Significado |
| --- | --- |
| `0` | Todos os `--write` passaram (`side_effect_guard: allowed <path>`) |
| `1` | Pelo menos um recusado (`side_effect_guard: refused <path> <motivo>`) |
| `2` | Uso inválido: plano ausente, sem `--write`, `--effect` fora do contrato, path com espaço, absoluto ou com segmento `..`. Nada é gravado |

Motivos no exit 1, nesta ordem: `no-allowlist`, `forbidden`, `effect-denied`, `outside-allowlist`.

- Cada `--write` precisa casar com um glob da lista (`**` atravessa segmentos; path que termina em `/` vale como `/**`). Fora da lista: `outside-allowlist`.
- `.env`, `.env.local` e qualquer arquivo `.env.*` que não termine em `.example` são `forbidden` mesmo se estiverem na lista. `.env.example` passa quando listado. Qualquer segmento de path que contenha `credentials` também é `forbidden`. Canonicalizar (`.`, `//`, barra invertida) não contorna isso.
- `--effect` é opcional e repetível. Valores do contrato: `none`, `read-only`, `write-files`, `write-memory`, `run-shell`, `invoke-agents`, `network`. Se passado, `.agents/memory` e qualquer path abaixo exigem `write-memory`; os demais exigem `write-files`. Um conjunto sem esse efeito — inclusive só `read-only` ou `none` — recusa com `effect-denied`. Sem `--effect`, a checagem é só allowlist + forbidden.
- `--forbidden` (repetível) soma globs extras, tratados como `forbidden`.
- A saída traz `allowed` ou `refused`, o path e o motivo. Nunca o conteúdo do arquivo.

Testes: `cli/test/side-effect-guard.test.js` (3 casos; `cd cli && npm test` = 56 pass / 0 fail).

## circuit_breaker.py

Circuit breaker da orquestração (P3 W-04). Stateless: uma chamada, um domínio. Antes de cada dispatch ou retry, `coordinator-mode`, `parallel-agents`, `/coordinate` e `/orchestrate` mandam rodar o script. O agente honra o exit; o IDE não bloqueia sozinho.

```bash
python3 .cursor/scripts/circuit_breaker.py --domain backend --domain-failures 0 --worker-failures 0
```

`--domain` é token `^[a-z0-9-]{1,40}$`. Defaults: `--max-retries 2`, `--trip-after 3`. Stdout é um único JSON (`domain`, `action`, `reason`, `fallback`, `domain_failures`, `worker_failures`). Sem texto livre de workers. Domínios são independentes: um `backend` aberto não bloqueia `frontend`.

| Exit | `action` | Quando |
| --- | --- | --- |
| `0` | `dispatch` | `worker-failures` 0 e o domínio fechado (`reason` `closed`, `fallback` null). Lance o worker |
| `0` | `retry` | `0 < worker-failures <= max-retries` (`reason` `within-limit`, `fallback` null). Lance de novo |
| `1` | `open` | `domain-failures >= trip-after` (`reason` `domain-failures`, `fallback` `partial-synthesis`). Prioridade sobre o retry: pare o domínio e escreva síntese parcial |
| `1` | `stop-worker` | `worker-failures > max-retries` (`reason` `retry-limit`, `fallback` `abandon-worker`). Só esse worker cai; o domínio segue até abrir |
| `2` | — | Contagem negativa, não inteira ou maior que 1000, `trip-after` menor que 1, ou domain inválido. Stdout vazio |

Testes: `cli/test/circuit-breaker.test.js` (3 casos; `cd cli && npm test` = 59 pass / 0 fail).

## verify_all.py

Suite completa pre-deploy (checklist + Lighthouse, Playwright, bundle, mobile, i18n):

```bash
python3 .cursor/scripts/verify_all.py .
python3 .cursor/scripts/verify_all.py . --url http://localhost:3000
```

## lint_paths.py

Detecta referências legadas a `.agents/scripts/` (canônico: `.cursor/scripts/`):

```bash
python3 .cursor/scripts/lint_paths.py .
python3 .cursor/scripts/lint_paths.py . --fix   # reescreve .cursor/commands/
```

Rodado no CI (`.github/workflows/ci.yml`).

## lint_contracts.py

Valida o frontmatter YAML contra os schemas de contrato (P2 Q-02), em **100%** das skills/commands:

| Alvo | Schema |
| --- | --- |
| `.agents/skills/*/SKILL.md` | `.agents/schemas/skill-contract.schema.json` |
| `.cursor/commands/*.md` | `.agents/schemas/command-contract.schema.json` |

Regra extra: `name` da skill deve ser igual ao nome da pasta. Validador Draft 7.

```bash
pip install pyyaml jsonschema
python3 .cursor/scripts/lint_contracts.py .
```

| Exit | Significado |
| --- | --- |
| `0` | Todos os arquivos batem com o schema |
| `1` | Violações (frontmatter ausente, YAML inválido, campo fora do schema, `name` ≠ pasta, schema ausente) |
| `2` | Dependência faltando (`pyyaml`/`jsonschema`) — imprime o `pip install` |

Rodado no CI (`.github/workflows/ci.yml`) e no gate `pre-publish` de `publish-npm.yml`.

## generate_inventory.py

Gera inventário machine-readable dos componentes do kit (P1 K-04):

```bash
python3 .cursor/scripts/generate_inventory.py .
python3 .cursor/scripts/generate_inventory.py . -o /tmp/inventory.json
```

Saída padrão: **`.axion/inventory.json`** — listas e contagens de `agents`, `skills`, `commands`, `rules`, `scripts` e `schemas` (`schema_version` 1.1.0). Saída **determinística**: sem `root` nem `generated_at`, então rodar de novo sem mudanças não gera diff. `-o` aceita caminho fora do projeto. Fonte única de counts para sync/`status`. A paridade com o filesystem e com `.cursor/ARCHITECTURE.md` é checada por `lint_inventory.py` (seção seguinte).

## lint_inventory.py

Paridade doc/inventário (P2 Q-03). Falha se as contagens documentadas divergirem do filesystem. Sem dependências extras: só `python3` e `generate_inventory.py` no mesmo diretório.

O que compara com o filesystem:

- Contagens da tabela **Overview** de `.cursor/ARCHITECTURE.md`
- Campo `counts` do `.axion/inventory.json` commitado
- Comentários de contagem na árvore de diretórios, quando existem

Contrato dos rótulos em negrito da overview — o script lê esse texto; não renomeie:

| Rótulo | Chave |
| --- | --- |
| Agents | `agents` |
| Skills | `skills` |
| Workflows | `commands` (slash commands, não uma pasta `workflows/`) |
| Regras por domínio | `rules` |
| Scripts master | `scripts` |
| Schemas de contrato | `schemas` |

Comentários da árvore, conferidos só se o texto aparecer: `# N personas` → agents, `# N skills top-level` → skills, `# N slash commands` → commands, `# N regras` → rules.

```bash
python3 .cursor/scripts/lint_inventory.py .
```

| Exit | Significado |
| --- | --- |
| `0` | Overview, comentários presentes e `inventory.json` batem com o filesystem |
| `1` | Divergência |

Como corrigir:

- Overview ou comentário da árvore desatualizado: edite a **contagem** em `.cursor/ARCHITECTURE.md` para o valor do filesystem. Mantenha os rótulos em negrito.
- Só `.axion/inventory.json` desatualizado: `python3 .cursor/scripts/generate_inventory.py .`

Não crie nem apague arquivos para fazer um número antigo do doc “fechar”.

Rodado no CI (`.github/workflows/ci.yml`), passo **Lint doc/inventory parity (Q-03)**, depois de `lint_contracts`.

## sync_upstream.py

Compare ou sincronize com [zanetta/axion](https://github.com/zanetta/axion):

```bash
python3 .cursor/scripts/sync_upstream.py              # dry-run
python3 .cursor/scripts/sync_upstream.py --apply      # aplicar
python3 .cursor/scripts/sync_upstream.py --apply --clone
```

Adaptações automáticas ao aplicar:

- Agents → `.claude/agents/` com paths `.cursor/scripts/`
- Workflows → `.cursor/commands/` sem `$ARGUMENTS`
- Preserva `/ui-ux-pro-max`

## CLI npm (`cli/`)

Instalar o kit em outro projeto (grava `.axion/kit.manifest.json`):

```bash
NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init
npx @zanetta/axion init --profile standard
npx @zanetta/axion init --profile security          # inclui superfície ofensiva
npx @zanetta/axion init --enable-offensive          # opt-in ofensivo em qualquer profile
npx @zanetta/axion status
```

Profiles: `minimal` \| `standard` (fallback) \| `security` \| `fullstack` \| `mobile` — sem `--profile`, `init`/`update` herdam do manifesto. Release automático: `.github/workflows/publish-npm.yml` (tag `v*`, gated por `ci.yml`; a tag deve bater com a versão de `cli/package.json`). Ver [`cli/README.md`](../../cli/README.md).

## session_manager.py

Gestão de sessão. Os subcomandos `status` e `info` resumem o projeto. `log` (O-01) e `doctor` (D-04) observam o kit instalado. Não é um script novo.

```bash
python3 .cursor/scripts/session_manager.py status .
python3 .cursor/scripts/session_manager.py info .
python3 .cursor/scripts/session_manager.py doctor .
python3 .cursor/scripts/session_manager.py log . --command-name verify --slug {slug} --exit 0 --artifact {slug}.acceptance.md
```

### `log`

Append-only em `.axion/logs/runs.jsonl`. Cada linha é um JSON. Não há campo de texto livre nem PII.

| Campo | Origem | Regra |
| --- | --- | --- |
| `ts` | gerado | ISO UTC |
| `command` | `--command-name` | obrigatório; `^[a-z0-9-]{1,40}$` |
| `artifacts` | `--artifact` (repetível) | path relativo, sem espaço, sem absoluto e sem `..` (também com `\`) |
| `slug` | `--slug` | opcional; o mesmo padrão de `command` |
| `exit` | `--exit` | opcional; inteiro — no `/verify`, o exit do `verify_gate.py` |

`--command-name` ausente, token inválido ou artifact inválido → exit 2 e nada é gravado. O `--exit 0` do exemplo é o sucesso do gate; grave o exit real. Se o gate falhar, registre esse número e pare o relatório. O `.gitignore` já tem `logs` (sem barra) e ignora qualquer diretório com esse nome, inclusive `.axion/logs/`.

### `doctor`

Imprime um JSON (sem indentação):

| Campo | Valor |
| --- | --- |
| `memory_index_lines` | linhas de `.agents/memory/MEMORY.md`; `0` se o arquivo não existe |
| `last_verify` | `{ts, slug, exit, artifacts}` do último registro com `command` `verify`, ou `null` |
| `path_lint` | `pass`, `fail` ou `absent` quando `lint_paths.py` não está no projeto |

`path_lint` executa `lint_paths.py`. Não reexecuta o verify. O `axion status` lê esse JSON quando `.cursor/scripts/session_manager.py` existe e imprime Memory index, Path lint e Last verify.

## Outros

| Script | Uso |
| --- | --- |
| `session_manager.py` | Gestão de sessão — `status`, `info`, `log`, `doctor` (seção acima) |
| `auto_preview.py` | Preview de servidor local |

Scripts por skill: `.agents/skills/<skill>/scripts/`.

## Documentação relacionada

| Arquivo | Conteúdo |
| --- | --- |
| [`README.md`](../../README.md) | Guia principal, comandos, fluxos |
| [`AGENT_FLOW.md`](../../AGENT_FLOW.md) | Fluxo de agents + FSM SDD |
| [`.cursor/ARCHITECTURE.md`](../ARCHITECTURE.md) | Arquitetura, FSM, profiles, inventário |
| [`cli/README.md`](../../cli/README.md) | CLI npm + troubleshooting |
