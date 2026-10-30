/**
 * Install profiles (P1 D-02) + offensive opt-in (P1 X-01).
 *
 * After a full template copy, prune paths not included in the profile.
 * Offensive surface (red-team / penetration-tester) is OFF unless
 * profile === "security" OR enableOffensive === true.
 */

export const PROFILE_NAMES = [
    "minimal",
    "standard",
    "security",
    "fullstack",
    "mobile",
];

const OFFENSIVE_SKILLS = ["red-team-tactics"];
const OFFENSIVE_AGENTS = ["penetration-tester"];

/** Skills kept in minimal profile (top-level folder names). */
const MINIMAL_SKILLS = new Set([
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
    "bash-linux",
    "powershell-windows",
]);

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

const FULLSTACK_EXCLUDE_SKILLS = new Set([
    "game-development",
    "mobile-design",
    "rust-pro",
]);

const FULLSTACK_EXCLUDE_AGENTS = new Set([
    "game-developer",
    "mobile-developer",
]);

const MOBILE_EXCLUDE_SKILLS = new Set([
    "game-development",
    "nextjs-react-expert",
    "tailwind-patterns",
    "seo-fundamentals",
    "geo-fundamentals",
    "rust-pro",
]);

const MOBILE_EXCLUDE_AGENTS = new Set([
    "game-developer",
    "seo-specialist",
    "frontend-specialist", // mobile-developer covers UI
]);

/**
 * @param {string} name
 * @returns {boolean}
 */
export function isValidProfile(name) {
    return PROFILE_NAMES.includes(name);
}

/**
 * Resolve exclusions for a profile.
 * @param {string} profile
 * @param {{ enableOffensive?: boolean }} opts
 * @returns {{ excludeSkillDirs: string[], excludeAgentFiles: string[], includeOffensive: boolean }}
 */
export function resolveProfileExclusions(profile, opts = {}) {
    const enableOffensive = opts.enableOffensive === true || profile === "security";
    const excludeSkillDirs = new Set();
    const excludeAgentFiles = new Set();

    if (profile === "minimal") {
        // Will be computed against actual dirs — marker for "allowlist mode"
        return {
            mode: "allowlist",
            allowSkills: MINIMAL_SKILLS,
            allowAgents: MINIMAL_AGENTS,
            excludeSkillDirs: [],
            excludeAgentFiles: enableOffensive ? [] : [...OFFENSIVE_AGENTS.map((a) => `${a}.md`)],
            includeOffensive: enableOffensive,
            // still exclude offensive skills unless enabled
            forceExcludeSkills: enableOffensive ? [] : [...OFFENSIVE_SKILLS],
        };
    }

    if (profile === "fullstack") {
        for (const s of FULLSTACK_EXCLUDE_SKILLS) excludeSkillDirs.add(s);
        for (const a of FULLSTACK_EXCLUDE_AGENTS) excludeAgentFiles.add(`${a}.md`);
    }

    if (profile === "mobile") {
        for (const s of MOBILE_EXCLUDE_SKILLS) excludeSkillDirs.add(s);
        for (const a of MOBILE_EXCLUDE_AGENTS) excludeAgentFiles.add(`${a}.md`);
    }

    // standard + security + others: full pack, then strip offensive unless allowed
    if (!enableOffensive) {
        for (const s of OFFENSIVE_SKILLS) excludeSkillDirs.add(s);
        for (const a of OFFENSIVE_AGENTS) excludeAgentFiles.add(`${a}.md`);
    }

    return {
        mode: "denylist",
        allowSkills: null,
        allowAgents: null,
        excludeSkillDirs: [...excludeSkillDirs],
        excludeAgentFiles: [...excludeAgentFiles],
        includeOffensive: enableOffensive,
        forceExcludeSkills: [],
    };
}
