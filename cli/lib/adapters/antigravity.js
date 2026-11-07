const GEMINI_STUB = `# Axion

This project uses the Axion spec-driven development kit.

Read @AGENTS.md and AGENT_FLOW.md for routing, FSM, skills, and verification gates.

SDD slash commands are Agent skills under \`.agents/skills/ax-*/SKILL.md\` (invoke as \`/ax-plan\`, \`/ax-discover\`, …). Domain skills also live in \`.agents/skills/\`.
`;

function posix(rel) {
    return rel.split("\\").join("/");
}

function sanitizeMcp(text) {
    const data = JSON.parse(text);
    const servers = data.mcpServers ?? {};
    for (const server of Object.values(servers)) {
        if (!server || typeof server !== "object") continue;
        delete server.envFile;
        if (Array.isArray(server.args)) {
            server.args = server.args.map((arg) =>
                typeof arg === "string" ? arg.replace(/\$\{env:([^}]+)\}/g, "${$1}") : arg,
            );
        }
    }
    return `${JSON.stringify(data, null, 4)}\n`;
}

function unquote(value) {
    if (!value) return "";
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1);
    }
    return value;
}

function yamlQuote(value) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseCursorFrontmatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { fields: null, body: text };
    const fields = {};
    for (const line of match[1].split("\n")) {
        const idx = line.indexOf(":");
        if (idx === -1) continue;
        fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return { fields, body: match[2] };
}

function toAntigravityRule(text, destRel) {
    const { fields, body } = parseCursorFrontmatter(text);
    const basename = posix(destRel).split("/").pop().replace(/\.md$/, "");
    const fallback = `Workspace rule: ${basename}`;

    let trigger = "model_decision";
    let description = fallback;
    let globs = "";

    if (fields) {
        description = unquote(fields.description) || fallback;
        globs = unquote(fields.globs);
        if (fields.alwaysApply === "true") trigger = "always_on";
        else if (globs) trigger = "glob";
        else trigger = "model_decision";
    }

    const lines = ["---", `trigger: ${trigger}`, `description: ${yamlQuote(description)}`];
    if (trigger === "glob" && globs) lines.push(`globs: ${yamlQuote(globs)}`);
    lines.push("---", "");
    return `${lines.join("\n")}${body.replace(/^\n/, "")}`;
}

/** Map pack/commands/ax-plan.md → .agents/skills/ax-plan/SKILL.md */
function commandToSkillDest(sub) {
    const rest = sub.replace(/^commands\//, "");
    if (!rest.endsWith(".md")) return null;
    const stem = rest.slice(0, -".md".length);
    return `.agents/skills/${stem}/SKILL.md`;
}

function toCommandSkill(text, stem) {
    const { fields, body } = parseCursorFrontmatter(text);
    const description =
        (fields && unquote(fields.description)) || `Axion SDD workflow /${stem}`;
    const name = (fields && unquote(fields.name)) || stem;
    const lines = ["---", `name: ${name}`, `description: ${yamlQuote(description)}`, "---", ""];
    return `${lines.join("\n")}${body.replace(/^\n/, "")}`;
}

export function mapTemplateTargets(rel) {
    const src = posix(rel);
    const sub = src.startsWith("pack/") ? src.slice("pack/".length) : src;

    if (
        sub === "agents" ||
        sub.startsWith("agents/") ||
        sub === ".claude/agents" ||
        sub.startsWith(".claude/agents/")
    ) {
        return [];
    }
    if (sub === ".cursor/commands" || sub.startsWith(".cursor/commands/")) {
        return [];
    }
    if (sub === "commands" || sub.startsWith("commands/")) {
        if (sub === "commands") return [];
        const dest = commandToSkillDest(sub);
        return dest ? [dest] : [];
    }
    if (sub === ".cursor/rules" || sub.startsWith(".cursor/rules/")) {
        return [];
    }
    if (sub === "rules" || sub.startsWith("rules/")) {
        return [sub.replace(/^rules/, ".agents/rules").replace(/\.mdc$/, ".md")];
    }
    if (sub === ".cursor/shared" || sub.startsWith(".cursor/shared/")) {
        return [];
    }
    if (sub === "shared" || sub.startsWith("shared/")) {
        return [sub.replace(/^shared/, ".agents/shared")];
    }
    if (sub === "ARCHITECTURE.md" || sub === ".cursor/ARCHITECTURE.md") {
        return [];
    }
    if (sub === "skills" || sub.startsWith("skills/")) {
        return [sub.replace(/^skills/, ".agents/skills")];
    }
    if (sub === ".agents/skills" || sub.startsWith(".agents/skills/")) {
        return [sub];
    }
    if (sub === "schemas" || sub.startsWith("schemas/")) {
        return [sub.replace(/^schemas/, ".agents/schemas")];
    }
    if (sub === "memory" || sub.startsWith("memory/")) {
        return [sub.replace(/^memory/, ".agents/memory")];
    }
    if (
        sub === "scripts" ||
        sub.startsWith("scripts/") ||
        sub === ".cursor/scripts" ||
        sub.startsWith(".cursor/scripts/")
    ) {
        return [sub.replace(/^(?:\.cursor\/)?scripts/, ".axion/scripts")];
    }
    if (sub === "mcp.json" || sub === ".cursor/mcp.json") {
        return [".agents/mcp_config.json"];
    }
    if (src === "AGENTS.md") return ["AGENTS.md", "GEMINI.md"];
    return [src];
}

export function transformContent(_srcRel, destRel, text) {
    const dest = posix(destRel);
    if (dest === "GEMINI.md") return GEMINI_STUB;
    if (dest === ".agents/mcp_config.json") return sanitizeMcp(text);
    if (dest.startsWith(".agents/rules/") && dest.endsWith(".md")) {
        return toAntigravityRule(text, dest);
    }
    const skillCmd = dest.match(/^\.agents\/skills\/(ax-[^/]+)\/SKILL\.md$/);
    if (skillCmd) return toCommandSkill(text, skillCmd[1]);
    return text;
}

export const antigravityAdapter = {
    id: "antigravity",
    label: "Google Antigravity",
    installPaths: [
        ".agents",
        ".axion/scripts",
        ".agents/mcp_config.json",
        "AGENTS.md",
        "GEMINI.md",
        "AGENT_FLOW.md",
        ".env.example",
    ],
    mergeJsonFiles: new Set([".agents/mcp_config.json"]),
    markers: [
        "AGENTS.md",
        ".agents/skills",
        ".axion/scripts",
        ".agents/mcp_config.json",
    ],
    componentDirs: {
        agents: null,
        skills: ".agents/skills",
        // SDD commands install as ax-* skills under the same tree
        commands: ".agents/skills",
        rules: ".agents/rules",
    },
    /** When true, manifest counts commands as ax-* skill dirs under skills. */
    commandsAsSkills: true,
    rulesExt: ".md",
    mapTemplateTargets,
    transformContent,
    postInstallHints: [
        "Open in Antigravity IDE or CLI; instructions load from AGENTS.md and skills from .agents/skills/.",
        "Axion SDD slash skills: /ax-discover, /ax-specify, /ax-plan, /ax-implement, /ax-verify, /ax-remember, … (under .agents/skills/ax-*/SKILL.md). /ax-design searchable guide remains skill design-guide.",
        "If you previously installed Axion workflows, remove stale .agents/workflows/{discover,plan,…}.md manually (update is additive).",
        "MCP servers: .agents/mcp_config.json. This install does not write ~/.gemini/.",
        "Inventory: python3 .axion/scripts/generate_inventory.py .",
    ],
};
