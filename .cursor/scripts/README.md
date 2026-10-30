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

## Outros

| Script | Uso |
| --- | --- |
| `session_manager.py` | Gestão de sessão |
| `auto_preview.py` | Preview de servidor local |

Scripts por skill: `.agents/skills/<skill>/scripts/`.

## Documentação relacionada

| Arquivo | Conteúdo |
| --- | --- |
| [`README.md`](../../README.md) | Guia principal, comandos, fluxos |
| [`AGENT_FLOW.md`](../../AGENT_FLOW.md) | Fluxo de agents + FSM SDD |
| [`.cursor/ARCHITECTURE.md`](../ARCHITECTURE.md) | Arquitetura, FSM, profiles, inventário |
| [`cli/README.md`](../../cli/README.md) | CLI npm + troubleshooting |
