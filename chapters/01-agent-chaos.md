# Chapter 1: The Problem — Agent Chaos

---

## The Moment You Realize Something Is Wrong

You don't realize your multi-agent system is broken until it breaks in front of you.

For me it happened on a Tuesday morning. I had a content agent, a research agent, and a coordinator that was supposed to route tasks between them. I ran a workflow to draft a post based on some notes I'd gathered. The coordinator sent the task to the research agent. The research agent gathered more information and wrote a draft. The content agent — which had been given Bash access "just in case" — read the same notes folder, decided there was a task in there, and started drafting its own version. The coordinator, not knowing the content agent had self-initiated, sent the original task downstream again.

I ended up with three drafts, two of which referenced files the other agents had already modified. One draft was based on stale data. The whole run took eleven minutes and produced nothing usable.

The kicker: every individual agent worked exactly as designed. The research agent researched. The content agent wrote. The coordinator coordinated. The system — the arrangement of agents, their permissions, their routing logic — was completely broken.

This is agent chaos. And if you're running more than two or three agents, you either have it right now or you're about to.

---

## The Single-Agent Illusion

Here's why it catches everyone off guard: single agents are deceptively good.

You point one agent at a task, give it context, and it delivers. You refine its system prompt a few times and it feels almost like a colleague. It reads the right files, writes to the right places, and escalates when it's stuck. The feedback loop is tight. If something breaks, you know exactly why — there's only one agent. You fix the prompt, try again.

This creates a mental model that doesn't transfer to multi-agent systems.

With a single agent, the "organizational design" is trivial: one agent, one job, you're the manager. With multiple agents, you suddenly have a coordination problem. Who owns what? Who has authority over which files? What happens when two agents both think a task belongs to them? What happens when neither does?

These are not AI problems. They're organizational problems. They're the same problems a fast-growing startup hits when it adds its fifth employee and realizes "everyone just does what needs to be done" doesn't work anymore.

The difference is that in startups, chaos becomes visible slowly — through missed handoffs, duplicated work, confused priorities. In multi-agent systems, it becomes visible all at once, in a single run, when three drafts appear in a folder that should have one.

I've seen people respond to this by making their single coordinator smarter. More elaborate system prompts. Longer routing instructions. Nested if-then logic baked into the agent definition. This works until it doesn't, and when it stops working, you have one very complicated agent that's hard to debug instead of a well-organized team of simpler ones.

The better response is to treat multi-agent system design the same way you'd treat organizational design: with clear roles, declared authorities, explicit routing, and policies that live somewhere other than someone's head.

---

## The Five Symptoms of Agent Chaos

If you're not sure whether your system has chaos, here are the five symptoms. You probably recognize more than one.

### 1. Routing Roulette

You have a new task. Which agent should handle it?

In a well-organized system, this question has a clear, deterministic answer based on declared routing rules. In a chaotic system, the answer depends on which agent saw the task first, or which one has the broadest mandate, or which one your coordinator decided to use today based on something buried in its system prompt.

The usual fix is to put routing logic in the coordinator's definition. Something like this:

```markdown
## Routing Rules
- Content requests → content-agent
- Research tasks → research-agent
- Technical questions → engineering-agent
- If unclear, ask the user
```

This works at first. Then you add a new domain. You update the coordinator's rules. But you also have a routing table file you created early on, because you wanted the rules "documented somewhere." And you have brief descriptions in each agent's own definition about what it handles. Now routing logic lives in three places:

```
routing-table.md          ← master reference (maybe)
coordinator-agent.md      ← operational rules (maybe different)
content-agent.md          ← self-description of scope (possibly outdated)
```

These three sources are never synchronized. The coordinator's rules expand over time. The routing table gets stale. The agent self-descriptions get updated when you're thinking about that specific agent, not the system as a whole.

I learned this the hard way after adding a fourth domain to a system with three existing domains. I updated the coordinator. I forgot the routing table. Two months later I couldn't figure out why a certain class of task sometimes worked and sometimes didn't. The answer was that the coordinator's rules and the routing table had diverged and I'd written some logic that referenced both.

There's no validation anywhere that these three sources agree. You can't lint routing consistency the way you can lint code. The only thing that tells you they've drifted is a broken run.

### 2. Permission Anarchy

By default, agents inherit whatever permissions you give them at setup. If you give an agent Bash access, it can read and write any file the process can reach. If you give it file access, same story.

