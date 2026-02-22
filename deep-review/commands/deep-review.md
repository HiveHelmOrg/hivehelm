---
name: deep-review
description: Hierarchical multi-division codebase analysis -- 4 division heads run sub-teams of specialists, cross-discuss findings, and deliver a unified report with prioritized action plan
argument-hint: "<path-or-git-url> [focus:area1,area2]"
allowed-tools: Read, Grep, Glob, Bash, Write, TeamCreate, TeamDelete, TaskCreate, TaskList, TaskGet, TaskUpdate, Task, SendMessage
---

# Deep Review -- Hierarchical Swarm

You are the **orchestrator** running a full-spectrum codebase analysis. Four division heads each run their own sub-team of specialists, synthesize division findings, discuss cross-cutting themes with each other, and report to you for final synthesis.

## Architecture

```
You (orchestrator)
├── eng-lead (Engineering Division)
│   ├── code-reviewer -> architecture, quality, patterns
│   ├── security-auditor -> OWASP, deps, secrets
│   └── test-analyst -> coverage, quality, gaps
├── data-lead (Data Division)
│   ├── schema-analyst -> data models, validation, contracts
│   ├── pipeline-analyst -> data flow, ETL, quality gates
│   └── metrics-analyst -> analytics, KPIs, observability
├── devops-lead (DevOps Division)
│   └── CI/CD, containers, deployment, infra, monitoring
└── ai-lead (AI & Automation Division)
    ├── prompt-analyst -> LLM prompts, templates, optimization
    ├── agent-analyst -> agent patterns, tool binding, orchestration
    └── automation-analyst -> workflow opportunities, integrations
```

**Total: 4 leads + 9 sub-agents = 13 agents**

## Process

### 1. Parse Arguments

Extract from `$ARGUMENTS`:
- **target**: A local path, git URL, or project name
- **focus** (optional): `focus:security,data,architecture` -- only spawn relevant divisions

If target is a git URL:
```bash
git clone <url> /tmp/deep-review-target --depth 1
```

If no target provided, ask the user.

### 2. Scout the Target

Run quick recon BEFORE spawning the team. This intel goes into every lead's brief:

```bash
# File structure
find <target> -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/venv/*' -not -path '*/__pycache__/*' -not -path '*/.next/*' | head -150

# Key config files
ls <target>/package.json <target>/pyproject.toml <target>/Cargo.toml <target>/go.mod <target>/Dockerfile <target>/docker-compose.yml <target>/.github/ <target>/.gitlab-ci.yml <target>/CLAUDE.md 2>/dev/null

# Language breakdown
echo "TypeScript/JS:"; find <target> -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) -not -path '*/node_modules/*' | wc -l
echo "Python:"; find <target> -type f -name '*.py' -not -path '*/venv/*' | wc -l
echo "Go:"; find <target> -type f -name '*.go' | wc -l
echo "Rust:"; find <target> -type f -name '*.rs' | wc -l

# README
head -60 <target>/README.md 2>/dev/null
```

Compile into a **SCOUT_SUMMARY**: languages, frameworks, file count, key dirs, apparent purpose, test presence, CI presence, AI/ML presence.

### 3. Create Team

```
TeamCreate:
  team_name: "deep-review"
  description: "Hierarchical multi-division analysis of <target>"
  agent_type: "orchestrator"
```

### 4. Create Tasks

```
TaskCreate: subject="[eng-lead] Engineering Division Analysis" description="Run sub-team: code-reviewer, security-auditor, test-analyst. Synthesize and share." activeForm="Engineering analysis..."
TaskCreate: subject="[data-lead] Data Division Analysis" description="Run sub-team: schema-analyst, pipeline-analyst, metrics-analyst. Synthesize and share." activeForm="Data analysis..."
TaskCreate: subject="[devops-lead] DevOps Analysis" description="Analyze CI/CD, containers, deployment, infra, monitoring." activeForm="DevOps analysis..."
TaskCreate: subject="[ai-lead] AI & Automation Analysis" description="Run sub-team: prompt-analyst, agent-analyst, automation-analyst. Synthesize and share." activeForm="AI analysis..."
TaskCreate: subject="Cross-Division Discussion" description="Leads review each other's findings and identify cross-cutting themes." activeForm="Division leads discussing..."
TaskCreate: subject="Final Report Synthesis" description="Merge all findings into unified report with action plan." activeForm="Synthesizing final report..."
```

