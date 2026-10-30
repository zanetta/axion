# @zanetta/axion CLI

Install the Axion kit — spec-driven development for Cursor — into any project.

**npm:** [`@zanetta/axion@1.1.0`](https://www.npmjs.com/package/@zanetta/axion).

## Usage

```bash
npx @zanetta/axion init
npx @zanetta/axion init --profile standard
npx @zanetta/axion init --profile security
npx @zanetta/axion init --profile minimal --enable-offensive
npx @zanetta/axion init --force
npx @zanetta/axion init --dry-run
npx @zanetta/axion update
npx @zanetta/axion status
```

`init` instala no **diretório atual** (`cwd`). Para outro path: `init --path ~/dev/meu-app`.

## Profiles (`--profile`)

O **profile** filtra o que é copiado **no momento da cópia** (`isInProfile` em `cli/lib/install.js` + `resolveProfile` → `keepAgent`/`keepSkill` em `cli/lib/profiles.js`). O CLI **nunca apaga** arquivos no projeto alvo.

| Profile | Conteúdo (resumo) | Pack real (aprox.) |
| --- | --- | --- |
| `minimal` | 11 agents core + skills de processo (planejamento, verify, orquestração básica) + dependências | 11 agents / 35 skills |
| `standard` | Pack completo **sem** superfície ofensiva (fallback final) | 19 / 44 |
| `security` | Pack completo **com** `red-team-tactics` + `penetration-tester` | 20 / 45 |
| `fullstack` | Pack sem game/mobile (e skills relacionadas) | 17 / 42 |
| `mobile` | Pack focado mobile; exclui game, SEO e parte do stack web | 16 / 39 |

**Fechamento de dependências:** uma skill é sempre copiada se algum agent mantido a lista no `skills:` do frontmatter — sem referências penduradas. `security-auditor` não declara `red-team-tactics` no frontmatter; só a carrega se estiver instalada (nota opt-in no corpo do agent).

**Fora do profile:** componentes do kit (skill/agent) excluídos pelo profile mas que **já existem** no projeto são mantidos e listados no resumo como aviso (*outside profile — remove manually*). Consequência: trocar para um profile menor **não** remove arquivos instalados antes — apague-os à mão se quiser. O resumo mostra o contador **`Excluded`** (fora do profile), separado de `Skipped`.

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

Caso contrário **não são copiados** e o CLI grava **`.axion/OFFENSIVE_DISABLED.md`**, que sugere `npx @zanetta/axion update --enable-offensive` ou `update --profile security`.

## Manifesto e status (SemVer)

`init` e `update` gravam **`.axion/kit.manifest.json`** no projeto (via `cli/lib/manifest.js`). O arquivo **não** vem do template do pack — é estado local do kit instalado.

| Campo (resumo) | Significado |
| --- | --- |
| `version` | SemVer do pacote `@zanetta/axion` usado no install/update |
| `profile` | Profile aplicado (`minimal` \| `standard` \| `security` \| `fullstack` \| `mobile`); herdado no próximo `update`/`init` sem `--profile` |
| `enable_offensive` | `true` se `--profile security` ou `--enable-offensive` (ou herdado); herdado sem `--profile` explícito |
| `installed_at` / `updated_at` | Timestamps ISO |
| `components` | Contagem de agents, skills, commands, rules |
| `checksums` | Hash parcial de `AGENTS.md` (expansível) |

`npx @zanetta/axion status` lê o manifesto e mostra:

- versão **instalada** no projeto (+ profile)
- comparação com a versão **latest** no registry npm (quando a rede responde)

Se o manifesto não existir (install antigo), rode `init`/`update` de novo para criá-lo.

## Install scope

Cópia base (filtrada pelo profile durante a cópia):

- `.claude/agents/`
- `.agents/` (skills + memory + `schemas/` + templates SDD)
- `.cursor/` (commands, rules, scripts, mcp, shared)
- `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`
- **`.axion/trace/README.md`** — único arquivo copiado do `.axion/` do template (`KIT_AXION_FILES` em `cli/lib/constants.js`)
- **`.axion/kit.manifest.json`** — gravado pelo CLI (não vem do template)

O `inventory.json` e o manifesto do próprio repo do kit **não** são copiados. Inventário machine-readable (maintainers ou consumidores): `python3 .cursor/scripts/generate_inventory.py .` → `.axion/inventory.json`.

## Merge behavior (default)

| Path | Behavior |
| --- | --- |
| `.cursor/mcp.json` | Merge `mcpServers` (project wins on key conflict) |
| `.cursor/rules/*.mdc` | Skip if file already exists |
| Other files | Skip if exists; `--force` overwrites all |

## Development

```bash
cd cli && npm install && npm test

# Local install from repo root (sem npm registry)
AXION_REPO=/path/to/axion \
  node bin/index.js init --path /tmp/my-app --dry-run
```

## Publish (GitHub Actions)

Publicação automática ao push de uma tag `v*`:

```bash
git tag v1.0.1
git push origin v1.0.1
```

Workflow: [`.github/workflows/publish-npm.yml`](../.github/workflows/publish-npm.yml)

1. Extrai versão da tag (`v1.2.3` → `1.2.3`)
2. Atualiza `cli/package.json`
3. Roda `npm ci` + `npm test`
4. Publica no npm

### Secret GitHub

| Secret | Valor |
| --- | --- |
| `NPM_TOKEN` | Token granular com **publish** + **bypass 2FA** |

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