Early on, this seems fine. You want your agents to be capable. The more access they have, the more they can do without bothering you.

What you end up with is this:

```yaml
# Conceptual permissions — what you intended
content-agent:
  can_read: [content/, drafts/]
  can_write: [content/]

research-agent:
  can_read: [research/, external-sources/]
  can_write: [research/]

# Actual permissions — what you implemented
content-agent:
  can_read: [*]
  can_write: [*]

research-agent:
  can_read: [*]
  can_write: [*]
```

The gap between intended and actual is enormous. The content agent can overwrite research files. The research agent can modify published content. Both can read each other's working directories, which means they can act on context they were never meant to see.

In small systems, this rarely causes problems. Agents tend to stay in their lanes because their prompts point them there. In larger systems, under edge cases, under ambiguous tasks, agents drift. They find a file that seems relevant. They write to a location because a previous agent wrote there. They make a reasonable decision given their context that violates a boundary you assumed was enforced.

Permissions in multi-agent systems need to be declared and enforced, not assumed and hoped. Every agent should have the minimum access required to do its job. The system should reject writes that fall outside declared scope. Right now, most agent setups don't do this — the policy lives in the system prompt, which means it's enforced only insofar as the model follows instructions reliably. That's advisory, not architectural.

### 3. Blueprint Brittleness

At some point you start grouping agents into teams. A research team. A content team. A review team. You document these as blueprints — markdown tables or config files that describe which agents participate, in what order, with what inputs and outputs.

This is the right instinct. The problem is that static blueprints don't compose.

Say you have a `content-production` blueprint that runs research, draft, and review in sequence. And you have a `quick-publish` blueprint that skips the review step. Now you want a `content-production-expedited` mode that uses the full pipeline but with the review agent running in parallel instead of serial.

You have three options: copy-paste the blueprint and modify it, add a conditional to your coordinator logic, or write a third blueprint from scratch. All three options make the system harder to maintain. The blueprints multiply. The relationships between them become implicit. When you change the review agent, you have to remember to update three blueprints instead of one.

A composable blueprint system would let you express this declaratively:

```yaml
blueprint: content-production-expedited
extends: content-production
overrides:
  review:
    mode: parallel
    depends_on: []
```

But without that kind of composability built into the system, you're stuck editing markdown tables and hoping you didn't miss anything.

The brittleness gets worse as the system grows. Sixteen blueprints in a real system is not unusual. At that scale, any change to a shared agent ripples through multiple blueprints with no automated way to find all the places that need updating.

### 4. Coordination by Coincidence

Multi-agent workflows need coordination. Agent A finishes a task and Agent B needs to know. Agent C is waiting on a file that Agent D is producing. Agent E needs to be notified when a certain condition is met.

The first solution most people reach for is file-based coordination. Agent A writes to a handoff file. Agent B polls or gets triggered when the file changes. This works, but it has no schema. The handoff file format is whatever Agent A happened to produce. Agent B reads it and extracts what it needs. If Agent A changes its output format, Agent B breaks — silently, at runtime, in a way that looks like an Agent B problem.

A more mature version uses hooks — scripts that fire on tool use events. An agent writes a file, the hook fires, the hook reads the file and does something with it. This is architecturally sound and I'll come back to why it's a bright spot.

But hooks can't talk to each other. If two hooks both need to respond to the same event, they run independently. There's no coordination. Hook A might run before Hook B has finished processing. Hook B might overwrite state that Hook A set. There's no event bus, no pub/sub, no schema for what events look like.

The result is coordination that works most of the time, breaks under concurrency or edge cases, and is nearly impossible to debug when it fails because you're looking at file states and hook logs that don't tell you the sequence of events that led to the broken state.

### 5. The Knowledge Triplication Trap

This is the subtlest symptom and the most damaging at scale.

In a well-run system, each piece of knowledge lives in one place. If you want to know how routing works, you read the routing policy. If you want to know what an agent can do, you read the agent definition. These sources are authoritative, complete, and don't contradict each other.

In a chaotic system, knowledge spreads. Routing rules live in the coordinator AND in a routing table AND in each agent's self-description. The agent's write scope is listed in the agent definition AND mentioned in a note in the team blueprint AND implicitly encoded in the hook logic. Domain boundaries are described in the department overview AND assumed in the coordinator prompt AND partially captured in a README you wrote six months ago.

