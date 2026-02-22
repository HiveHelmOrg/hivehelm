# Chapter 2: The Department Model

*How to divide your agents into divisions with clear ownership, without creating silos that make cross-domain work impossible.*

---

## The Org Chart You Don't Think You Need

Nobody starts a company by drawing an org chart. In the early days, you hire people who are good and figure out roles as you go. The work gets done. Everyone knows what everyone else is doing because there are four people and you share a Slack channel.

Then you hire a fifth person, and suddenly two people think they own the same thing. Then a seventh, and handoffs start breaking down. Then a twelfth, and you realize nobody knows who to ask when something falls between two roles. The org chart (which felt bureaucratic when it was just you and three colleagues) turns out to be the thing that would have prevented most of these problems.

Multi-agent systems follow exactly the same arc.

With two or three agents, you don't need structure. The routing is obvious, the permissions are manageable, and the coordinator can hold the whole system in one system prompt. But at five agents, you start to feel the friction. At ten, tasks are getting misrouted or dropped. At fifteen or more, you either have structure or you have chaos; there's no third option.

The department model is the org chart for your agent system. It answers the same questions an org chart answers: who owns what, who reports to whom, where work goes when it touches multiple teams. Get it right and the rest of the system (routing, permissions, orchestration, observability) all become dramatically easier to reason about.

Get it wrong and you'll spend most of your time managing the structure instead of doing work with it.

---

## The Four Division Types

Not all departments organize the same way. In human organizations, you have functional teams (finance owns all financial decisions), domain teams (product line teams that own everything for their segment), and matrix structures that try to be both. Agents work similarly. There are four ways to slice a division, and each one is the right answer in different contexts.

### Domain Divisions

A domain division assigns each agent ownership of a subject area. The Research agent owns research. The Finance agent owns financial data. The Health agent owns health tracking. The boundary between agents is topical, not functional.

This is the right structure when your work genuinely divides into distinct life or business domains that don't often overlap. Each agent becomes a specialist with deep context about its area. Over time, you load each agent's definition with domain-specific knowledge, files it owns, and conventions specific to its domain. The agent accumulates context that a generalist can't.

```
Domain Division - Life Operations Example
-----------------------------------------
Chief of Staff       ← coordinator, never implements
Work Ops             ← owns: career, professional domain
Finance Controller   ← owns: budget, expenses, investments
Health & Wellness    ← owns: fitness, nutrition, sleep
Learning Director    ← owns: reading, courses, skill development
Relationship Mgr     ← owns: contacts, follow-ups, outreach
```

The coordinator at the top of a domain division doesn't own a domain. It routes. It's the only agent in this structure without subject-matter ownership, which is precisely what makes it useful; we'll come back to this.

Domain divisions are well-suited for personal productivity systems, life management, and any context where the work is naturally categorized by topic rather than by what you do with that topic.

### Skill Divisions

A skill division organizes agents by what they can do, not what they own. A Frontend Engineer and a Backend Engineer both work on the same product, but they have fundamentally different skill sets and are responsible for different layers. The organizing principle is competency.

```
Skill Division - Engineering Team Example
------------------------------------------
Computer Scientist     ← quality gate, architecture review
Full Stack Engineer    ← integration, cross-cutting concerns
Frontend Engineer      ← UI, components, client-side logic
Backend Engineer       ← APIs, services, server-side logic
Design Engineer        ← component design, style systems
```

In a skill division, work arrives from outside the division as a task, and the division coordinator (or the team lead agent) decides which agent's skill set matches the task. The same project might touch multiple agents within the division; a feature request goes to the Frontend Engineer for the UI work and the Backend Engineer for the API work, with the Full Stack Engineer handling the integration point.

Skill divisions are well-suited for technical teams where the nature of the work requires different types of expertise rather than different subject matter knowledge. If you're building a coding-heavy agent system, your engineering agents almost certainly belong in a skill division rather than a domain division.

### Pipeline Divisions

A pipeline division organizes agents along the lifecycle of a particular kind of work. Each agent owns a stage. Work enters the pipeline at one end and moves through the agents in sequence, each one producing an output that the next one needs.

```
Pipeline Division - Data Team Example
---------------------------------------
Data Engineer        ← ingestion, storage, plumbing
Analytics Engineer   ← modeling, transformation, dbt
Data Analyst         ← querying, pattern finding, reporting
Data Scientist       ← experimentation, statistical modeling
ML Engineer          ← deployment, serving, monitoring
```