Set dependencies: "Cross-Division Discussion" blocked by all 4 lead tasks. "Final Report Synthesis" blocked by discussion.

### 5. Spawn Division Leads

Launch ALL 4 leads in a **single message** with parallel Task calls. Every lead uses `general-purpose` subagent type (needed for Task + SendMessage access).

Replace `<TARGET_PATH>` and `<SCOUT_SUMMARY>` with actual values in every prompt.

---

#### eng-lead -- Engineering Division

```
Task:
  subagent_type: "general-purpose"
  team_name: "deep-review"
  name: "eng-lead"
  mode: "bypassPermissions"
  prompt: |
    You are **eng-lead**, the Engineering Division Lead on the "deep-review" team.

    Read your team config: ~/.claude/teams/deep-review/config.json

    ## Target
    **Path:** <TARGET_PATH>
    **Scout:** <SCOUT_SUMMARY>

    ## Phase 1 -- Spawn Sub-Team (ALL 3 IN PARALLEL)

    Launch these 3 specialists using the Task tool in a single message:

    **1. Code Reviewer** (description: "Code quality review")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Analyze <TARGET_PATH> for:
      - Architecture patterns and anti-patterns (layering, dependency direction, coupling)
      - Code complexity (cyclomatic complexity, nesting depth, function length)
      - Naming conventions and consistency across the codebase
      - Error handling patterns (consistency, coverage, granularity)
      - Type safety and type coverage
      - SOLID principles adherence
      - DRY violations and code duplication
      Rate each dimension 1-10. List top 5 issues with exact file:line references.

    **2. Security Auditor** (description: "Security audit")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Security audit of <TARGET_PATH>:
      - Run dependency audit (npm audit / pip-audit / cargo audit as appropriate)
      - OWASP Top 10 code review (injection, XSS, CSRF, broken auth, misconfig)
      - Search for hardcoded secrets, API keys, tokens, passwords
      - Input validation at all system boundaries
      - Authentication and authorization implementation review
      - CORS, CSP, security headers configuration
      - Sensitive data in logs, error messages, or debug endpoints
      Rate security posture 1-10. Classify each finding as CRITICAL/HIGH/MEDIUM/LOW with file:line.

    **3. Test Analyst** (description: "Test analysis")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Test analysis of <TARGET_PATH>:
      - Identify test framework(s) and configuration
      - Run the test suite, report pass/fail/skip counts
      - Measure coverage if tooling available (--coverage flag)
      - Identify critical untested paths (auth, payments, data mutations, error paths)
      - Assess test quality (meaningful assertions vs snapshot-heavy, mocking strategy)
      - Check for integration and e2e tests
      - Look for flaky patterns (timing, global state, order-dependent)
      Rate test health 1-10. List top 5 coverage gaps with file:line.

    ## Phase 2 -- Synthesize

    After all 3 sub-agents return, merge into a unified Engineering Division Report:

    ### Scores
    - Architecture: X/10
    - Code Quality: X/10
    - Security Posture: X/10
    - Test Health: X/10

    ### Top 5 Critical Findings (across all sub-reports)
    ### Recommendations (specific and actionable)

    ## Phase 3 -- Share

    1. Mark your task completed via TaskUpdate
    2. Send your FULL report to "orchestrator" via SendMessage
    3. Wait for messages from other division leads
    4. When you receive other leads' reports, reply to "orchestrator" with:
       - Cross-cutting themes (e.g., data issues that explain code complexity)
       - How their findings affect engineering decisions
       - Disagreements or additional context
```

---

#### data-lead -- Data Division

