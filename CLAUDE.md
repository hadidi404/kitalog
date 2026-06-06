# KitaLog — Claude Code Guidelines

## Comments
- Write no comments by default.
- Only add a comment when the **why** is genuinely non-obvious: a hidden constraint, a subtle workaround, or behavior that would surprise a reader.
- Never add section-label comments (`<!-- Header -->`, `<!-- Left column -->`, `// Top customers`, etc.).
- Never add comments that describe what the code does — well-named variables and functions already do that.
- Never add color or layout hints as comments (`<!-- blue -->`, `<!-- flex-1 so bottom aligns -->`).

## Git
- Never use `git add .` or `git add -A`. Always stage files explicitly by name.
- The `.claude/` folder must never be committed.

## Code style
- Vue 3 Composition API with `<script setup>`.
- Tailwind CSS utility classes — no custom CSS unless Tailwind cannot handle it.
- Keep computed properties and functions named clearly so comments are unnecessary.
