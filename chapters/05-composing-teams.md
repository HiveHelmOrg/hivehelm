# Chapter 5: Composing Teams

*Blueprint definitions, sequential and parallel modes, composable teams, conditional agents, and lifecycle management.*

---

## What You Have After Chapter 4

You have departments with clear boundaries, agents with well-defined personas, and a policy file that governs routing, permissions, constraints, and approvals. The system knows who exists, what they own, and what they're never allowed to do.

What it doesn't know yet is how to assemble itself into a working team for a specific task.

Here's the gap. You want to run your morning startup routine. That means spinning up five agents: the coordinator, the health tracker, the work ops agent, the project health agent, and the habit tracker. Each needs a different skill invoked. Some can run at the same time. Others need to wait. The whole thing should run in sequence unless you specify otherwise, and after they all finish, someone needs to synthesize the outputs into one coherent briefing.

If you build this by hand every morning, you'll spend ten minutes just setting up the agents before any work gets done. And you'll make subtle errors: wrong skill invoked, wrong agent, wrong order. The setup becomes a source of bugs.

Blueprints are the solution. Define the team once. Invoke it by name. The system assembles the team, assigns tasks, runs them, collects results, and shuts down. Every time, identically.

---

## Why Blueprints, Not Ad Hoc Teams

The question with ad hoc team assembly isn't whether it works. It does, for one-off tasks. The question is whether it scales to recurring workflows you run every day.

Think about what ad hoc assembly requires you to decide every time:

- Which agents do I need for this task?
- What skill does each agent run?
- Do they run in parallel or does one depend on another?
- What counts as a completed run? How do I know when they're done?
- Who synthesizes the outputs?

For a one-time deep analysis, thinking through those questions is part of the work. For your Monday morning standup or your weekly review, thinking through them every time is just overhead. Worse, it introduces variation. Monday's standup ran the project health agent after the coordinator. Wednesday's ran them in parallel. The outputs are structured differently. You spend time reconciling format, not reading content.

Blueprints remove the variation. They encode the decisions you'd make anyway (who, what, in what order) into a reusable definition. The decision-making happens once, when you write the blueprint. After that, execution is deterministic.

There's a secondary benefit that matters as your system grows. When you add a new agent to the morning standup, you add it to one blueprint. Every future run of that blueprint includes the new agent. You don't have to remember to add it each time. You don't have to update a separate script. The blueprint is the single source of truth for team composition.

---

## Anatomy of a Blueprint

A blueprint is a YAML file (or a JSON object in a registry file) with six key fields. None of them are optional in practice, though only a few are strictly required by the parser.

```yaml
blueprint: morning-standup
description: Full morning startup — briefing, health check, habits
parallel: true
pre_check: null

steps:
  - agent: coordinator
    skill: /brief
    order: 1
  - agent: health-tracker
    skill: /daily-checkin
    order: 1
  - agent: health-tracker
    skill: /habit-status
    order: 1

expected_output: Unified morning briefing with health and priorities
```

Walk through each field.

**`blueprint`** is the kebab-case identifier. This is what you use when you invoke the blueprint: "Run morning-standup." It should be specific enough to distinguish itself from similar blueprints. "standup" is too vague. "morning-standup" is clear. "monday-morning-extended-standup-with-project-health" is over-specified and annoying to type.

**`description`** is for humans. Write what it does and when to use it. If someone encounters this blueprint six months from now without context, the description should answer both questions. "Full morning startup" tells them nothing useful. "Full morning startup including work briefing, health check, and habit status. Run daily before starting deep work." tells them everything.

**`parallel`** controls execution mode. `true` means all agents launch simultaneously. `false` means sequential. `partial` means some agents run in parallel, then a synthesis step runs after all of them finish. More on this in the next section.

**`pre_check`** is a validation hook. Set it to `null` if there are no preconditions. Set it to a reference if the blueprint requires certain conditions before it's worth launching. A content sprint blueprint might check that there's at least one content idea marked "ready" before spawning a writer agent. Pre-checks prevent wasted cycles.

**`steps`** is the team definition. Each step has an agent (which persona to invoke), a skill (which skill that agent runs), and an order number. Order numbers control sequencing: in parallel mode, they're still useful for grouping (order 1 runs before order 2 in partial mode). In sequential mode, they define the pipeline.