The beauty of a pipeline division is that each agent has an extremely clear mandate: take this thing, transform it into that thing, hand it off. The Data Engineer doesn't do analysis. The Data Analyst doesn't build ingestion pipelines. Because the lifecycle is linear and the ownership is stage-based, you can validate handoffs; the output of one agent is the input contract for the next.

Pipeline divisions are well-suited for data workflows, content production pipelines (research → draft → review → publish), and any other context where work has a clear progression with defined intermediate states.

### Capability Divisions

A capability division organizes agents around a particular technology or discipline that cuts across the rest of the system. AI and automation is the canonical example. You might have an agent that writes prompts, an agent that orchestrates other agents, an agent that evaluates model outputs, and an agent that handles infrastructure. These are all "AI work," but they require different expertise.

```
Capability Division - AI & Automation Example
-----------------------------------------------
Prompt Engineer        ← writes, tests, and refines prompts
Agent Builder          ← designs and implements agent systems
Automation Architect   ← workflow design, integration patterns
LLM Evaluator          ← tests, benchmarks, quality assessment
AI Platform Engineer   ← deployment, infrastructure, monitoring
```

A capability division often serves the rest of the system. The Prompt Engineer writes prompts used by agents in other divisions. The Agent Builder designs agents that live in other divisions. This is different from a domain or pipeline division, where the work is mostly self-contained. Capability divisions export their work; other divisions consume it.

Choose a capability division when you have a horizontal concern, something that shows up everywhere in your system, that requires enough specialization to justify dedicated agents.

---

## The Coordinator Pattern

Every department needs one agent that does nothing but coordinate. Not mostly coordinate. Not coordinate when it's not busy. Nothing but coordinate.

This is the coordinator pattern, and it's the single most important structural decision you'll make.

Here's why: without a designated coordinator, every agent in the system has to reason about routing. The research agent gets a task, decides it's actually a content task, and tries to forward it. The content agent gets a finance question and attempts to answer anyway because it has no clean way to redirect it. Every agent becomes a partial coordinator, which means coordination logic is distributed, inconsistent, and invisible.

With a designated coordinator, routing logic lives in exactly one place. Every task enters the system through the coordinator. The coordinator reads the task, matches it to the right agent or division, and dispatches. If the coordinator's routing logic is wrong, you fix it in one place. If you add a new agent, you update the coordinator's routing rules. The rest of the agents never need to know who else is on the team.

```markdown
## Coordinator Agent Definition (excerpt)

Name: Chief of Staff
Role: Coordinator and dispatcher. Routes all incoming tasks to the
      appropriate division or specialist agent. Does not implement tasks.

Routing Rules:
- Technical work (code, architecture, debugging) → Engineering Division
- Data work (analysis, models, pipelines) → Data Division
- Financial queries → Finance Controller
- Content production → Content & Growth agent
- Ambiguous tasks → ask for clarification before routing

Escalation: None (this is the top of the routing hierarchy)
Delegation: All specialist agents in all divisions

Hard constraints:
- NEVER implement a task directly
- NEVER write code, produce content, or run analysis
- Always route, then confirm with the user before proceeding
```

Notice the hard constraint at the bottom: the coordinator never implements. This is not a preference; it's a structural requirement. The moment a coordinator starts implementing tasks, it accumulates scope and becomes a God Agent. Other agents start routing tasks to it because "the coordinator can handle it." The coordinator's system prompt grows to include implementation logic. You've lost the clean separation between routing and doing.

Two coordinators is equally bad. If you have a Chief of Staff routing tasks and a Team Lead for each division also routing tasks at their level, you now have two places where routing logic lives. When a task hits the Chief of Staff and gets routed to the Engineering division, who decides which Engineering agent handles it? If the division coordinator decides, great, but then the Chief of Staff needed to know to route it to the division coordinator, not to a specific engineer. If the Chief of Staff decides, the division structure is cosmetic. You have a split-brain problem: two agents both think they're responsible for routing decisions.

The solution is to decide upfront whether you have a flat system (one coordinator routes to all agents) or a hierarchical system (one coordinator routes to division heads, who route within their divisions). Either works. Mixing them is where problems start.

---

## Tool Assignment by Division

One of the cleanest decisions you can make early in a multi-agent system is this: tools and integrations belong to divisions, not to individual agents.

This is the minimum necessary access principle applied at the structural level. Instead of asking "which agents need database access?", you ask "which division handles data work?" and grant the integration to the division. Agents inside that division inherit access. Agents outside it don't have it, and don't need it.

