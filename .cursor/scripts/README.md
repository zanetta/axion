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

Instalar o kit em outro projeto:

```bash
NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init
```

Release automático: `.github/workflows/publish-npm.yml` (tag `v*`). Ver [`cli/README.md`](../../cli/README.md).

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
| [`AGENT_FLOW.md`](../../AGENT_FLOW.md) | Fluxo de agentes |
| [`.cursor/ARCHITECTURE.md`](../ARCHITECTURE.md) | Arquitetura completa |
| [`cli/README.md`](../../cli/README.md) | CLI npm + troubleshooting |