**`expected_output`** is a brief description of what the human gets at the end. It sets expectations before the run and helps the synthesis step understand what it's building toward.

---

## Three Execution Modes

The parallel field gives you three modes. Each one fits a different category of work.

### Parallel: All at Once

All agents launch simultaneously. Each has its own task. They work independently. When all finish, the coordinator merges outputs.

```
Coordinator spawns all
        |
        v
[Agent A]  [Agent B]  [Agent C]     (all running simultaneously)
     |          |          |
     v          v          v
  Output A   Output B   Output C
        |
        v
  Coordinator merges → Final briefing
```

This is the right mode for tasks where the agents don't depend on each other's output. A morning briefing where the calendar agent, weather agent, and health agent all pull from different sources. A quality sweep where a linter, a security scanner, and a test runner all analyze the same codebase independently. A weekly review where the work division, personal division, and learning division all report on their domains.

The mental model is: "these are independent specialists who happen to be asked the same question at the same time."

Parallel mode is also the fastest mode. If your morning standup involves five agents and each takes 20 seconds, parallel mode finishes in 20 seconds (plus synthesis). Sequential mode finishes in 100 seconds.

### Sequential: Pipeline

Each agent waits for the previous one to finish. It receives the previous agent's output as context, does its work, and passes results forward.

```
Coordinator
     |
     v
   Agent A → Output A
                 |
                 v
             Agent B (reads Output A) → Output B
                                             |
                                             v
                                         Agent C (reads Output B) → Final
```

This is the right mode for production pipelines where each step depends on the previous one. A content sprint where the researcher gathers material, the writer drafts from that material, then the editor refines the draft. A deployment pipeline where tests must pass before staging, and staging must succeed before production. A data processing workflow where ingestion runs first, then transformation, then validation, then publication.

The mental model is: "these are stations on an assembly line, and the product gets built one station at a time."

Sequential mode is slower but gives you strong guarantees about data dependencies. When Agent B runs, it knows Agent A has finished. There's no race condition, no partial state, no chance of B making decisions before A has produced its output.

### Partial: Parallel Then Sequential

A batch of agents runs in parallel. When all of them finish, one or more sequential steps run against their combined output.

```
Coordinator
     |
     v
[Linter]  [Tester]  [Scanner]     (parallel: order 1)
    |          |         |
    v          v         v
 Issues A  Results B  Findings C
        |
        v
  Reviewer (sequential: order 2) → Human-readable report
```

This is the right mode for analysis-then-synthesis tasks. Run a parallel sweep to gather data independently, then run a sequential synthesizer to produce one coherent output from all three.

The code quality use case above is the canonical example: linting, testing, and security scanning are all independent analyses of the same codebase. Running them in parallel is faster and there's no reason for them to share state. But the output of all three is a pile of structured findings, not something a human wants to read. The review step takes those three piles and produces one narrative.

You get speed from the parallel phase and coherence from the sequential phase.

To use partial mode, set `parallel: "partial"` and use order numbers to distinguish the parallel phase (order 1) from the sequential phase (order 2):

```yaml
blueprint: code-quality-sweep
description: Parallel analysis across linting, testing, and security. Sequential synthesis at the end.
parallel: partial

steps:
  - agent: code-analyzer
    skill: /lint
    order: 1
  - agent: code-analyzer
    skill: /test
    order: 1
  - agent: security-scanner
    skill: /scan
    order: 1
  - agent: tech-lead
    skill: /review-findings
    order: 2

expected_output: Single code quality report with prioritized findings
```

---

## The Lifecycle: What Actually Happens When a Blueprint Runs

Understanding the lifecycle matters because it explains what to expect, what can fail, and where to look when something goes wrong.

**Step 1: Load and resolve.** The coordinator receives "run morning-standup" and looks up the blueprint by name in the registry. The registry is a simple JSON or YAML file that maps blueprint names to their definitions. If the blueprint composes from others (see next section), resolution expands all the composed blueprints into a flat list of steps.

**Step 2: Check conditions.** If the blueprint has conditions (like "only run on Mondays"), the coordinator checks them before proceeding. If conditions aren't met, the coordinator reports this to the human: "morning-standup-extended is configured for Mondays. Today is Thursday. Run anyway?" The human can override. The default is to respect the condition.