```yaml
# Tool assignment - division level

Engineering Division:
  tools:
    - bash_execution
    - code_interpreter
    - git_access
    - ci_cd_triggers
  file_access:
    - src/
    - tests/
    - config/

Data Division:
  tools:
    - database_read
    - database_write
    - python_execution
    - warehouse_access
  file_access:
    - data/
    - models/
    - reports/

Content Division:
  tools:
    - web_search
    - document_editor
    - cms_api
  file_access:
    - content/
    - drafts/
    - published/
```

Compare this to the alternative: each agent defines its own tool list. You end up with a research agent that has web search and file access and Python execution "just in case." The content agent has file access and the CMS API and also Python because someone thought it might need to do some light data work once. Permissions sprawl agent by agent, with no coherent logic about who should have what.

Division-level tool assignment creates a visible, auditable map of capability. When you look at the config above, you know immediately: if an agent needs database access, it belongs in the Data Division. If an agent has database access but isn't in the Data Division, something is wrong. The structure enforces itself.

It also makes permission audits trivial. Instead of reviewing forty agent definitions to find which agents have access to what, you review five division definitions. The access model is comprehensible at a glance.

---

## Cross-Division Collaboration

Giving agents clear domain ownership risks creating silos. Work that falls at the boundary between two divisions (a data analyst finding a trend that the content team should write about, a security concern from the DevOps division that needs an engineering fix) has nowhere to go if the divisions are sealed compartments.

The solution is explicit collaboration patterns. Not implicit "agents can talk to each other if needed," but declared relationships that tell every agent in the system when to initiate cross-division contact and what that handoff looks like.

```markdown
## Cross-Division Collaboration Map

Data → Content
  Trigger: Data Analyst finds a trend or insight worth publishing
  Handoff: Analyst produces a structured brief (topic, key stats, angle)
  Receives: Content agent

Engineering → Data
  Trigger: Schema change or new data source added
  Handoff: Engineer produces migration notes, affected tables, new fields
  Receives: Data Engineer for pipeline updates, Analytics Engineer for model updates

Data → Engineering
  Trigger: ML model ready for production deployment
  Handoff: ML Engineer produces model artifact, serving requirements, latency targets
  Receives: Backend Engineer for API, AI Platform Engineer for infrastructure

AI & Automation → All Divisions
  Trigger: New agent or automation capability requested by any division
  Handoff: Requester produces a brief (problem, current state, desired outcome)
  Receives: Agent Builder for design, Automation Architect for integration
```

Each collaboration pattern specifies the trigger condition, who initiates, what gets handed off, and who receives it. This removes the ambiguity that causes agents to either avoid cross-division work ("that's not my domain") or duplicate it ("I'll just handle it myself since I have context").

When you build 17 collaboration patterns, the instinct is to put them all in each agent's definition. Don't. Put them in a single cross-division collaboration file that every agent can reference. If a collaboration pattern changes, you update it once. Every agent that reads the file gets the updated version. This is the knowledge triplication trap in reverse: instead of letting one fact spread across many files, you keep one file that all agents consult.

---

## Orchestration Modes

Having departments isn't enough; you also need to know how to assemble them for a given task. There are four modes. Each is the right choice in different situations.

**Flat swarm.** All agents work in parallel, report to the coordinator, and their outputs are synthesized at the end. This maximizes speed. Use it when tasks are independent: a research task, a financial analysis, a content draft, and a code review can all happen at once without any agent needing the others' output first.

**Hierarchical swarm.** The coordinator routes to division heads. Each division head runs its own sub-team. Outputs bubble up to the coordinator for synthesis. Use this when tasks are complex enough that a division's internal coordination matters: an engineering task might need the Full Stack Engineer to coordinate between Frontend and Backend before returning a result to the top-level coordinator.

**Sequential pipeline.** Output from one agent is input to the next. Use this when work has true dependencies: you can't draft content before you have research, you can't deploy a model before it's been evaluated. Pipelines are slower but correct for dependent work.

**Single delegate.** The coordinator routes to one specific agent and waits for the result. Use this for focused, well-scoped tasks that clearly belong to one agent. Don't over-engineer a task that just needs a single specialist.

```
Flat Swarm:           Hierarchical Swarm:     Sequential:
Coordinator           Coordinator             Agent A
├── Agent A           ├── Div Head A          │
├── Agent B           │   ├── Agent A1        Agent B
├── Agent C           │   └── Agent A2        │
└── Agent D           └── Div Head B          Agent C
                          ├── Agent B1        │
                          └── Agent B2        Agent D

Single Delegate:
Coordinator
└── Agent A (only)
```

