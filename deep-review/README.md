# deep-review

A Claude Code plugin that runs a 13-agent hierarchical codebase analysis. Four division heads -- Engineering, Data, DevOps, and AI & Automation -- each run sub-teams of specialists, cross-discuss findings, and deliver a unified report with a prioritized action plan.

## Architecture

```
orchestrator
├── eng-lead (Engineering Division)
│   ├── code-reviewer -> architecture, quality, patterns
│   ├── security-auditor -> OWASP, deps, secrets
│   └── test-analyst -> coverage, quality, gaps
├── data-lead (Data Division)
│   ├── schema-analyst -> data models, validation
│   ├── pipeline-analyst -> data flow, ETL, quality gates
│   └── metrics-analyst -> analytics, KPIs, observability
├── devops-lead (DevOps Division)
│   └── CI/CD, containers, deployment, infra, monitoring
└── ai-lead (AI & Automation Division)
    ├── prompt-analyst -> LLM prompts, optimization
    ├── agent-analyst -> agent patterns, orchestration
    └── automation-analyst -> workflow opportunities
```

**Total: 4 division leads + 9 specialists = 13 agents**

## Installation

### From a local clone

```bash
git clone https://github.com/HiveHelmOrg/hivehelm.git
claude plugin add /path/to/hivehelm/deep-review
```

### From the HiveHelm monorepo

If you already have the monorepo cloned:

```bash
claude plugin add /path/to/hivehelm/deep-review
```

## Usage

### Full analysis (all 4 divisions)

```
/deep-review /path/to/your/project
```

### Analyze a remote repository

```
/deep-review https://github.com/user/repo
```

### Focus mode (specific divisions only)

```
/deep-review /path/to/project focus:security
/deep-review /path/to/project focus:data,devops
/deep-review /path/to/project focus:ai,architecture
```

Available focus keywords:

| Keyword | Divisions spawned |
|---------|-------------------|
| `security` | Engineering (security-auditor only) + DevOps |
| `architecture` | Engineering (code-reviewer only) |
| `data` | Data Division |
| `devops`, `infra` | DevOps Division |
| `ai`, `llm`, `agents` | AI & Automation Division |
| `quality` | Engineering (all 3 sub-agents) |
| `full` (default) | All 4 divisions |

## How It Works

The analysis runs in three phases:

1. **Parallel Analysis** -- All division leads launch simultaneously. Each lead (except DevOps) spawns their own sub-team of specialists in parallel. This means up to 13 agents analyzing your codebase at once.

2. **Cross-Division Discussion** -- After all leads complete their analysis, they review each other's findings and identify cross-cutting themes. For example, the data lead might explain how schema issues cause the code complexity the engineering lead flagged.

3. **Synthesis** -- The orchestrator merges all reports and discussion into a unified report with a scorecard, cross-cutting themes, prioritized action plan, and risk register.

## Output

The plugin saves a full markdown report to your project directory:

```
<target>/deep-review-report-YYYY-MM-DD.md
```

If the target directory is read-only, the report is saved to the current working directory.

### Report contents

- **Scorecard** -- 7 dimensions rated 1-10, color-coded RED/YELLOW/GREEN
- **Division findings** -- Detailed analysis from each division with file:line references
- **Cross-cutting themes** -- Patterns that span multiple divisions
- **Action plan** -- Prioritized P0-P3 with owners and impact
- **Risk register** -- Likelihood, impact, owner, and mitigation for each risk

## Requirements

- Claude Code with team support (TeamCreate, Task, SendMessage tools)
- The target codebase must be accessible from the local filesystem or clonable via git

## Part of HiveHelm

This plugin is part of the [HiveHelm](https://github.com/HiveHelmOrg/hivehelm) collection -- open-source multi-agent patterns for Claude Code.

## License

MIT
