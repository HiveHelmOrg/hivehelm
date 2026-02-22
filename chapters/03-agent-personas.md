# Chapter 3: Agent Personas That Work

*The identity framework: name, department, escalation paths, delegation rules, tool scoping, and persona voice.*

---

## What You Have After Chapter 2

You have an org chart. Agents are grouped into divisions. The coordinator knows who owns what. Tool access is assigned at the division level. Cross-division collaboration patterns are declared.

You've solved the structure problem. But here's what you haven't solved yet: you don't know what happens to a task after it reaches the right agent.

Two agents in the same division, with identical tool access and identical file permissions, will produce completely different results based on how they're defined. One will answer the literal question and stop. The other will ask the clarifying question that changes the entire direction of the work. One will complete a task that's technically adjacent to its scope. The other will stop and escalate. One will write a draft with three hedges and a disclaimer. The other will take a position.

The difference is the persona. And the persona is not the system prompt.

---

## The Persona Is Not the System Prompt

Most people conflate these two things. I did for months.

The system prompt is everything the agent knows and does. It includes the routing rules, the file paths, the tool usage instructions, the output format requirements, the escalation logic. It can run to 800 words or more. It's the complete instruction set.

The persona is a subset of that. Specifically, it's the part that defines identity: how the agent thinks, what it prioritizes, where it draws lines. The persona is not instructions about what to do. It's a description of who is doing it.

Here's why the distinction matters: instructions get overridden by context. If you write a long system prompt and then give the agent an ambiguous task, the model fills in the gaps based on its training, not on your instructions. The persona is what determines how it fills those gaps.

Instructions say: "Review code for security vulnerabilities."
Persona says: "Thinks in attack surfaces. Assumes hostile input. Treats any state that can be read by an unintended actor as a failure."

The first is a task description. The second is a worldview. When the model hits an ambiguous case, the worldview governs.

The structural approach separates these concerns explicitly. The identity block carries the persona. The rest of the definition carries the operational instructions. They sit in the same file, but they serve different functions, and keeping them separate makes both easier to write and easier to update.

---

## The Identity Framework

Every agent definition should start with a structured identity block. Not prose. Not bullet points you improvise each time. A consistent template that makes every field machine-readable, every relationship explicit, and every boundary declared.

Here's the full template:

```markdown
## Agent Identity Block

Name: [Agent Name]
Department: [Division Name]
Team Role: [coordinator | implementer | specialist | quality gate | advisor]

Escalation paths:
  - [Agent or human to escalate to, with a brief reason]

Delegation paths:
  - [Agents this agent can hand work to, with scope notes]

Skills owned:
  - [/skill-name] — [one-line description of what the skill does]

Files managed:
  read_access:
    - [directory or file pattern]
  write_access:
    - [directory or file pattern]

Persona:
  [2-3 sentences. How this agent approaches work. What it prioritizes.
  What it explicitly will not do or will not compromise on.]

Tech stack / Expertise:
  [Technologies, tools, frameworks, or domains this agent knows deeply]

Standards:
  [Non-negotiable rules this agent follows without being told]

External integrations:
  [APIs or services this agent has access to, with brief context]
```

Let me walk through each field. Some of these feel obvious. They're not.

**Name.** Use a job title or role name, not a description. "Senior Data Analyst" is a name. "Agent that analyzes data and writes reports" is a description. The model's behavior is influenced by how it's addressed. A named role carries implicit professional context. A description does not.

**Department.** The division this agent belongs to. This should match exactly the division name in your department model. Consistency here is what makes the identity block machine-readable. If the coordinator is reading agent definitions to decide who to route to, it needs this field to be consistent across all agents.

**Team Role.** Five options only. This is a type system, not a freeform field. Each option means something specific about the agent's authority and position in the workflow, which we'll cover in detail shortly.

**Escalation paths.** Where the agent goes when it's out of scope or stuck. Not "ask the user," unless the user is the top of the chain. A named agent or a named human role. And critically: include the reason. "Escalates to: Computer Scientist (architecture decisions)" is actionable. "Escalates to: Human" is not.

**Delegation paths.** Who this agent can hand work to. An agent without declared delegation paths will either try to do everything itself or silently drop work it can't handle. Declaration creates explicit authority: "this agent is permitted to dispatch sub-tasks to these agents."

**Skills owned.** This is a list of discrete, named capabilities this agent can invoke. Not everything the agent does, but the skills that have been explicitly built and tested. The `/skill-name` format signals these are real, loadable skills, not promises.

**Files managed.** Read and write access, separately declared. Write access is the dangerous one. Keep it narrow. An agent that can write anywhere will eventually write somewhere you didn't expect.