Most systems use all four modes depending on what's being done. The coordinator's routing rules should specify which mode to use for which types of tasks, not leave it to ad hoc judgment at runtime. When the mode is declared rather than decided in the moment, you can reason about it, audit it, and change it deliberately.

---

## Start Small, Grow Divisions

Thirty agents organized into five divisions sounds like a lot. It is a lot. You don't build that on day one, and you shouldn't try.

Start with three to five agents: one coordinator, and two to four domain specialists. This is enough to validate the coordinator pattern, experience the routing logic working (and breaking), and build a mental model of how divisions should feel before you commit to a taxonomy.

```
Phase 1 - Minimal viable structure (day one):
Chief of Staff         ← coordinator
Research Agent         ← domain: information gathering
Content Agent          ← domain: writing and publishing
Technical Agent        ← domain: code and tools

Phase 2 - Pressure shows (weeks 4-8):
Add: Finance Agent     ← domain split from Chief of Staff overload
Add: Review Agent      ← quality gate that was being skipped

Phase 3 - Division formation (months 3-6):
Technical work is complex enough to split into Engineering Division
Add: Frontend, Backend, Full Stack - Technical Agent becomes division head

Phase 4 - New capability (as needed):
Data work is distinct enough from Technical to need a Data Division
Add: Data Engineer, Analyst - separate from Engineering
```

The signals that tell you it's time to add a division:

- **One agent is handling more than 40% of all tasks.** Either its scope is too broad or you're missing a specialist.
- **Tasks regularly fall between two agents.** The boundary between them isn't clear enough or doesn't exist yet.
- **You've added more than three agents to a domain and they're still stepping on each other.** A sub-division with its own coordinator will resolve the internal routing problem.
- **A new type of work shows up with meaningfully different tooling requirements.** If the new work needs tools none of your existing agents have, it probably belongs in a new division.
- **You're spending more than a few minutes deciding which agent to route a task to.** Routing should be fast and obvious. If it isn't, the structure is wrong.

Don't add divisions preemptively. An empty division with one agent is just overhead with a fancy label. Build the division when the work demands it.

---

## What the Agent Definition Needs

Every agent in the system should carry a consistent identity block. This isn't just documentation; it's the data that makes routing, permission enforcement, and cross-division collaboration machine-readable. When the coordinator reads an agent's definition to decide if it's the right choice for a task, it should find the same fields in the same places across every agent.

```markdown
## Agent Identity Template

Name: [Agent Name]
Department: [Division Name]
Role: [One-sentence role description]

Escalation paths:
  - [Agent or human to escalate to if task is out of scope or stuck]

Delegation paths:
  - [Agents this agent can delegate sub-tasks to, if any]

Skills owned:
  - [Skill 1] - [brief description]
  - [Skill 2] - [brief description]

Files managed:
  read_access:
    - [directory or file pattern]
  write_access:
    - [directory or file pattern]

Persona:
  [2-3 sentences on how this agent approaches its work, what it prioritizes,
  what it explicitly does not do. Written in second person ("You are...")]

External integrations:
  - [API or service this agent has access to]
```

The escalation and delegation paths are particularly important and often skipped. Escalation tells an agent what to do when it's stuck or out of scope: not "try harder," but "route up." Delegation tells it what agents it's authorized to hand work to. Without these declared, agents either silently fail or freelance outside their mandate.

---

## The Structure Isn't the System

It's tempting to think that once you have the department model right, the hard work is done. You've drawn the org chart. Everyone has a box.

But an org chart without clear role expectations is just boxes and lines. The real work of organizational design, in human teams and in agent systems, is making the structure legible to everyone operating inside it.

For agents, that means giving each one a persona: a way of working, a set of priorities, a defined approach to ambiguity. Two agents can have the same department, the same tools, the same file access, and still produce completely different results depending on how they're instructed to approach their work.

The department model tells you who's responsible. Personas tell you how responsibility gets discharged. Without both, the structure gives you clarity about where work goes, but not about what happens to it when it gets there.

---

**Previous: [Chapter 1: The Problem: Agent Chaos](01-agent-chaos.md)**

**Next: [Chapter 3: Agent Personas That Work](03-agent-personas.md)**

Departments give you structure. Chapter 3 shows how to give the agents inside them identities that make the structure actually work: what a persona is, why it's not just a system prompt, and how to write one that holds up under ambiguous tasks.
