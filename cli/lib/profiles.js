export const PROFILE_NAMES = ["minimal", "standard", "security", "fullstack", "mobile"];
export const DEFAULT_PROFILE = "standard";

const OFFENSIVE_SKILLS = new Set(["red-team-tactics"]);
const OFFENSIVE_AGENTS = new Set(["penetration-tester"]);

const MINIMAL_AGENTS = new Set([
    "orchestrator",
    "project-planner",
    "debugger",
    "test-engineer",
    "documentation-writer",
    "explorer-agent",
    "code-archaeologist",
    "security-auditor",
    "backend-specialist",
    "frontend-specialist",
    "devops-engineer",
]);

/** Process skills kept in minimal even when no kept agent references them. */
const MINIMAL_CORE_SKILLS = new Set([
    "clean-code",
    "brainstorming",
    "plan-writing",
    "architecture",
    "verify-changes",
    "systematic-debugging",
    "testing-patterns",
    "tdd-workflow",
    "lint-and-validate",
    "memory-system",
    "context-compression",
    "coordinator-mode",
    "parallel-agents",
    "behavioral-modes",
    "app-builder",
    "intelligent-routing",
    "documentation-templates",
    "code-review-checklist",
]);

const EXCLUDED_AGENTS = {
    fullstack: new Set(["game-developer", "mobile-developer"]),
    mobile: new Set(["game-developer", "seo-specialist", "frontend-specialist"]),
};

const EXCLUDED_SKILLS = {
    fullstack: new Set(["game-development", "mobile-design"]),
    mobile: new Set([
        "game-development",
        "nextjs-react-expert",
        "tailwind-patterns",
        "seo-fundamentals",
        "geo-fundamentals",
    ]),
};

export function isValidProfile(name) {
    return PROFILE_NAMES.includes(name);
}

export function isOffensiveEnabled(profile, enableOffensive) {
    return profile === "security" || enableOffensive === true;
}

/**
 * CLI flags win; otherwise inherit from the installed manifest.
 * An explicit --profile without --enable-offensive turns offensive off (unless security).
 */
export function resolveInstallSettings(options = {}, manifest = null) {
    const profile = options.profile ?? manifest?.profile ?? DEFAULT_PROFILE;
    let enableOffensive = manifest?.enable_offensive === true;
    if (options.profile !== undefined) enableOffensive = false;
    if (options.enableOffensive === true) enableOffensive = true;
    return { profile, enableOffensive };
}

/** Reads `skills: a, b, c` from agent frontmatter. */
export function parseAgentSkills(markdown) {
    const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const line = frontmatter?.[1].match(/^skills:[ \t]*(.+)$/m);
    if (!line) return [];
    return line[1].split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * @param {string} profile
 * @param {{ enableOffensive?: boolean, agentSkills?: Map<string, string[]> }} opts
 *   agentSkills: template agent name → skills declared in its frontmatter
 */
export function resolveProfile(profile, { enableOffensive = false, agentSkills = new Map() } = {}) {
    const includeOffensive = isOffensiveEnabled(profile, enableOffensive);

    const keepAgent = (name) => {
        if (OFFENSIVE_AGENTS.has(name)) return includeOffensive;
        if (profile === "minimal") return MINIMAL_AGENTS.has(name);
        return !EXCLUDED_AGENTS[profile]?.has(name);
    };

    const requiredSkills = new Set();
    for (const [agent, skills] of agentSkills) {
        if (keepAgent(agent)) skills.forEach((s) => requiredSkills.add(s));
    }

    const keepSkill = (name) => {
        if (OFFENSIVE_SKILLS.has(name)) return includeOffensive;
        if (requiredSkills.has(name)) return true;
        if (profile === "minimal") return MINIMAL_CORE_SKILLS.has(name);
        return !EXCLUDED_SKILLS[profile]?.has(name);
    };

    return { profile, includeOffensive, keepAgent, keepSkill };
}