**Step 3: Run the pre-check.** If the blueprint has a pre-check, it runs now. Pre-checks can verify that required inputs exist, that the system is in the right state, or that a dependent resource is available. If the pre-check fails, the blueprint does not launch. The coordinator reports what failed.

**Step 4: Create the team.** The coordinator creates a named workspace for this run. The workspace is a shared task list with a unique run ID, the blueprint name, and a timestamp. Every agent spawned in this run knows which team it belongs to.

**Step 5: Create tasks.** One task per step in the blueprint. Each task has the agent name, the skill to invoke, the order, and a status field initialized to "pending."

**Step 6: Spawn agents.** For parallel mode: all agents receive their assignments simultaneously. For sequential mode: the coordinator sends the first task and waits. For partial mode: all order-1 agents receive their assignments simultaneously; order-2 agents wait.

**Step 7: Monitor.** The coordinator tracks the shared task list. As agents send messages, their tasks transition from "pending" to "in-progress" to "complete." In sequential mode, completion of one task triggers dispatch of the next. In parallel mode, the coordinator waits for all tasks to reach "complete" before moving to synthesis.

**Step 8: Collect results.** Agents send their outputs as messages or file writes. The coordinator collects them against their task IDs.

**Step 9: Synthesize.** The coordinator (or a designated synthesis agent in larger blueprints) merges outputs into one coherent response. It adds section headers, removes duplicates, and writes a concise summary at the top. This step is covered in detail below.

**Step 10: Shut down.** The coordinator sends shutdown requests to all agents. Each agent acknowledges and cleans up its working context. The team workspace closes. The run is complete.

This lifecycle is the same whether your blueprint has 3 agents or 13. The predictability is the point. When something goes wrong, you know exactly which step to inspect.

---

## Composable Blueprints: Extend, Don't Duplicate

This is where blueprints go from useful to powerful.

The problem with a flat registry of blueprints is drift. You build a "morning-standup" blueprint with 3 agents. You build a "monday-startup" blueprint that has the same 3 agents plus 4 more. When you add a new agent to the morning routine, you have to update both blueprints. You'll forget one. They'll diverge. You'll run monday-startup on a Monday and wonder why the new agent didn't appear.

Composable blueprints solve this the same way inheritance solves it in code: define the base once, extend it where needed.

```json
{
  "id": "monday-startup",
  "compose_from": ["morning-standup", "project-health"],
  "add_steps": [
    {"agent": "work-ops", "skill": "/weekly-update", "order": 1}
  ],
  "conditions": {
    "day_of_week": ["Monday"]
  },
  "parallel": true
}
```

The resolver does five things when it encounters a blueprint with `compose_from`:

1. Loads "morning-standup" and gets its 3 steps.
2. Loads "project-health" and gets its 3 steps.
3. Adds the 1 extra step from `add_steps`.
4. Deduplicates: if both blueprints include the same agent+skill combination, keep one copy.
5. Sorts by order and returns the merged blueprint with 7 steps.

When you update "morning-standup" (add a fourth agent, change a skill), every blueprint that composes from it gets the update automatically on the next run. No manual propagation. No risk of drift.

You can compose multiple levels deep, with one important rule: no circular references. Blueprint A can compose from B. B can compose from C. C cannot compose from A. The resolver detects cycles and raises an error before spawning anything.

Here's a fuller composition example showing how a weekly cadence might layer blueprints:

```yaml
# base: morning-standup (3 agents)
blueprint: morning-standup
parallel: true
steps:
  - agent: coordinator
    skill: /brief
    order: 1
  - agent: health-tracker
    skill: /daily-checkin
    order: 1
  - agent: work-ops
    skill: /task-priority
    order: 1

---

# extension: project-health (3 agents)
blueprint: project-health
parallel: true
steps:
  - agent: project-tracker
    skill: /status-check
    order: 1
  - agent: project-tracker
    skill: /blockers
    order: 1
  - agent: work-ops
    skill: /sprint-progress
    order: 1

---

# composed: monday-startup = morning-standup + project-health + 1 extra step
id: monday-startup
compose_from:
  - morning-standup
  - project-health
add_steps:
  - agent: work-ops
    skill: /weekly-update
    order: 1
conditions:
  day_of_week:
    - Monday
parallel: true
```

