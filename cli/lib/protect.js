/** User-owned paths the kit must not overwrite, even with --force. */
export function isProtected(relativePath) {
    const rel = relativePath.split("\\").join("/");
    if (/\.(spec|plan|acceptance)\.md$/.test(rel)) return true;
    if (rel.startsWith(".agents/memory/")) return true;
    if (rel.startsWith(".axion/logs/")) return true;
    if (rel.startsWith(".axion/trace/") && !rel.endsWith("/README.md") && rel !== ".axion/trace/README.md") {
        return true;
    }
    return false;
}