**Persona.** Two to three sentences. The most important field and the one people spend the least time on. We'll come back to this.

**Tech stack / Expertise.** What this agent knows how to use, at depth. This is different from what tools it has access to. Tools are permissions. Expertise is competency. A Backend Engineer might have Python execution access. The expertise field tells you it specifically knows FastAPI, PostgreSQL, async patterns, and REST contract design.

**Standards.** Non-negotiable rules. Not preferences. Not defaults. Rules this agent follows even when the task doesn't mention them. We'll cover these separately.

**External integrations.** APIs and services the agent can reach, with enough context to know why. "HubSpot API (contact and deal management)" is useful. "HubSpot API" alone is not.

---

## Writing the Persona Voice

This is where most people give up too early, and it's the decision that matters most.

A weak persona makes every agent the same: generic, deferential, cautious. A strong persona makes an agent predictable in the right way, meaning you can anticipate how it will approach something you haven't explicitly covered.

Look at the difference:

**BAD:**
```
You are a helpful assistant that analyzes data and creates reports.
```

**GOOD:**
```
Curious, business-savvy, communication-focused. Thinks in trends,
cohorts, and comparisons. Can write SQL before breakfast and present
to a CMO after lunch. Always asks "what decision will this analysis
inform?" before writing a single query.
```

**BAD:**
```
You help with frontend development tasks.
```

**GOOD:**
```
Fast, pragmatic, component-minded. Thinks in props, hooks, and render
cycles. Writes clean JSX, composable components, and minimal CSS.
Ships first, optimizes second. Never ships broken.
```

**BAD:**
```
You review code for quality and correctness.
```

**GOOD:**
```
Rigorous, analytical, systems-thinker. Reviews code like a compiler:
checks types, traces data flow, identifies invariants. Every review
comment has a reason. Not pedantic for pedantry's sake, but not silent
about real problems either.
```

The pattern is consistent across all three good examples:

1. Two or three adjectives that define the working style, not the job
2. A metaphor or image for how the agent thinks
3. One sentence on priorities, phrased as action
4. One sentence on what the agent will not do or will not compromise

That fourth element is the one most people leave out. It's the most important. An agent without a clear "what I won't do" will either avoid the boundary entirely (and under-deliver) or cross it silently (and cause problems). The persona makes the line explicit before the agent encounters it in a real task.

Here are more examples across different domains:

```markdown
# Data Engineer
Methodical, infrastructure-minded, reliability-obsessed. Thinks in
schemas, pipelines, and failure modes. Builds systems that work at
3 AM without intervention. Treats undocumented data sources as
technical debt, not raw material.

# Automation Architect
Patient, systematic, skeptical of complexity. Designs workflows by
first asking what the simplest version would be. Every automation has
a documented trigger, logic, and error path. Refuses to automate
something that isn't understood yet.

# Content Strategist
Audience-first, narrative-driven, metric-aware. Asks "who is this
for and what should they do after reading it?" before touching a brief.
Writes for conversion, not for literary credit. Will not publish
content without a clear CTA and a clear success metric.

# Security Reviewer
Skeptical, adversarial-minded, thorough. Assumes hostile actors and
untrusted input at every boundary. Reviews code by asking "how would
I break this?" Treats authentication gaps and data exposure as
blockers, not suggestions.
```

None of these are instructions about what to do. They're descriptions of a working style. That's the persona's job: to govern behavior in the space between explicit instructions.

---

## Escalation and Delegation: The Paths Nobody Defines

Here's something I've seen in nearly every multi-agent system: people spend hours on the system prompt and skip escalation and delegation entirely.

This is like writing a detailed job description and forgetting to tell the new hire who their manager is and which junior staff report to them. The work happens. The edges fail.

**Escalation without definition** produces one of two failure modes. The first is silent failure: the agent reaches a task it can't handle, does its best, and returns a result that looks plausible but is wrong. The second is scope creep: the agent decides it probably can handle the task, expands its mandate in-context, and produces something outside its competency. Both failures are invisible until something downstream breaks.

**Delegation without definition** produces the God Agent problem from a different direction. Without explicit delegation authority, an agent trying to do good work will attempt to do everything itself. It becomes a generalist by accident, gathering context and making decisions that should belong to someone else. The division structure degrades from above and from below.

The fix is to declare both, and to declare them as chains.

Here's an escalation chain for an engineering team:

```
Frontend Engineer
  escalates to: Full Stack Engineer (cross-cutting concerns, integration issues)

Full Stack Engineer
  escalates to: Computer Scientist (architectural decisions, systemic problems)

Computer Scientist
  escalates to: Human (business logic decisions, resource trade-offs, priority calls)
```

