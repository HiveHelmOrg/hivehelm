# Chapter 4: Policies as Code

*Routing rules, per-agent write scopes, content constraints, approval gates, and skill routing, all in one declarative file.*

---

## What You Have After Chapter 3

You have a department structure and a set of agent personas. Every agent knows who it is, what it owns, who it escalates to, and what it will never compromise on. The system has structure and it has identity.

What it doesn't have yet is a governance layer.

Here's what that means in practice. Your content writer agent knows not to publish without approval, because you wrote it into its persona. Your data analyst knows to route financial reports to the finance folder, because you told it to in the system prompt. Your coordinator knows not to send health-related captures to the work division, because you built that logic into the routing instructions.

Three agents. Three places where the same rule lives. And when the rule changes, you need to find and update all three.

That's the problem this chapter solves.

---

## The Routing Triplication Problem

Rules that live inside agent definitions are invisible in aggregate. You can read one agent and know exactly what it does. You cannot read across all agents and know the system's rules without opening every file.

This creates four compounding problems.

**First: silent drift.** You update the routing rule in the coordinator because you added a new folder structure. You don't update the content writer, because you forgot it also had that logic. Now two agents have different ideas about where things go. Neither of them knows the other exists. The conflict is invisible until the wrong thing lands in the wrong place.

**Second: no auditability.** Someone asks "what are all the rules governing what our agents can write to?" You don't have an answer. You have to open every agent definition and grep for write-related instructions. You'll miss some. You'll misremember others. An audit in this state is a guess.

**Third: no testability.** You can't write a test for rules you can't enumerate. If the rules live in prose inside a dozen system prompts, there's no programmatic way to check whether a rule is being followed, whether two rules conflict, or whether a new agent is missing coverage.

**Fourth: conflict without resolution.** Agent A says route X to folder Y. Agent B says route X to folder Z. Both agents were written by the same person, six months apart. There's no priority system because there's no central registry. When both agents encounter the same input, you get inconsistent behavior that traces back to nothing obvious.

The solution is to pull all of those rules out of agent definitions and into one place. A single file. Machine-readable, queryable, and readable by any agent or hook in the system.

---

## What a Policy Looks Like

The format is JSONL: one JSON object per line, one rule per object. Each rule is self-contained. It has an identifier, a type, a human-readable description, a condition that triggers it, an action it takes, a priority, and an active flag.

Here's the schema:

```json
{
  "id": "unique-rule-id",
  "type": "routing | constraint | permission | approval | enrichment | skill_routing | lifecycle | slo",
  "description": "Human-readable explanation of what this rule does and why it exists",
  "condition": { "...": "trigger criteria" },
  "action": { "...": "what happens when the condition matches" },
  "priority": 0,
  "active": true
}
```

Each field earns its place.

The `id` is a unique string you control. Use something readable: `route-health`, `scope-content-writer`, `no-internal-tool-names`. You'll be referencing these in changelogs and audit queries.

The `type` is constrained to eight options. Not freeform. The type tells enforcement logic how to interpret the rule and which priority tier it belongs to.

The `description` is for humans, including future you. Write it like a code comment: what does this rule do, and why does it exist? "Never mention internal tool names in client-facing outputs, because clients do not need to know our stack."

The `condition` is the trigger. Keywords in the content, the agent name, the action being taken, the domain being written to. Conditions can be as simple as a keyword list or as specific as an agent-plus-action combination.

The `action` is what happens when the condition fires: route to a folder, block the operation, require approval, inject context, or invoke a skill.

The `priority` is numeric. Higher number means evaluated first. This is the conflict resolution mechanism; we'll come back to it.

The `active` flag is the kill switch. Set it to false to disable a rule without deleting it. The rule stays in the file, stays in the changelog, and can be reactivated with one character change.

---

## Four Policies in Practice

Here are four rules that represent the most common patterns. These are generalized, but they map directly to real rules in a working system.

