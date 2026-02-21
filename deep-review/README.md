# deep-review

A standalone Claude Code plugin that runs a 13-agent hierarchical codebase analysis.

## What It Does

Four division heads — Engineering, Data, DevOps, and AI & Automation — each run their own sub-teams of specialists. They analyze your codebase independently, cross-discuss findings, and deliver a unified report with a prioritized action plan.

```
You (Chief of Staff — orchestrator)
├── eng-lead (Engineering Division)
│   ├── code-reviewer → architecture, quality, patterns
│   ├── security-auditor → OWASP, deps, secrets
│   └── test-analyst → coverage, quality, gaps
├── data-lead (Data Division)
│   ├── schema-analyst → data models, validation
│   ├── pipeline-analyst → data flow, ETL, quality gates
│   └── metrics-analyst → analytics, KPIs, observability
├── devops-lead (DevOps Division)
│   └── CI/CD, containers, deployment, infra, monitoring
└── ai-lead (AI & Automation Division)
    ├── prompt-analyst → LLM prompts, optimization
    ├── agent-analyst → agent patterns, orchestration
    └── automation-analyst → workflow opportunities
```

**Total: 4 division leads + 9 specialists = 13 agents**

## Status

Coming soon. This plugin is being extracted and generalized from a production system.

## How It Will Work

1. Install the plugin in your Claude Code project
2. Run `/deep-review <path-or-git-url>`
3. Get a comprehensive scorecard + prioritized action plan

## Output

- Scorecard with 7 dimensions rated 1-10 (RED/YELLOW/GREEN)
- Cross-division themes identified through inter-division discussion
- Prioritized action plan (P0-P3)
- Risk register
- Full markdown report saved to your project