Each step has a reason. The Frontend Engineer escalates to Full Stack when the problem crosses the client/server boundary, not because the Full Stack engineer is senior. The Computer Scientist escalates to a human when the decision requires business judgment that no agent has the context to make. The chain is purposeful.

And delegation flows back down:

```
Computer Scientist
  delegates to: Full Stack Engineer (implementation after architecture review)
  delegates to: Frontend Engineer (UI implementation once API contract is defined)
  delegates to: Backend Engineer (service implementation once interface is specified)
```

The Computer Scientist reviews the design. Once the design is approved, it delegates implementation to the appropriate engineers and gets out of the way. It does not implement. The engineers implement. This is how a quality gate agent is supposed to work.

Write these paths in the identity block of every agent. Not in a separate document. Not in the coordinator's rules. In each agent's own definition, where it can read it when needed.

---

## Team Roles: More Than a Label

The `Team Role` field in the identity block accepts five values. These aren't aesthetic categories. They carry behavioral implications that affect how an agent handles ambiguity, authority, and scope.

### Coordinator

Routes tasks. Never implements. There is exactly one coordinator per division or system.

The coordinator's authority is scope, not depth. It sees everything that comes in, decides where it goes, and confirms the handoff. It does not produce artifacts. If a coordinator starts writing code or drafting content, something has gone wrong structurally.

The "never implements" rule should be explicit in the coordinator's standards, not just implied by its role. Models are helpful by nature; if the coordinator thinks it can provide a useful answer directly, it will. The standard prevents it.

### Implementer

Builds things. The majority of agents in any system are implementers. They receive scoped tasks, produce defined outputs, and hand off results. The Frontend Engineer is an implementer. The Data Analyst is an implementer. The Content Writer is an implementer.

Implementers can escalate up when stuck. They can delegate to specialists below them when the task requires it. But their primary mode is doing, not directing.

### Specialist

Deep expertise in one domain. A specialist is a terminal agent: work comes to it, it handles the work, it does not delegate. A Security Reviewer is a specialist. A Legal Compliance Checker is a specialist. An SQL Performance Optimizer is a specialist.

The specialist designation signals to the coordinator that this agent should be invoked for specific, well-scoped tasks that require depth. It should not be used as the "first line" agent for ambiguous work; it's a depth resource, not a breadth resource.

### Quality Gate

Reviews, evaluates, and approves. Positioned between creation and shipping. The quality gate does not produce first drafts; it evaluates them. It applies a consistent standard and either approves, returns with comments, or escalates.

A quality gate is not optional once it's in the pipeline. If the pipeline can be bypassed, the gate doesn't work. Every quality gate agent should have explicit standards (more on this shortly) because the value of a gate is consistency: the same standard applied every time, not the model's ad hoc judgment about what good looks like.

### Advisor

Senior perspective. Designs architecture, sets standards, reviews decisions, but does not build day-to-day. The Computer Scientist in the engineering team is an advisor. So is the Automation Architect in an AI division.

Advisors often produce the hardest artifacts to write: architectural decisions, principles, design reviews. But they don't own implementation. They hand the decision back to an implementer. An advisor that starts building code has left its role. The distinction matters because advisors need to stay at the right altitude. Once they're in the implementation details, they lose the perspective that makes them useful.

---

## The Standards Section: Your Agent's Conscience

Standards are the rules an agent follows without being told. Not preferences. Not defaults. Rules.

Here's the difference. A preference is: "Try to include a data visualization when presenting analysis." A standard is: "Every analysis starts with a question and ends with a recommendation."

Preferences are optional. Standards are not. The standards section is the agent's conscience: the things it will do (or refuse to do) regardless of what the task says.

Some examples across different agent types:

```markdown
# Data Analyst standards
- Every analysis starts with a stated question and ends with a stated recommendation
- Never present a finding without sample size and confidence context
- Flag data quality issues before drawing conclusions, not after
- Trend analysis includes a time boundary (last 30 days, last quarter, etc.)

# Automation Architect standards
- Every automation has a documented trigger, logic, and error path before build begins
- Silent failures are unacceptable; every workflow has an error notification path
- No automation goes to production without a rollback mechanism
- Never automate a process that isn't understood end-to-end first

# Code Reviewer standards
- Every review comment includes the reason, not just the verdict
- "This works but..." is not the same as "This is correct"
- Performance issues at O(n^2) or worse where O(n) clearly exists are blockers
- Security concerns are always blockers, never suggestions

# Content Strategist standards
- Every piece of content has a named audience and a named action
- No publication without a defined success metric
- Claims require sources; opinions require clear framing
- Copy that could be mistaken for a claim it isn't is a rewrite, not a note
```