None of these sources are wrong, exactly. They're just not synchronized. When you update one, you update the one you're looking at. The others drift.

The danger is that drift is invisible until something breaks. The system appears to work. Agents route correctly — until one doesn't. Write scopes appear respected — until one gets violated. The routing table and the coordinator agree — until you add a new domain and update only one.

```markdown
# What you see (routing-table.md, last updated 3 months ago)
| Task Type        | Agent           |
|------------------|-----------------|
| content-request  | content-agent   |
| research-request | research-agent  |
| review-request   | review-agent    |

# What the coordinator actually uses (coordinator-agent.md, updated last week)
- content requests → content-agent
- research requests → research-agent
- review requests → review-agent
- audit requests → review-agent     ← added here, not in the table
- technical requests → eng-agent    ← added here, not in the table
```

You now have two agents that handle tasks the routing table doesn't know about. Anyone consulting the routing table — including, potentially, an agent that reads it as context — will get wrong answers.

---

## What Actually Works (The Bright Spots)

Not everything is broken. In every chaotic system I've examined, there are patterns that work well. Understanding why they work is the first step toward fixing what doesn't.

**Hook architecture.** The pattern of firing scripts on tool use events is sound. It decouples policy enforcement from agent intelligence. Instead of asking an agent to remember the rules, you intercept the action before or after it happens and enforce the rule mechanically. A hook that validates file writes against declared scope runs every time, for every agent, regardless of what the agent was told. This is how you turn advisory policies into architectural constraints.

**File validation as executable policy.** When you write a hook that rejects writes to files outside an agent's declared scope, you've done something profound: you've made a policy enforceable without trusting the agent to follow it. The agent can have an incorrect system prompt, a confused context, a hallucinated file path — it doesn't matter. The hook catches it. This is the template for how all organizational policies should work in a multi-agent system.

**Session dashboards.** A startup script that reads system state and displays it at the beginning of a session tells you what's running, what's in progress, and what needs attention before you've typed a single command. This is primitive observability, but it works. It surfaces broken state early. It creates a mental model of system health before you start making changes.

**Task systems as real-time coordination.** A structured task list that agents can read and write to creates shared awareness. Agent A can see that Agent B is working on a related task. The coordinator can see what's in progress before dispatching a new task. This doesn't solve the event model problem entirely, but it creates enough shared state that coordination becomes more deliberate and less coincidental.

These aren't lucky accidents. They're early implementations of a pattern: make implicit things explicit. Routing intentions become enforced policies. Permission assumptions become validated constraints. System state becomes a readable dashboard. The bright spots point toward the solution.

---

## The Thesis

Here's what I've come to believe after running multi-agent systems for long enough to make all of these mistakes: agent chaos is not a tooling problem.

It's tempting to reach for a framework — something you install, configure, and deploy that handles the organizational design for you. Frameworks can help. But they don't solve the underlying problem, which is that most people treating multi-agent system design as a technical problem when it's an organizational one.

The questions at the center of agent chaos are:
- Who is responsible for what?
- What authority does each agent have?
- Where does each piece of knowledge live?
- How do agents coordinate without stepping on each other?
- How do you know when something is wrong?

These are the same questions every growing organization faces. The answers in human organizations involve org charts, decision rights, documentation standards, communication protocols, and monitoring. Multi-agent systems need the same things — just expressed in agent definitions, policy files, routing declarations, event schemas, and observability hooks.

The methodology in this guide is not a framework. There's nothing to install. It's a set of organizational design patterns that work regardless of which tools you're using — Claude Code, a custom agent framework, a production orchestration system. The patterns are:

1. Departments with clear ownership
2. Agent personas with declared identity and scoped permissions
3. Policies as code, not as prose in a system prompt
4. Composable blueprints with dependency graphs
5. Event-driven coordination with a schema
6. Observability that tells you what happened and why

The rest of this guide walks through each of these in detail, with real examples and the reasoning behind every decision.

But all of it starts with the department model, because organizational design starts with structure. Before you can route tasks correctly, enforce permissions precisely, or compose teams flexibly, you need to know how the work is divided.

---

**Next: [Chapter 2 — The Department Model](02-department-model.md)**

How to divide your agents into divisions with clear ownership, without creating silos that make cross-domain work impossible.