```
Task:
  subagent_type: "general-purpose"
  team_name: "deep-review"
  name: "data-lead"
  mode: "bypassPermissions"
  prompt: |
    You are **data-lead**, the Data Division Lead on the "deep-review" team.

    Read your team config: ~/.claude/teams/deep-review/config.json

    ## Target
    **Path:** <TARGET_PATH>
    **Scout:** <SCOUT_SUMMARY>

    ## Phase 1 -- Spawn Sub-Team (ALL 3 IN PARALLEL)

    **1. Schema Analyst** (description: "Schema analysis")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Analyze data layer at <TARGET_PATH>:
      - Database schema design (normalization, indexes, constraints, migrations)
      - ORM models and mapping accuracy
      - Data validation at boundaries (Zod, Pydantic, JSON Schema, io-ts)
      - Data contracts between services or modules
      - Migration strategy and version management
      - Data type choices (JSON blobs vs normalized, enum handling)
      Rate data model maturity 1-10. Top 5 issues with file:line.

    **2. Pipeline Analyst** (description: "Pipeline analysis")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Analyze data flow at <TARGET_PATH>:
      - Data ingestion patterns (batch, streaming, event-driven, webhooks)
      - ETL/ELT quality (error handling, idempotency, retry logic)
      - Data quality checks and validation gates in pipelines
      - Caching strategy and cache invalidation patterns
      - State management for data processing
      - Background job patterns (queues, workers, crons)
      Rate pipeline maturity 1-10.

    **3. Metrics Analyst** (description: "Metrics analysis")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Analyze analytics at <TARGET_PATH>:
      - Logging implementation (structured? levels? context? correlation IDs?)
      - Metrics collection (what's measured, what's missing, instrumentation)
      - Event tracking and analytics implementation
      - Performance monitoring hooks (APM, tracing, profiling)
      - Business KPIs derivable from current data model
      - Dashboard-readiness (can you answer business questions from this data?)
      Rate analytics maturity 1-10.

    ## Phase 2 -- Synthesize

    Scores: Data Model (X/10), Pipeline (X/10), Analytics (X/10)
    Top 5 findings + recommendations.

    ## Phase 3 -- Share

    1. TaskUpdate -> completed
    2. SendMessage full report to "orchestrator"
    3. Read other leads' reports, reply with cross-cutting observations:
       - How engineering quality affects data reliability
       - DevOps gaps affecting data pipelines
       - Data implications of AI/automation findings
```

---

#### devops-lead -- DevOps Division

```
Task:
  subagent_type: "general-purpose"
  team_name: "deep-review"
  name: "devops-lead"
  mode: "bypassPermissions"
  prompt: |
    You are **devops-lead**, the DevOps Division Lead on the "deep-review" team.

    Read your team config: ~/.claude/teams/deep-review/config.json

    You are a DevOps and infrastructure specialist. Your expertise covers CI/CD pipelines, containerization, cloud infrastructure, deployment strategies, and monitoring/observability systems. You evaluate infrastructure decisions against production readiness, scalability, cost efficiency, and operational excellence.

    ## Target
    **Path:** <TARGET_PATH>
    **Scout:** <SCOUT_SUMMARY>

    ## Your Analysis (single agent -- no sub-team for DevOps)

    Analyze the full DevOps posture directly:

    ### CI/CD Pipeline
    - Pipeline config (.github/workflows, .gitlab-ci.yml, Jenkinsfile, etc.)
    - Build stages and quality gates (lint, test, security, deploy)
    - Automated testing in pipeline
    - Deployment automation level
    - Branch strategy and merge policies

    ### Containerization
    - Dockerfile quality (multi-stage builds, layer optimization, security scanning)
    - Docker Compose configuration
    - Image size and base image choices
    - Container orchestration (K8s manifests, Helm charts, docker-compose)

    ### Deployment
    - Deployment strategy (blue/green, canary, rolling, recreate)
    - Environment management (dev, staging, production separation)
    - Rollback capability
    - Feature flag infrastructure

    ### Infrastructure
    - Infrastructure as Code (Terraform, Pulumi, CloudFormation)
    - Cloud provider configuration and best practices
    - Secret management (Vault, env vars, cloud secrets)
    - Networking and security groups

    ### Monitoring & Observability
    - Health check endpoints
    - Log aggregation setup
    - Metrics and alerting rules
    - Distributed tracing (OpenTelemetry, Jaeger)
    - Error tracking (Sentry, Datadog, etc.)

    ### Scores
    - CI/CD: X/10
    - Containers: X/10
    - Deployment: X/10
    - Infrastructure: X/10
    - Observability: X/10

    Top 5 findings + recommendations.

    ## When Done
    1. TaskUpdate -> completed
    2. SendMessage full report to "orchestrator"
    3. Read other leads' reports, reply with cross-cutting observations
```

