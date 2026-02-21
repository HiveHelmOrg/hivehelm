# Hooks Collection

Copy-paste hook recipes for Claude Code with explanations.

## What Are Hooks?

Hooks are shell scripts that Claude Code executes in response to lifecycle events — before or after tool calls, at session start, on notifications, when teammates go idle, or when tasks complete.

They're the enforcement layer. Instead of trusting agents to follow rules, hooks intercept actions and validate them mechanically.

## Recipes

*Coming soon — 10+ documented patterns including:*

| Hook | Event | What It Does |
|------|-------|-------------|
| File validation | PostToolUse (Write/Edit) | Validates file writes against format rules and declared scopes |
| Session dashboard | SessionStart | Displays system health, active tasks, and alerts on startup |
| Smart notifications | Notification | Routes notifications by event type and severity |
| RAG file tracking | PostToolUse (Write/Edit) | Tracks modified files for vector index re-ingestion |
| Teammate monitor | TeammateIdle | Checks idle teammates for progress and alerts on stalls |
| Task lifecycle | TaskCompleted | Fires downstream actions when tasks complete |
| Capture validator | PostToolUse (Write/Edit) | Enforces knowledge capture format (date, tags, structure) |
| Git auto-sync | Stop | Syncs work to git when a session ends |
| Blueprint trigger | PostToolUse (Skill) | Triggers reactive blueprints based on skill completion events |
| Cost guard | PreToolUse | Warns before expensive operations (large model calls, batch spawns) |

## How to Use

Each recipe includes:
1. The hook configuration (JSON for `settings.json`)
2. The shell script with comments
3. When and why to use it
4. Known edge cases and how to handle them