**A routing policy.** Where does captured content go?

```json
{
  "id": "route-health",
  "type": "routing",
  "description": "Route health captures to personal/health/. Matches on fitness, sleep, recovery, and exercise terminology.",
  "condition": {
    "keywords_match": ["health", "fitness", "sleep", "exercise", "recovery"]
  },
  "action": {
    "route_to": "personal/health/"
  },
  "priority": 10,
  "active": true
}
```

**A permission policy.** What can an agent write to?

```json
{
  "id": "scope-content-writer",
  "type": "permission",
  "description": "Content Writer's write scope is limited to content/ and drafts/. Prevents the agent from writing to other domains.",
  "condition": {
    "agent": "content-writer"
  },
  "action": {
    "write_scopes": ["content/", "drafts/"]
  },
  "priority": 100,
  "active": true
}
```

**A constraint policy.** What must never appear in output?

```json
{
  "id": "no-internal-tool-names",
  "type": "constraint",
  "description": "Never mention internal tool names in client-facing outputs. Clients do not need to know the internal stack.",
  "condition": {
    "domain": "client",
    "content_pattern": "\\binternal-tool-name\\b"
  },
  "action": {
    "block": true,
    "message": "Policy violation: Do not mention internal tool names in client-facing content. Use generic terms instead."
  },
  "priority": 200,
  "active": true
}
```

**An approval policy.** What actions require human sign-off?

```json
{
  "id": "approve-publish",
  "type": "approval",
  "description": "Any publish action by the content writer requires human approval before execution.",
  "condition": {
    "agent": "content-writer",
    "action": "publish"
  },
  "action": {
    "require_approval": true,
    "approver": "human"
  },
  "priority": 100,
  "active": true
}
```

These four rules replace what would otherwise be four separate instructions buried in four separate agent definitions. They're in one place. They're readable by anything that can parse JSON. They're auditable with a single `grep`.

---

## The Seven Policy Types

The type field is a vocabulary, not a label. Each type has a natural priority tier, a purpose, and implications for how enforcement works.

### 1. Routing (priority 0-20)

Routing policies answer: where does this content go?

These are keyword-match rules that route incoming work to the right folder or domain. The coordinator reads these when deciding where to dispatch a capture or task. Individual agents read them when deciding where to write output.

Every routing policy set needs a fallback: a rule with priority 0 that catches anything not matched by a more specific rule and routes it to the inbox. Without a fallback, unmatched content either gets dropped or triggers an error. With a fallback, unmatched content lands somewhere visible and gets triaged during the next review.

```json
{
  "id": "route-fallback",
  "type": "routing",
  "description": "Default routing for captures that don't match any specific domain. Routes to inbox for manual triage.",
  "condition": {
    "match_all": true
  },
  "action": {
    "route_to": "inbox/"
  },
  "priority": 0,
  "active": true
}
```

### 2. Permission (priority 100)

Permission policies answer: what can this agent write to?

Read access can be broad. Agents often need to read across domains to build context, find references, and understand the full picture. But write access must be narrow. An agent should write only to the folders it owns.

The key insight here is that read-broad, write-narrow is a deliberate asymmetry. It lets agents be intelligent without letting them be destructive. An agent that reads across the system can find the right context. An agent that writes across the system will eventually overwrite something it shouldn't have touched.

Permission rules should cover every agent in the system. An agent without a permission rule has undefined write scope, which means it will write wherever it decides makes sense. That's the definition of unpredictable behavior.

### 3. Constraint (priority 200)

Constraint policies answer: what must never appear in output, regardless of instructions?

These are the safety rails. The highest priority type in the system, because they're unconditional. A constraint fires no matter what the agent was asked to do, no matter how urgent the task, no matter what other rules say.

Common constraint patterns:

- Terminology blocks: never mention internal tool names, never use certain language in specific contexts, never include personally identifiable information in logs.
- Sensitivity filters: content involving active negotiations, competitive intelligence, or pending decisions that aren't public.
- Scope constraints: no agent in the data division writes to the finance folder, ever.