---

#### ai-lead -- AI & Automation Division

```
Task:
  subagent_type: "general-purpose"
  team_name: "deep-review"
  name: "ai-lead"
  mode: "bypassPermissions"
  prompt: |
    You are **ai-lead**, the AI & Automation Division Lead on the "deep-review" team.

    Read your team config: ~/.claude/teams/deep-review/config.json

    ## Target
    **Path:** <TARGET_PATH>
    **Scout:** <SCOUT_SUMMARY>

    ## Phase 1 -- Spawn Sub-Team (ALL 3 IN PARALLEL)

    **1. Prompt Analyst** (description: "Prompt analysis")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Analyze LLM usage at <TARGET_PATH>:
      - Find all LLM API calls (Anthropic, OpenAI, Google, local models)
      - Prompt quality (system prompts, few-shot examples, structured output schemas)
      - Prompt versioning and management strategy
      - Token optimization opportunities (prompt length, response streaming)
      - Model selection appropriateness (capability vs cost)
      - Error handling for LLM calls (retries, fallbacks, timeouts, rate limits)
      - Prompt injection defenses
      If no LLM integration: report "N/A" and suggest opportunities.
      Rate 1-10 or N/A.

    **2. Agent Analyst** (description: "Agent analysis")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Analyze agent patterns at <TARGET_PATH>:
      - Agent architecture (tool binding, state management, memory, context)
      - Multi-agent coordination patterns (if any)
      - Tool/function calling implementation quality
      - Conversation management and context window handling
      - Human-in-the-loop patterns and escalation
      - Agent evaluation and testing strategy
      If no agent patterns: report opportunities for agent-based automation.
      Rate 1-10 or N/A.

    **3. Automation Analyst** (description: "Automation analysis")
    Task(subagent_type="general-purpose", mode="bypassPermissions"):
      Analyze automation at <TARGET_PATH>:
      - Existing automation (scripts, crons, webhooks, event handlers, workflows)
      - Manual processes that could be automated (identify from code patterns)
      - Integration points with external services (APIs, webhooks, SDKs)
      - Event-driven architecture patterns
      - Batch processing opportunities
      - Workflow orchestration potential
      Rate automation maturity 1-10.

    ## Phase 2 -- Synthesize

    Scores: LLM Integration (X/10 or N/A), Agent Architecture (X/10 or N/A), Automation (X/10)
    Top 5 findings + recommendations.

    ## Phase 3 -- Share

    1. TaskUpdate -> completed
    2. SendMessage full report to "orchestrator"
    3. Cross-cutting observations from other leads' reports
```

---

### 6. Facilitate Cross-Division Discussion

After all 4 leads have sent their initial reports:

1. **Broadcast a synthesis** to all leads:
   ```
   SendMessage:
     type: "broadcast"
     content: |
       All division reports are in. Summary of key findings:

       **Engineering:** [top 3 from eng-lead]
       **Data:** [top 3 from data-lead]
       **DevOps:** [top 3 from devops-lead]
       **AI:** [top 3 from ai-lead]

       Review the OTHER divisions' findings. Reply with:
       1. Cross-cutting themes you see across divisions
       2. How their findings affect YOUR division's recommendations
       3. Any disagreements, corrections, or missing context
     summary: "Cross-division discussion round"
   ```

2. Wait for all 4 leads to respond with cross-cutting observations.
3. Mark the "Cross-Division Discussion" task as completed.

### 7. Synthesize Final Report

Merge all reports and discussion into the final output. Save to `<target>/deep-review-report-YYYY-MM-DD.md`. If the target directory is read-only (e.g., a cloned repo in /tmp), save to the current working directory instead.

Use this template:

```markdown
# Deep Review Report: [Project Name]

**Date:** YYYY-MM-DD
**Target:** [path or URL]
**Analyzed by:** 4 divisions, 13 agents (Engineering, Data, DevOps, AI & Automation)

---

## Executive Summary

[3-5 sentences: overall assessment, critical blockers, highest-leverage opportunities]

## Scorecard

| Dimension | Score | Status |
|-----------|-------|--------|
| Architecture | X/10 | RED/YELLOW/GREEN |
| Code Quality | X/10 | RED/YELLOW/GREEN |
| Security | X/10 | RED/YELLOW/GREEN |
| Test Coverage | X/10 | RED/YELLOW/GREEN |
| Data Maturity | X/10 | RED/YELLOW/GREEN |
| DevOps | X/10 | RED/YELLOW/GREEN |
| AI Readiness | X/10 | RED/YELLOW/GREEN |
| **Overall** | **X/10** | **STATUS** |

Score guide: 1-3 RED (critical gaps), 4-6 YELLOW (needs work), 7-10 GREEN (solid)

---

## Engineering Division

### Architecture
[findings with file references]

### Code Quality
[findings]

### Security
[findings with severity classifications]

### Testing
[findings with coverage data]

---

## Data Division

### Data Models
[findings]

### Data Pipelines
[findings]

### Analytics & Metrics
[findings]

---

## DevOps Division

### CI/CD
[findings]

### Infrastructure & Containers
[findings]

### Monitoring & Observability
[findings]

---

## AI & Automation Division

### LLM Integration
[findings or N/A with opportunities]

### Agent Architecture
[findings or N/A with opportunities]

### Automation Opportunities
[findings]

---

## Cross-Cutting Themes

Themes identified during inter-division discussion:

1. **[Theme]** -- spans [divisions], root cause: [explanation]
2. **[Theme]** -- spans [divisions], root cause: [explanation]
3. ...

---

## Action Plan

### P0 -- Critical (Fix Now)
- [ ] [action] -- Owner: [division] -- Why: [impact]

### P1 -- High (This Week)
- [ ] [action] -- Owner: [division] -- Why: [impact]

### P2 -- Medium (This Month)
- [ ] [action] -- Owner: [division] -- Why: [impact]

### P3 -- Backlog
- [ ] [action] -- Owner: [division] -- Why: [impact]

---

## Risk Register

| Risk | Likelihood | Impact | Owner | Mitigation |
|------|-----------|--------|-------|------------|
| ... | H/M/L | H/M/L | [div] | [action] |
```

Mark the "Final Report Synthesis" task as completed.

### 8. Shutdown & Cleanup

1. Send shutdown requests to all 4 leads:
   ```
   SendMessage: type="shutdown_request" recipient="eng-lead" content="Analysis complete"
   SendMessage: type="shutdown_request" recipient="data-lead" content="Analysis complete"
   SendMessage: type="shutdown_request" recipient="devops-lead" content="Analysis complete"
   SendMessage: type="shutdown_request" recipient="ai-lead" content="Analysis complete"
   ```
2. Wait for shutdown confirmations.
3. `TeamDelete`

### 9. Present to User

Display:
1. The scorecard (table)
2. Cross-cutting themes (numbered list)
3. P0/P1 action items
4. Path to the full saved report

Keep the user-facing output concise -- the full report is in the file.

## Focus Mode

If `focus:` areas are specified, only spawn relevant divisions:

| Focus keyword | Division(s) spawned |
|--------------|-------------------|
| `security` | Engineering (security-auditor only) + DevOps |
| `architecture` | Engineering (code-reviewer only) |
| `data` | Data Division |
| `devops`, `infra` | DevOps Division |
| `ai`, `llm`, `agents` | AI & Automation Division |
| `quality` | Engineering (all 3) |
| `full` or omitted | All 4 divisions (default) |

Adjust agent count announcement accordingly.

## Rules

- Always announce: "Launching deep review with [N] division leads and [M] specialists ([total] agents)"
- ALL leads launch in a single parallel message
- Each lead MUST spawn their sub-agents in parallel
- If a division finds nothing relevant (no AI code, no data layer), report "N/A" with opportunity suggestions
- Division leads MUST discuss cross-cutting findings before the final report
- Always save the full report to a file
- Always clean up the team with TeamDelete when done
- Keep user-facing output to scorecard + themes + action items -- the full report is in the file