Monday-startup resolves to 7 steps (3 + 3 + 1) with one deduplication: both morning-standup and project-health include work-ops, so the resolver keeps one instance and merges its skills.

The practical result: you can maintain 5 base blueprints and compose 15 situational ones from them. When a base blueprint changes, all 15 situational blueprints pick up the change automatically.

---

## Conditions: When to Run (and When Not To)

Blueprints can carry conditions that encode your working rhythm into the system.

```json
{
  "conditions": {
    "day_of_week": ["Monday"],
    "date_range": {
      "after": "2026-03-01",
      "before": "2026-06-30"
    }
  }
}
```

The `day_of_week` condition scopes a blueprint to specific days. Monday blueprints launch the week with project health and a weekly priorities update. Friday blueprints run a lighter standup and a prep-for-next-week task. Sunday blueprints run the full weekly review. Wednesday blueprints run a midweek check-in without the Monday-specific updates.

The `date_range` condition handles seasonal or time-bounded work. A Q1 review blueprint that shouldn't run in Q4. A conference prep blueprint that activates starting three months before the event. A post-launch monitoring blueprint that runs intensively for the first 30 days after a release.

When conditions aren't met, the system doesn't silently skip. It tells the human:

```
Blueprint "monday-startup" is configured for Mondays.
Today is Thursday.
Run anyway? [y/N]
```

The default is no. The human can override. But the condition acts as a guardrail against accidentally running a heavy Monday workflow on a Wednesday because you forgot what day it was.

Conditions also compose. If "monday-startup" is composed from "morning-standup" (no conditions) and "project-health" (no conditions), the Monday condition lives only in monday-startup. The component blueprints can still be invoked independently on any day. The condition belongs to the composition, not to the parts.

---

## Pre-Checks: Validate Before You Launch

Pre-checks are precondition validators that run before any agent spawns. They answer the question: "Is this blueprint worth launching right now?"

Some blueprints have obvious preconditions:

- A content sprint needs at least one content idea marked "ready" in the idea bank. Without that, the writer agent has nothing to work with.
- A deployment blueprint needs all tests passing. Without that, deploying produces a broken build.
- A client reporting blueprint needs data fresher than 6 hours. Without that, the report will contain stale numbers.

Pre-checks are lightweight functions (or skill invocations) that check these conditions before the team assembles. They're cheap to run. An agent cycle is not.

```yaml
blueprint: content-sprint
pre_check:
  type: query
  target: idea-bank
  condition: status == "ready"
  min_results: 1
  fail_message: "No ideas are marked 'ready' in the idea bank. Mark at least one before running a content sprint."
```

When the pre-check fails, the coordinator reports the failure message and does not proceed. The human can override, but the default is to stop.

Pre-checks aren't just for data conditions. They can also check system state: is the external API reachable? Does the required context file exist? Is the previous phase of a project complete? Any boolean condition that determines whether the blueprint can succeed is a candidate for a pre-check.

---

## The Synthesis Step

The hardest part of a multi-agent run isn't spawning agents. It's merging what they produce.

Without synthesis, you get this:

```
=== Output from /brief ===
[wall of coordinator text]

=== Output from /daily-checkin ===
[wall of health data]

=== Output from /habit-status ===
[wall of habit data]
```

Five raw outputs, three different formats, two mentions of the same meeting, no summary. A human has to read all of it and build the picture themselves. That's the problem multi-agent systems are supposed to solve, not create.

With synthesis, you get:

```
## Morning Briefing — Feb 22

**Today's priority:** Finish the architecture document before the 3pm call.

**Health:** Sleep was good (7.2 hours). Recovery score 84. Hydration behind — drink 2 glasses before noon.

**Habits:** Meditation done. Exercise not yet. Reading streak at 14 days.

**Work:** 3 meetings today. One is low-value and cancellable (11am check-in). Data analysis review is the one that needs prep.
```

Same information. Structured. Deduplicated. Actionable.

The coordinator that launched the team owns synthesis by default. Its synthesis step does four things:

1. Waits for all agents to send their final outputs.
2. Groups outputs by section (health, work, habits, priorities).
3. Removes duplicates: if two agents both flagged the same meeting, keep one mention.
4. Writes a summary at the top: the two or three most important things from the whole run.

