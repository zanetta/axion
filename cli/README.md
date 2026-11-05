# @zanetta/axion CLI

Install the Axion kit — spec-driven development with adapters per tool — into any project.

**npm:** [`@zanetta/axion@1.2.0`](https://www.npmjs.com/package/@zanetta/axion). Default tool: **Cursor** (`--tool cursor`). Claude Code: `--tool claude-code`. OpenAI Codex: `--tool codex`. Windsurf: `--tool windsurf`. Google Antigravity: `--tool antigravity`.

## Usage

```bash
npx @zanetta/axion init
npx @zanetta/axion init --profile standard
npx @zanetta/axion init --tool claude-code
npx @zanetta/axion init --tool codex
npx @zanetta/axion init --tool windsurf
npx @zanetta/axion init --tool antigravity
npx @zanetta/axion init --profile security
npx @zanetta/axion init --profile minimal --enable-offensive
npx @zanetta/axion init --force
npx @zanetta/axion init --dry-run
npx @zanetta/axion update
npx @zanetta/axion status
```

`init` instala no **diretório atual** (`cwd`). Para outro path: `init --path ~/dev/meu-app`.

## Tools (`--tool`)

`--tool` escolhe o **adapter de instalação** (onde o pack é projetado). É ortogonal a `--profile` (o profile filtra *o quê*; o tool decide *onde*).

| Tool | Destino principal | Default |
| --- | --- | --- |
| `cursor` | `.cursor/commands/`, `.cursor/rules/`, `.cursor/mcp.json` | sim (omitir a flag) |
| `claude-code` | `.claude/commands/` (`$ARGUMENTS`, inclui `/design`), `.claude/skills/`, `.agents/shared/`, `CLAUDE.md`, `.mcp.json` | não |
| `codex` | `.agents/skills/`, `.agents/shared/`, `.codex/config.toml` (`[mcp_servers.<id>]`), `AGENTS.md` (sem slash commands) | não |
| `windsurf` | `.agents/skills/`, `.agents/shared/`, `.windsurf/mcp_config.json` (`mcpServers` JSON), `AGENTS.md` (sem slash commands) | não |
| `antigravity` | `.agents/workflows/`, `.agents/rules/*.md`, `.agents/skills/`, `.agents/mcp_config.json`, `AGENTS.md`, `GEMINI.md` | não |

`update` sem `--tool` herda `manifest.tool`. ID desconhecido sai com código ≠ 0 e lista `cursor, claude-code, codex, windsurf, antigravity`.

## Profiles (`--profile`)

O **profile** filtra o que é copiado **no momento da cópia** (`isInProfile` em `cli/lib/install.js` + `resolveProfile` → `keepAgent`/`keepSkill` em `cli/lib/profiles.js`). O CLI **nunca apaga** arquivos no projeto alvo.

| Profile | Conteúdo (resumo) | Pack real (aprox.) |
| --- | --- | --- |
| `minimal` | 11 agents core + skills de processo (planejamento, verify, orquestração, design-guide) + dependências | 11 agents / 36 skills |
| `standard` | Pack completo **sem** superfície ofensiva (fallback final) | 19 / 45 |
| `security` | Pack completo **com** `red-team-tactics` + `penetration-tester` | 20 / 46 |
| `fullstack` | Pack sem game/mobile (e skills relacionadas) | 17 / 43 |
| `mobile` | Pack focado mobile; exclui game, SEO e parte do stack web | 16 / 40 |

**Fechamento de dependências:** uma skill é sempre copiada se algum agent mantido a lista no `skills:` do frontmatter — sem referências penduradas. `security-auditor` não declara `red-team-tactics` no frontmatter; só a carrega se estiver instalada (nota opt-in no corpo do agent).

**Fora do profile:** componentes do kit (skill/agent) excluídos pelo profile mas que **já existem** no projeto são mantidos e listados no resumo como aviso (*outside profile — remove manually*). Consequência: trocar para um profile menor **não** remove arquivos instalados antes — apague-os à mão se quiser. O resumo mostra o contador `Excluded` (fora do profile), separado de `Skipped`.

### Herança de profile no `init`/`update`

Flags omitidas são herdadas de `.axion/kit.manifest.json`. `--profile` não tem default fixo:

| Flags passadas | `profile` | Offensive |
| --- | --- | --- |
| nenhuma | manifesto → senão `standard` | herdado do manifesto (`enable_offensive`) |
| `--profile X` | `X` | **off** (exceto `security`) |
| `--enable-offensive` | manifesto → senão `standard` | **on** |
| `--profile X --enable-offensive` | `X` | **on** |

### Offensive opt-in (`--enable-offensive`)

Skills/agents ofensivos (`red-team-tactics`, `penetration-tester`) só entram se:

- `--profile security`, **ou**
- `--enable-offensive` (qualquer profile), **ou**
- herdado de um manifesto com `enable_offensive: true` (sem `--profile` explícito)

Caso contrário **não são copiados** e o CLI grava `.axion/OFFENSIVE_DISABLED.md`, que sugere `npx @zanetta/axion update --enable-offensive` ou `update --profile security`.

## Manifesto e status (SemVer)

`init` e `update` gravam `.axion/kit.manifest.json` no projeto (via `cli/lib/manifest.js`). O arquivo **não** vem do template do pack — é estado local do kit instalado.

| Campo (resumo) | Significado |
| --- | --- |
| `version` | SemVer do pacote `@zanetta/axion` usado no install/update |
| `profile` | Profile aplicado (`minimal` \| `standard` \| `security` \| `fullstack` \| `mobile`); herdado no próximo `update`/`init` sem `--profile` |
| `tool` | Adapter (`cursor` \| `claude-code` \| `codex` \| `windsurf` \| `antigravity`); herdado no próximo `update`/`init` sem `--tool`; manifesto antigo sem o campo vale `cursor` |
| `enable_offensive` | `true` se `--profile security` ou `--enable-offensive` (ou herdado); herdado sem `--profile` explícito |
| `installed_at` / `updated_at` | Timestamps ISO |
| `components` | Contagem de agents, skills, commands, rules |
| `checksums` | Hash parcial de `AGENTS.md` (expansível) |

`npx @zanetta/axion status` lê o manifesto e mostra:

- versão do **CLI** e versão **instalada** no projeto (`version`, `profile`, `tool`, `enable_offensive`)
- comparação com a versão **latest** no registry npm (quando a rede responde)
- se `.axion/scripts/session_manager.py` existir (com fallback para `.cursor/scripts/session_manager.py` em installs v1), três campos do `doctor`: **Memory index** (linhas de `MEMORY.md`), **Path lint** (`pass`, `fail` ou `absent`) e **Last verify** (`ts`, slug e exit, ou `none`)

Se o manifesto não existir (install antigo), rode `init`/`update` de novo para criá-lo.

## Install scope

A fonte do kit vive em `pack/` + `.axion/scripts/`. Cópia no destino (filtrada pelo profile, projetada pelo `--tool`):

- `.claude/agents/`
- `.agents/` (skills + memory + `schemas/` + templates SDD + `shared/ui-ux-pro-max/`)
- `.axion/scripts/` — scripts master de gate e validação nos dois adapters (**breaking em relação à v1**, onde `.cursor/scripts/` deixou de ser o path canônico; `axion update` é aditivo e não apaga `.cursor/scripts/` residual)
- `cursor`: `.cursor/` (commands, rules, mcp, `ARCHITECTURE.md`)
- `claude-code`: `.claude/commands/` (inclui `/design`), `.claude/skills/`, `CLAUDE.md`, `.mcp.json`, `.cursor/ARCHITECTURE.md`
- `codex`: `.codex/config.toml` (merge aditivo de `[mcp_servers.<id>]`; omite agents, commands e rules)
- `windsurf`: `.windsurf/mcp_config.json` (merge aditivo de `mcpServers`; omite agents, commands e rules)
- `antigravity`: `.agents/workflows/`, `.agents/rules/*.md`, `.agents/mcp_config.json`, `GEMINI.md` (omite agents e `ARCHITECTURE.md`)
- `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`
- `.axion/trace/README.md` — copiado do `.axion/` do template (`KIT_AXION_FILES` em `cli/lib/constants.js`)
- `.axion/kit.manifest.json` — gravado pelo CLI (não vem do template)

O `inventory.json` e o manifesto do próprio repo do kit **não** são copiados. Inventário machine-readable (maintainers ou consumidores): `python3 .axion/scripts/generate_inventory.py .` → `.axion/inventory.json`.

## Merge behavior (default)

| Path | Behavior |
| --- | --- |
| `.cursor/mcp.json` | Merge `mcpServers` (project wins on key conflict) |
| `.windsurf/mcp_config.json` | Merge `mcpServers` (project wins on key conflict) |
| `.agents/mcp_config.json` | Merge `mcpServers` (project wins on key conflict) |
| `.cursor/rules/*.mdc` | Skip if file already exists |
| Other files | Skip if exists; `--force` overwrites kit files that are not protected |
| Protected | Se o destino já existe, ação `protected` e não sobrescreve, mesmo com `--force`. Destino ausente: a primeira instalação ainda copia |

Paths protegidos (`cli/lib/protect.js`): `*.spec.md`, `*.plan.md`, `*.acceptance.md`, prefixo `.agents/memory/`, prefixo `.axion/logs/` e `.axion/trace/*` exceto `README.md` (`.axion/trace/README.md` ou qualquer path que termine em `/README.md`).

Antes de copiar, `init`/`update` chamam `diffKit` (respeitando o profile) e comparam o conteúdo byte a byte. Sem `--quiet`, a lista é só informativa — não há prompt por path:

- **Drift** — até 20 paths. Ficam como estão; `--force` sobrescreve esses arquivos do kit.
- **Protected** — até 20 paths. Nunca sobrescritos se já existem.
- **Missing** — contagem dos arquivos do kit que serão adicionados.

`--force` é o interruptor global só para o que não é protegido. Um `.cursor/commands/plan.md` editado localmente entra no drift e pode ser sobrescrito; um `*.plan.md` de SPEC/PLAN do usuário, não. O resumo inclui o contador **Protected**.

## Development

```bash
cd cli && npm install && npm test

# Local install from repo root (sem npm registry)
AXION_REPO=/path/to/axion \
  node bin/index.js init --path /tmp/my-app --dry-run
```

## Publish (GitHub Actions)

Publicação automática ao push de uma tag `v*`. A versão vem de `cli/package.json` (o workflow **não** reescreve mais a versão a partir da tag):

```bash
# 1. bump "version" em cli/package.json (ex.: 1.1.0) e commit
git commit -am "release: v1.1.0"
# 2. tag igual à versão do package.json
git tag v1.1.0
git push origin main v1.1.0
```

Workflow: [`.github/workflows/publish-npm.yml`](../.github/workflows/publish-npm.yml)

1. Job `pre-publish` — reusa [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): `lint_paths.py`, `lint_contracts.py`, `npm test` (inclui smoke pós-install de todos os profiles em `cli/test/smoke.test.js`)
2. Job `publish` (`needs: pre-publish`) — **falha** se a tag ≠ versão de `cli/package.json`
3. `npm ci` + publica no npm

### Secret GitHub

O workflow **não lê** `.env`. O token precisa existir em **Settings → Secrets and variables → Actions**:

| Secret | Valor |
| --- | --- |
| `NPM_TOKEN` | Token granular com **publish** + **bypass 2FA** (mesmo nome da chave local em `.env`) |

Sem esse secret, o job `publish` falha no passo `Require NPM_TOKEN`.

### Publish manual (local)

Registry do projeto (`.npmrc`): `@zanetta:registry=https://registry.npmjs.org/`

```bash
npm install
npm test --workspace=@zanetta/axion
npm publish --workspace=@zanetta/axion --access public --otp=CODIGO   # se 2FA ativa
```

## Troubleshooting

| Erro | Causa | Solução |
| --- | --- | --- |
| `ENEEDAUTH` | Token ausente ou registry errado | Usar `registry.npmjs.org`; `npm login` |
| `E403` (2FA) | Conta sem 2FA ou token sem bypass | 2FA + `--otp` ou token granular com bypass |
| `E403` (permission) | Scope `@zanetta` incorreto | Publicar com conta dona do scope |
| `E404` / `ENOVERSIONS` | `min-release-age` ou `before` no `~/.npmrc` | `NPM_CONFIG_MIN_RELEASE_AGE=0 npx …` |
| Typo | Nome errado | `@zanetta/axion` |

### E404 / ENOVERSIONS no `npx init`

Pacote publicado — confirme:

```bash
npm view @zanetta/axion version
```

Se retornar versão mas `npx` falha, verifique filtros:

```bash
npm config get min-release-age   # ex.: 7 bloqueia pacotes novos
npm config get before
```

Contorno:

```bash
NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init
# ou
npm config delete min-release-age
```

### E403 — 2FA obrigatória para publish

**Opção A — 2FA + OTP (local):**

1. [npm → Security → 2FA](https://www.npmjs.com/settings/zanetta/tfa) — modo **Authorization and publishing**
2. `npm publish … --otp=SEU_CODIGO`

**Opção B — Token granular (CI / local):**

1. [Generate Granular Access Token](https://www.npmjs.com/settings/zanetta/tokens)
2. Read and Write em `@zanetta/*` + **Bypass 2FA for automation**
3. `npm config set //registry.npmjs.org/:_authToken npm_TOKEN`

### Instalação em projeto existente

```bash
cd ~/dev/meu-projeto
NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init
```

Merge preserva `.cursor/rules/` e `mcp.json` customizados.

### Sem npm registry

```bash
AXION_REPO=/caminho/axion \
  node /caminho/axion/cli/bin/index.js init --path .
```