Constraints should be specific. "Don't say anything inappropriate" is not a constraint; it's a hope. "Block any output that matches the pattern `\\binternal-tool-name\\b` in client-domain content" is a constraint.

### 4. Approval (priority 100)

Approval policies answer: what actions require a human in the loop before execution?

The principle is simple: irreversible or externally-visible actions need a checkpoint. Publishing content, sending emails, deploying code, deleting files, pushing commits, modifying agent definitions. These are actions where "undo" is expensive or impossible.

The approval rule doesn't block the action permanently. It pauses execution and surfaces the pending action for review. The human approves or rejects. If approved, execution continues. If rejected, the agent logs the decision and stops.

This is the governance mechanism that makes it safe to give agents broad capabilities. You can give a content agent the ability to publish because the approval rule means it can never publish without your sign-off. The capability exists; the execution requires you.

### 5. Skill Routing (priority 10-20)

Skill routing policies answer: when a certain kind of task comes in, which agent handles it and which skill do they invoke?

This is the coordinator's lookup table. Instead of the coordinator having to memorize every agent's capabilities, it reads the skill routing rules and dispatches accordingly.

```json
{
  "id": "skill-route-dashboard",
  "type": "skill_routing",
  "description": "Route dashboard-related tasks to the data analyst using the /build-dashboard skill.",
  "condition": {
    "keywords_match": ["dashboard", "report", "visualization", "chart", "metrics"]
  },
  "action": {
    "route_to_agent": "data-analyst",
    "invoke_skill": "/build-dashboard"
  },
  "priority": 15,
  "active": true
}
```

The benefit is decoupling. When you add a new skill to the data analyst, you add one skill routing rule. The coordinator doesn't need to be updated. It reads the rule at runtime. The system's capability map is current without any agent-level changes.

### 6. Enrichment (priority 50)

Enrichment policies answer: what context should be automatically injected when certain topics appear?

When the incoming task mentions a specific project, enrichment rules can trigger automatic loading of the project's reference documentation, current status, or relevant constraints. The agent doesn't have to ask for context it predictably needs; the enrichment rule provides it.

```json
{
  "id": "enrich-project-alpha",
  "type": "enrichment",
  "description": "When Project Alpha is mentioned, inject the project brief and current status into context.",
  "condition": {
    "keywords_match": ["project alpha", "alpha project"]
  },
  "action": {
    "inject_context": ["projects/alpha/brief.md", "projects/alpha/status.md"]
  },
  "priority": 50,
  "active": true
}
```

This is the "smart context loading" pattern. It reduces the prompt engineering burden on individual agents because the enrichment layer handles predictable context needs automatically.

### 7. Lifecycle and SLO (priority 150-200)

Lifecycle and SLO policies answer: what conditions must be true before certain actions can proceed, and what quality thresholds must data meet?

Lifecycle rules govern project progression. "Phase 2 cannot start until Phase 1 metrics have hit these thresholds." These are phase gates: explicit conditions that must be satisfied before the system advances.

SLO rules govern data quality. "Any analysis using data more than 6 hours stale must flag the staleness before presenting conclusions." These are quality guards that run alongside the analytical work.

Both types sit at high priority because they're preconditions, not suggestions. An SLO violation doesn't just affect one analysis; it affects the reliability of everything downstream. Catching it at the policy layer means it gets caught consistently, not only when an agent happens to check.

---

## Priority and Conflict Resolution

The priority field exists because conflicts are inevitable, and unresolved conflicts produce unpredictable behavior.

The evaluation order is simple: higher number wins. Constraints at 200 evaluate before permissions at 100. Permissions evaluate before routing at 10. If two rules of the same type conflict, the higher priority wins.

The natural tier structure looks like this:

| Priority | Type |
|----------|------|
| 200 | Constraint, Lifecycle |
| 150 | SLO |
| 100 | Permission, Approval |
| 50 | Enrichment |
| 10-20 | Routing, Skill Routing |
| 0 | Fallback routing |

This ordering reflects the logical dependency. You want to know whether something is blocked (constraint) before you figure out who can do it (permission) before you figure out where it goes (routing). The priority numbers encode that logic explicitly.

Within a tier, you can use priority numbers to break ties. If two routing rules both match the same input, the one with the higher priority number wins. Document the reason for the higher priority in the description field; future you will want to know why one rule outranks another.

The `active` flag adds a dimension the priority system doesn't cover: the ability to disable a rule without removing it. When you deactivate a rule, it stays in the file, stays in the git history, and can be reactivated with a one-character change. This is important during testing: you can turn a rule off, see what changes, and turn it back on without any destructive edits.

---

## One File, Not Thirty

The architectural choice that makes policies as code work is centralization. All policies live in one file. Not distributed across agent definitions. Not embedded in skill prompts. Not split into one file per agent. One file.

This sounds obvious. It isn't. The temptation is to put routing rules close to the coordinator and permission rules close to each agent. That feels organized locally. It's chaos globally.

The single-file approach has four operational benefits.

**Audit is a grep command.** Want to know how many permission rules exist? `grep '"type": "permission"' policies.jsonl | wc -l`. Want to see every rule that touches the finance folder? `grep 'finance' policies.jsonl`. Want to find all active constraint rules? `grep '"type": "constraint"' policies.jsonl | grep '"active": true'`. You can answer governance questions in seconds, not hours.

**Updates propagate automatically.** Change a routing rule once. Every agent or hook that reads the policy file at runtime gets the updated rule on their next read. You don't track down which agents knew about the old rule. You don't risk missing one. The rule lives in one place; you update it in one place.

**Validation is scriptable.** Write a script that checks: do all policies have unique IDs? Does every agent in the system have at least one permission rule? Are there any routing rules that conflict at the same priority with the same keyword? These are questions you can answer programmatically if the policies are structured. You can't answer them at all if they're prose in system prompts.

**Deactivation is safe.** Set `"active": false`. The rule is gone from the perspective of enforcement logic. It's still in the file, still in git history, still available for review. When you reactivate it, you reactivate it with full context about what it was and why it existed.

---

## Enforcement: Policies Don't Enforce Themselves

Writing the policy file is half the work. The harder half is making sure the policies actually govern behavior. A policy file that agents ignore is documentation, not governance.

There are three enforcement patterns, and the strongest systems use all three.

**Hook-based enforcement.** A PreToolUse hook reads the policy file, checks the current agent and the action it's about to take against permission and constraint rules, and blocks the action if it violates policy. The agent never sees this. It attempts to write to a forbidden folder and the hook silently prevents it. This is mechanical enforcement: the agent doesn't need to know the rules because the infrastructure prevents violations regardless.

Here's the rough logic:

```python
def pre_tool_use(agent_name, tool, target_path):
    policies = load_policies("policies.jsonl")

    # Check write permission
    permission_rules = [p for p in policies if p["type"] == "permission" and p["active"]]
    for rule in sorted(permission_rules, key=lambda r: -r["priority"]):
        if rule["condition"].get("agent") == agent_name:
            allowed_scopes = rule["action"].get("write_scopes", [])
            if not any(target_path.startswith(scope) for scope in allowed_scopes):
                raise PolicyViolation(f"Agent {agent_name} cannot write to {target_path}")

    # Check constraints
    constraint_rules = [p for p in policies if p["type"] == "constraint" and p["active"]]
    for rule in sorted(constraint_rules, key=lambda r: -r["priority"]):
        if matches_condition(tool.content, rule["condition"]):
            raise PolicyViolation(rule["action"]["message"])
```