For larger blueprints (8+ agents), consider designating a dedicated synthesis agent instead of having the coordinator do it. The coordinator's job is orchestration. Synthesis at scale becomes a separate cognitive task. A synthesis agent reads all outputs and produces the merged document as its sole responsibility.

The synthesis agent's system prompt is simple: "You will receive outputs from multiple agents as your context. Merge them into one coherent document. Use section headers. Remove duplicate information. Write a three-sentence summary at the top. Do not add opinions or analysis not present in the source outputs."

---

## Common Blueprint Patterns

A reference of patterns that come up in most systems.

**Morning standup (3-5 agents, daily, parallel).** Aggregation of independent status checks. Each agent has a different domain. No dependencies between them. Synthesis at the end produces one briefing.

**Weekly review (4-8 agents, weekly, parallel then sequential).** Each division reports on its domain. The synthesis step produces a cross-domain summary with themes and carry-forward items. Use partial mode because the synthesis benefits from all division reports being complete before it starts.

**Content sprint (3-4 agents, on-demand, sequential).** Researcher gathers material. Writer drafts. Editor refines. Publisher formats and prepares for posting. Each step depends on the previous output. True pipeline, sequential mode.

**Quality gate (3-5 agents, on-demand, partial).** Multiple analyzers run in parallel (linting, testing, security, accessibility). A reviewer synthesizes findings into a prioritized list. Parallel phase for speed, sequential synthesis for coherence.

**Deep analysis (hierarchical, on-demand).** Division leads each spawn their own sub-agents. Each lead synthesizes their division's findings. A senior synthesizer collects division summaries and produces the final report. This is blueprint composition at the execution level: each division runs its own blueprint, and the parent blueprint coordinates the leads.

```yaml
# Hierarchical: each lead runs a sub-blueprint, parent collects their summaries
blueprint: quarterly-analysis
parallel: true
steps:
  - agent: work-division-lead
    skill: /division-analysis   # this skill internally runs a sub-blueprint
    order: 1
  - agent: personal-division-lead
    skill: /division-analysis
    order: 1
  - agent: learning-division-lead
    skill: /division-analysis
    order: 1
  - agent: senior-synthesizer
    skill: /cross-domain-synthesis
    order: 2
```

---

## A Note on Blueprint Maintenance

Blueprints accumulate. Three months in, you'll have a dozen. Six months in, you'll have two dozen, some of which haven't been run in weeks.

Keep a blueprint registry file that lists every blueprint, its last-run date, and whether it's active. Run a quarterly review: what blueprints are you using? Which ones have drifted from how you actually work? Which base blueprints need to be updated?

Also: name blueprints for what they produce, not for when you run them. "morning-standup" is good but "daily-briefing" is better, because it doesn't assume the time of day. "monday-startup" is fine for a time-gated blueprint. But "project-health-check" as a standalone blueprint is better than "things-i-check-on-mondays."

The registry file is also where you document intent. Why does this blueprint exist? What problem does it solve? When should a human choose it over a similar one? These questions seem obvious when you build the blueprint. Six months later, they aren't.

---

## Blueprints as Organizational Memory

Here's the frame that ties everything together.

Departments define who exists. Personas define how each agent thinks and what it owns. Policies define what's allowed, where things go, and when humans must intervene. Blueprints define what everyone does together, repeatedly, reliably.

A blueprint is organizational memory encoded as a file. It captures the decision about how a recurring workflow runs: which agents, which skills, what order, what conditions. That decision gets made once and applied every time. The system stops requiring you to reconstruct the team from scratch. It already knows.

And because blueprints compose, the organizational memory is layered. Your Monday startup knows about your morning routine because it extends it. When you improve the morning routine, Monday improves automatically. The knowledge propagates without you doing anything.

This is the difference between a collection of agents and an organization. A collection of agents requires a human to assemble them every time. An organization knows how to assemble itself.

---

Now you have teams running. The next question is: how do you know whether they're working well? Chapter 6 covers observability: event streams, distributed tracing, and the ability to see exactly what happened after the swarm finishes.

---

**Previous: [Chapter 4 — Policies as Code](04-policies-as-code.md)**

**Next: [Chapter 6 — Observability](06-observability.md)**