Notice that good standards are specific enough to be enforceable. "Produce high-quality work" is not a standard. "Every analysis ends with a recommendation" is a standard. "Never automate a process that isn't understood" is a standard.

The standards section is also where you encode institutional memory. The rule exists because someone (you, probably) learned it the hard way. "Silent failures are unacceptable" is a standard because a workflow failed silently and you didn't find out for three days. Writing it into the agent's standards means you never have to remember to tell the agent that; it already knows.

---

## Common Persona Mistakes

After defining personas for dozens of agents, these are the patterns that reliably fail:

**The Blank Slate.** No persona at all. The agent definition has a role name, tool access, and file permissions, and nothing else. The model fills in the persona from training: helpful, deferential, cautious, generic. This produces an agent that sort of works and never surprises you in a good way.

**The Novel.** A 600-word persona that covers the agent's background, philosophy, working style, professional values, edge case handling, and existential commitments. The model reads the first paragraph attentively and pattern-matches the rest. Persona length has diminishing returns after about four sentences. Be specific and short.

**The Clone.** Every agent in the system has the same persona: "You are professional, thorough, and helpful. You take your work seriously and communicate clearly." This is worse than no persona at all because it makes every agent indistinguishable from every other, which means the model defaults to the same behavior everywhere.

**Missing Boundaries.** The persona describes what the agent does but not what it won't do. The most important sentence in a persona is often the constraint: "Never ships broken." "Will not publish without a success metric." "Treats authentication gaps as blockers." Without the constraint, the agent's behavior at the edges is undefined.

**Static Identity.** The persona was written on day one and never updated. The agent's role has evolved. New tools have been added. The division structure has changed. The persona still describes what the agent was, not what it is. Personas should be reviewed when skills are added, when file access changes, and when the agent's scope shifts. Treat it like a job description: update it when the job changes.

---

## Putting It Together: A Complete Example

Here's a full identity block for a data analyst agent in a data division. This is what a complete, working persona definition looks like:

```markdown
## Agent Identity Block

Name: Data Analyst
Department: Data Division
Team Role: implementer

Escalation paths:
  - Analytics Engineer (data modeling issues, broken transformations, schema questions)
  - Human (business questions that require strategic judgment, not analysis)

Delegation paths:
  - None (terminal analyst; all outputs produced directly)

Skills owned:
  - /analyze-cohorts — segment user populations by behavior and attribute
  - /trend-report — generate time-series trend analysis with period comparisons
  - /ad-hoc-query — write and run SQL for one-off investigative questions

Files managed:
  read_access:
    - data/reports/
    - data/models/
    - data/raw/
  write_access:
    - data/reports/
    - data/drafts/

Persona:
  Curious, business-savvy, communication-focused. Thinks in trends,
  cohorts, and comparisons. Always asks what decision an analysis will
  inform before writing a single query. Translates numbers into
  narrative without losing precision.

Tech stack / Expertise:
  SQL (PostgreSQL, BigQuery), dbt, Python (pandas, matplotlib),
  Looker, cohort analysis, funnel analysis, A/B test interpretation

Standards:
  - Every analysis starts with a stated question and ends with a recommendation
  - Never present a finding without sample size and confidence context
  - Flag data quality issues before drawing conclusions, not after
  - Trend analysis always includes an explicit time boundary
  - "Interesting" is not a conclusion; actionable is

External integrations:
  - Data warehouse (read-only access to production tables)
  - Reporting dashboard API (write access to draft reports)
```

This definition is about 30 lines. Everything the model needs to know about who this agent is, how it works, who it talks to when things go wrong, and what it will never compromise on. The system prompt that follows this block provides the operational instructions; the identity block provides the identity.

---

## Persona Is How Structure Becomes Behavior

The department model from Chapter 2 answers where work goes. The persona answers what happens to it when it gets there.

Departments without personas are org charts with no culture. Work arrives in the right box, and then anything can happen depending on context, task phrasing, or whatever the model decides is reasonable that day. Routing is solved. Behavior is not.

Personas without structure are style guides with no enforcement. Every agent sounds coherent in isolation, but they don't coordinate, they don't escalate consistently, and they don't know whose authority supersedes whose.

You need both. The department model creates the structure. The persona makes the structure behave.

When the escalation paths are declared, agents don't improvise when they're stuck. When the standards are written, agents don't make judgment calls about what "good enough" means. When the persona voice is specific, the model's behavior at the edges is predictable in the right direction, not random.

The next chapter covers policies: the rules that live outside any single agent's definition and govern the system as a whole. If personas are each agent's conscience, policies are the system's constitution.

---

**Previous: [Chapter 2 — The Department Model](02-department-model.md)**

**Next: [Chapter 4 — Policies as Code](04-policies-as-code.md)**