**Prompt-based enforcement.** The agent's system prompt includes an explicit instruction: "Before routing any content or dispatching any task, read `policies.jsonl` for routing and skill-routing rules. Follow them." This is voluntary enforcement: the agent follows rules because it was told to, not because the infrastructure compels it. It works well for routing and enrichment, where the agent needs to understand context, not just be blocked. It's less reliable for constraints, because an agent under pressure may skip the file read.

**Validation-based enforcement.** A PostToolUse hook checks whether a completed action violates any constraint rules. If it does, it logs the violation, alerts the human operator, and if the action is reversible, reverts it. This is after-the-fact enforcement: it catches what the other two layers miss.

Prompt tells the agent what to do. Hook prevents the agent from doing the wrong thing. Validation catches what gets through anyway. All three layers together make the system robust. Any one layer alone is brittle.

---

## Testing Your Policy Set

Before a policy file is live, run it through a basic validation check. This doesn't require a testing framework; a short script works.

Four questions to answer:

**Are all IDs unique?** Two rules with the same ID will cause unpredictable behavior depending on which one the parser encounters first. A uniqueness check takes five lines of code.

**Does every agent have a permission rule?** An agent without a permission rule has undefined write scope. Query the policy file for every `permission`-type rule, extract the agent names, and compare against your agent roster. Any agent not covered by a permission rule is a gap.

**Do any routing rules conflict at the same priority?** Two routing rules with identical priority and overlapping keyword conditions will produce non-deterministic routing. Check for conflicts before they become live incidents.

**Would this policy set have caught last week's issues?** The best validation is retrospective. Take the last five actions your system took and run them against the policy file. Does the policy set produce the right routing decision? Does it block what should be blocked? If the policy file can't explain the correct behavior for recent real cases, it's not complete yet.

---

## When Policies Change

They will change. New agents join the system. Scopes evolve. New constraints emerge from real incidents. A topic that was safe to discuss in external outputs becomes sensitive. A routing rule that made sense for three agents breaks down with six.

A few practices that keep the policy file maintainable over time:

Keep a changelog section at the top of the file, or a companion `policy-changelog.md`. Every rule addition should have a reason and a date. "Added `no-internal-tool-names` because a draft report sent to a client mentioned the tool by name. 2026-01-15." That single sentence saves an hour of investigation six months later.

Deactivate before deleting. If a rule no longer makes sense, set `active: false` before removing it from the file. Give it a review cycle. If nothing breaks, remove it. If something breaks, you know exactly what to reactivate.

Review the policy file during periodic system reviews. Not just when something goes wrong. A scheduled review once per quarter catches rules that have become redundant, rules that should exist but don't, and priority assignments that no longer reflect how the system is actually used.

Test policy changes against recent history before applying them to the live system. If you're adding a new constraint, run it against the last 30 actions the affected agents took. Does it block anything it shouldn't? Does it miss anything it should catch? A five-minute retrospective test beats a live incident every time.

---

## Policies as the System's Constitution

Personas from Chapter 3 govern individual agent behavior. Policies govern system behavior. These are different things.

A persona tells an agent how to think and what it will never compromise. A policy tells the system what can never happen, where things go, who is allowed to do what, and when humans must intervene. The persona is the agent's conscience. The policy file is the system's constitution.

Together, they make the system auditable in a way that no collection of agent definitions ever can be. You can read the policy file and know, from one document, every routing rule, every write scope, every constraint, every approval gate, and every skill routing decision. You can update that document and the change propagates everywhere. You can validate that document programmatically and catch gaps before they become incidents.

The alternative is what most multi-agent systems look like six months in: the same rule in twelve places, slightly different each time, with no way to tell which version is correct.

---

With departments, personas, and policies in place, the next question is how to assemble agents into teams for specific tasks. Chapter 5 covers composable blueprints: the team definitions that turn your org chart into an execution plan.

---

**Previous: [Chapter 3 — Agent Personas That Work](03-agent-personas.md)**

**Next: [Chapter 5 — Composing Teams](05-composing-teams.md)**
