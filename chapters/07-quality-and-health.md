# Chapter 7: Quality and Health

*Automated skill scoring across six dimensions, system health dashboards, and continuous quality improvement.*

---

## What You Have After Chapter 6

You have an event stream, distributed tracing, semantic outcome classification, and a session dashboard that shows you the system's state before you start each day.

Observability tells you what happened. A skill ran. It produced output. The outcome classified as "partial." The morning brief took 29 seconds and covered four of five expected sections.

That's useful. But it answers the execution question, not the quality question. "Did this skill run?" is different from "Is this skill well-built?" And "Did the system produce output today?" is different from "Is the system, across all its agents and domains and workflows, actually getting better or worse over time?"

Observability is data collection. Quality and health is interpretation. This chapter covers the layer that sits on top of the event stream and turns it into something you can act on.

---

## Two Levels of Quality

The most common mistake when thinking about quality in an agent system is treating it as one thing. It's two things, and they require different instruments.

**Skill quality** is about individual skills. Is this particular skill well-constructed? Does it handle failures gracefully? Does it produce output in the right format? Does it have appropriate tool permissions? Does it have test coverage? A skill that scores well on all these dimensions is reliable: you can run it a hundred times and trust what it produces.

**System health** is about the whole. Are all your domains active? Are tasks getting completed or accumulating in stalled queues? Are goals being worked on or sitting ignored? Is the content pipeline moving from ideas to drafts to published, or is it jammed somewhere in the middle?

You need both. A system full of well-built skills can still be unhealthy. If your learning domain hasn't been updated in three weeks and nobody is reviewing the task backlog, the system is degrading, even if every individual skill runs cleanly. Conversely, a healthy-looking system with active domains and moving tasks can still be running on poorly-built skills that produce unreliable output, and the problems won't surface until you look at the skills themselves.

The instruments are different because the problems are different. Skill quality needs a scorecard. System health needs a dashboard. Together, they give you the full picture.

---

## The Six-Dimension Skill Scorecard

Every skill in your system can be evaluated on six dimensions. Each dimension scores from 0 to 10. The composite score is the unweighted average.

Unweighted is intentional. When you first start scoring your skills, every dimension matters equally because you don't yet know which failures hurt you most. After you have a few months of operational data, you'll see which weak dimensions correlate with poor outcome classifications. You can weight then. Start simple.

Here are the six dimensions.

### 1. Error Handling (0-10)

Does the skill specify what to do when things go wrong?

The baseline is: happy path only, no error handling. Score: 0-3. The skill works when everything is available, fails silently or produces garbage when anything is missing.

Middle ground: the skill acknowledges that dependencies might fail and describes fallback behavior in general terms. Score: 4-6.

Strong error handling: specific fallback behaviors for specific failure modes. "If the weather API is unreachable, note that weather data is unavailable and continue with the other sections." "If no tasks are in the ready queue, report that the queue is empty and recommend a backlog triage." "If the target file doesn't exist, create it." Score: 7-10.

An agent that hits an unavailable API and produces nothing is worse than useless, because the failure is silent. The briefing looks complete. It isn't. Good error handling turns silent failures into visible degradations.

### 2. Format Compliance (0-10)

Does the skill produce output that follows the system's capture format conventions?

This means: date headers in the right format, required tags present, section separators used correctly, output routed to a file with the expected naming pattern.

Format compliance matters because inconsistently formatted output is hard to query, hard to search, and hard to parse programmatically. The semantic outcome classifier needs to find the section headers to count them. The RAG index needs proper tags to group related content. The daily rollup needs predictable file names to know which captures to count.

Score based on how many formatting conventions the skill specifies and follows. A skill with no format instructions gets 0-2. A skill that mentions format requirements but is vague about them gets 3-5. A skill that explicitly defines output structure, uses the system's date/tag/separator conventions, and specifies where the file should be written gets 8-10.

### 3. Tool Scoping (0-10)

Are the skill's tool permissions as tight as they should be?

This is a security and reliability dimension. An agent with unrestricted shell access can run anything. An agent scoped to `Bash(npm *)` and `Bash(pytest *)` can only run npm and pytest commands. If something goes wrong (or something tries to go wrong), the blast radius is bounded.

Broad permissions are sometimes necessary: a build skill or a deploy skill genuinely needs wide shell access. That's fine, but it should be an explicit decision, not an accident. Score those skills 5-7 because the breadth is justified, not because tight scoping isn't valuable.

Skills that handle no system-level operations (capture skills, analysis skills, routing skills) should have no shell access at all. A capture skill that has `Bash(*)` permission is misconfigured. Score that 0-2 and fix it.

Tight, well-reasoned tool permissions score 8-10.

### 4. Routing Correctness (0-10)

Does the skill route its output to the right place?

Skills with fixed destinations score automatically. A skill that always writes to `personal/health/daily-log.md` is easy to evaluate: either it routes there or it doesn't. Skills with fixed destinations and explicit routing instructions score 8-10.

Skills that route dynamically (different output depending on content type, agent, or user input) need to reference the routing table. If they do, and the routing logic is clearly specified, score 7-9. If they route dynamically without specifying how routing decisions are made, score 2-4. Dynamic routing with unclear logic is a frequent source of captures landing in the wrong domain.

Skills with no output (coordination-only, analysis-only) get a 10 on this dimension. There's nothing to misroute.

### 5. Test Coverage (0-10)

Does a test file exist for this skill?

This one is binary, and intentionally harsh: 10 if a test file exists, 0 if it doesn't.

The harshness is deliberate. Test coverage is the dimension that almost every skill will fail when you first run the scorecard. Making it binary removes the temptation to give partial credit for "well, the skill looks like it would work." Either there's a test, or there isn't.

A test file for a skill doesn't need to be sophisticated. It needs to verify that the skill produces expected output for known inputs. A fixture input, an expected output format, a check that the file was written to the right location. That's enough to catch the most common regressions.

The reason this dimension matters so much: agent systems accumulate change silently. You update a routing table. You change a system prompt. You add a new tag convention. None of these feel like breaking changes. But if a skill was routing to `work/decisions/` and your routing table change means it should now route to `work/automation/`, only a test will catch that the skill is now misrouting every run.

### 6. Integration with Task Tracking (0-10)

Does the skill create tracked tasks when it produces action items?

This dimension separates skills that surface work from skills that actually ensure the work gets done.

A skill that produces a list of follow-up items as unchecked markdown bullets has a problem. Those bullets live in a file. Nobody reads the file unless they remember to. The action items are invisible to any task management system. They don't get prioritized, estimated, or assigned. They get forgotten.

A skill that creates tracked tasks in the system's task manager for every action item it identifies has closed the loop. The work exists somewhere it can be queried, sorted, and acted on.

Score based on how rigorously the skill connects output to the task system. No connection: 0-3. Partial connection (some action items tracked, others not): 4-6. Consistent task creation for all action items: 7-10.

---

## What a Scored Library Actually Looks Like

Here's what a representative slice of a skill library looks like after the first full evaluation:

```
| Skill          | Error | Format | Tools | Routing | Test | Tasks | Composite |
|----------------|-------|--------|-------|---------|------|-------|-----------|
| daily-checkin  |   7   |    9   |   8   |    10   |  10  |   7   |    8.5    |
| capture        |   5   |    9   |   7   |    10   |  10  |   9   |    8.3    |
| morning-brief  |   8   |    6   |   8   |    10   |  10  |   8   |    8.3    |
| weekly-review  |   6   |    8   |   6   |    10   |  10  |   8   |    8.0    |
| task-triage    |   7   |    7   |   8   |    10   |  10  |   6   |    8.0    |
| analytics      |   5   |    4   |   3   |    10   |   0  |   7   |    4.8    |
| deploy         |   6   |    3   |   3   |    10   |   0  |   4   |    4.3    |
| data-export    |   4   |    2   |   2   |    10   |   0  |   3   |    3.5    |
```

The pattern here is consistent with what you'll see in most systems.

The top skills share a common profile: good error handling, consistent format compliance, tight tool scoping, correct routing, full test coverage, and solid task integration. These are skills that get used daily or weekly, have been refined through repeated use, and have tests because a regression would be immediately visible.

The bottom skills share a different profile: weak error handling, poor format compliance, broad tool permissions, no test coverage, and weak task integration. These are often skills built for a specific one-off need, never refined, and never tested because "I'll do that later."

---

## What the Scores Reveal: Reading the Dimensions

Run the scorecard across your full library and look at the column averages. The pattern across teams and systems is remarkably consistent.

**Test coverage will be the weakest dimension.** The mean for a skill library that hasn't been deliberately improved is usually 1-2 out of 10. Most skills have no tests. This is the single largest improvement opportunity in the entire system, and it's also the most addressable: tests don't require rewriting skills, just adding test files.

**Error handling will be second weakest.** Skills describe what should happen, not what should happen when something fails. The happy path is always specified. The fallback behavior is rarely specified. This is where the outcome classifications of "degraded" and "partial" come from in the observability layer.

**Format compliance will land in the middle.** Skills usually have some formatting intent, but it's often vague. "Write a summary with tags" is not the same as "write a summary using the `## YYYY-MM-DD: Title` header format, with `#domain/type` tags, separated by `---` from prior entries." Vague formatting instructions produce inconsistent output.

**Routing will be the strongest dimension.** Skills with fixed output destinations score automatically. Most skills have fixed destinations. So most skills score 10 on routing without any deliberate effort. This is fine; it just means routing isn't where you focus your improvement energy.

**Tool scoping reveals a division-level pattern.** When you group skills by division or department, you'll find that engineering division skills (build, deploy, test, release) cluster at the low end of tool scoping because they need broad shell access. This is expected but worth tracking. Broad permissions that are necessary are different from broad permissions that are accidental. The scorecard forces you to tell the difference.

---

## The System Health Dashboard

The skill scorecard measures individual skill quality. The system health dashboard measures whether the overall system is functioning. It's a different instrument for a different question.

The dashboard runs 10-12 checks, each producing a score, with the total normalizing to 0-100. It produces a traffic-light reading:

- **80+**: Excellent. The system is active, well-organized, and producing output.
- **60-79**: Good. Minor gaps. Nothing urgent.
- **40-59**: Needs Attention. Several areas are degrading. Review soon.
- **Below 40**: Critical. The system is not functioning as intended. Intervene now.

Here are the checks worth running.

**Domain completeness.** How many files does each domain have? When was the most recent update? A domain that hasn't been written to in 14 days is either inactive by choice (flag for review) or inactive by accident (alert).

**Temporal gap detection.** For domains with regular cadences (daily health logs, weekly reviews), are the entries arriving on schedule? A gap of more than 3 days in a daily log is a concrete, detectable gap, not a vague sense that something might be missing.

**Tag consistency.** What percentage of markdown files have proper domain and type tags? Files without tags are invisible to semantic search. Below 80% means the knowledge base is partially unsearchable.

**Task management health.** How many tasks are open? In progress? Blocked? Stale (open for more than 30 days without a status change)? A large stale count means the task system is being written to but not read from, which defeats its purpose.

**Goal alignment.** Do active goals have active tasks? A goal with no associated task in the task system is aspirational at best. Flag goals that haven't had a task created against them in the last 30 days.

**Content pipeline conversion.** For content-producing domains: what's the ratio of ideas to drafts to published? If there are 12 ideas and 0 drafts, the pipeline is jammed at the drafting stage. If there are 8 drafts and 0 published pieces, it's jammed at the publish stage. The ratio tells you where to look.

**Execution health.** From the observability layer: how many sessions this week? What's the skill success rate across all skills? What's the average skill duration? Are any skills trending slower or less reliable?

**Semantic search coverage.** How many files have been modified since the last RAG sync? Above 20 is a signal to sync. Above 50 is a signal that the semantic search index is materially out of date.

**Inbox processing rate.** How many items are in the inbox? How many were added this week? How many were processed (moved to a domain folder)? A growing inbox with no processing is a capture system that's producing but not consuming.

**Skill outcome quality.** Average outcome classification across the last 7 days: what percentage of skill runs classified as "complete" versus "partial" or "degraded"? Below 80% complete across all skills is an alert condition.

Each check awards points. The exact point allocation depends on your system's priorities. A system where content output is critical should weight the content pipeline check more heavily. A system where health tracking is the core use case should weight the temporal gap check for the health domain more heavily. Start with equal weights and adjust after you've seen a few weeks of data.

---

## The Top 3 Actions Pattern

Here's the thing about health dashboards: the score isn't the valuable part. The top 3 actions at the bottom are.

A score of 67 tells you the system needs attention. It tells you nothing about where to focus or what to do. The actions tell you both.

The dashboard generates actions automatically by looking at which checks scored lowest and translating them into specific, concrete next steps.

Not "update stale domains" (vague, not actionable). Instead: "The learning/ domain hasn't been updated in 12 days. Create a TIL entry from your most recent session."

Not "improve task management health" (vague, not actionable). Instead: "23 tasks have been open for more than 30 days without a status change. Review and either close or update them."

Not "improve content pipeline" (vague, not actionable). Instead: "There are 7 ideas in draft status. Pick the highest-priority one and move it to a working draft."

The distinction is: the score is diagnostic. The actions are prescriptive. A dashboard that only shows the score leaves you with a problem to solve. A dashboard that ends with three specific, ranked actions is a decision-support tool. You read it, you do the three things, you run it again next week.

Here's what the output of a health dashboard looks like in practice:

```
System Health Report | 2026-02-22
Overall Score: 67/100 (Good — Minor Gaps)

Domain Status:
  work/          82pts  Active (last update: yesterday)
  personal/      71pts  Active (last update: 2 days ago)
  learning/      34pts  STALE (last update: 12 days ago)
  content/       61pts  Active (last update: 4 days ago)
  conference/    58pts  Active (last update: 5 days ago)

Task Health:
  Open: 93  |  In Progress: 12  |  Blocked: 4  |  Stale (30d+): 23

Content Pipeline:
  Ideas: 14  |  Drafts: 7  |  Published: 2  (conversion: 14%)

Execution (last 7 days):
  Sessions: 11  |  Skill runs: 67  |  Complete rate: 84%

Top 3 Actions to Improve Score:
  1. [+8pts] learning/ domain is stale (12 days). Create a TIL entry from
     your most recent work session.
  2. [+6pts] 23 tasks are stale (open 30+ days). Archive or update them
     during your next review session.
  3. [+5pts] Content pipeline conversion is 14% (7 drafts, 2 published).
     Move one draft to published or archive low-priority drafts to clear
     the queue.
```

The "+8pts" estimates make the prioritization obvious. Do the top action first. It's the highest-leverage thing you can do right now.

---

## Dimension-Level Improvement Campaigns

Individual skill improvements matter. But when you look at the scorecard across a full skill library, the most valuable improvement is often at the dimension level, not the skill level.

If test coverage has a mean of 0.6 across 40 skills, fixing one skill's test coverage doesn't move the needle. Running a campaign to add tests to the top 15 skills by usage frequency moves the needle significantly and permanently.

The campaign structure is simple.

First, identify the weakest dimension. Look at column averages in the scorecard. Usually it's test coverage. Sometimes it's error handling.

Second, rank skills by composite score and filter to low-scorers on that dimension. For a test coverage campaign: skills with test = 0, sorted by how frequently they run (daily skills first, then weekly, then on-demand).

Third, scope the campaign to a quarter. "By end of Q2, 15 skills have test coverage." That's specific, time-bounded, and achievable. "Improve test coverage across the system" is indefinitely deferrable. "15 skills have tests by June 30" is not.

Fourth, track it. Add the 15 skills to the task system as a single campaign. Each skill that gets a test file closes a task. At the quarterly review, you count how many closed.

This is the mechanism that turns a one-time audit into continuous improvement. The scorecard runs quarterly. The campaigns run in parallel. Each quarter, the weakest dimension gets a campaign. Over two years, the entire skill library lifts systematically.

Here's what a campaign kickoff entry looks like in the task system:

```
Campaign: Test Coverage — Q2 2026
Target: Add test files for 15 high-traffic skills with test score = 0
Skills targeted (in priority order):
  1. /analytics (runs daily, composite 4.8)
  2. /deploy (runs on-demand, composite 4.3)
  3. /data-export (runs weekly, composite 3.5)
  ... [12 more]
Success metric: 15 skills with test = 10 by June 30
```

---

## The Exemplar Pattern

Abstract improvement guidelines are less effective than concrete examples. The most efficient way to improve a low-scoring skill is to point it at a high-scoring one and say: do what that skill does.

In your scorecard, the top-scoring skill is the exemplar. In the table above, "daily-checkin" at 8.5 is the exemplar. It has strong error handling, consistent format compliance, tight tool scoping, correct routing, full test coverage, and good task integration.

When you improve "analytics" (composite 4.8), you don't improve it by reading a style guide. You improve it by reading the daily-checkin skill file and asking specific questions:

- How does daily-checkin handle API failures? Copy that pattern. Adapt the API names. That's your error handling section.
- How does daily-checkin scope its tool permissions? Use the same structure. Remove permissions that analytics doesn't need.
- How does daily-checkin create tasks for follow-up items? Replicate that section in analytics.

The exemplar makes the abstract concrete. "Add better error handling" is ambiguous. "Add error handling that follows the daily-checkin pattern" is specific.

When you onboard a new skill to the system, the first instruction to the agent building it is: "Read the exemplar skill at `[path]`. Your skill should follow the same structure for error handling, format compliance, and task integration." This sets a quality floor for new skills before the first line is written.

The exemplar changes over time. As you improve skills, the top scorer changes. That's fine. The point is that there's always a concrete reference to point at. Never let the exemplar be a hypothetical best practice. It should always be a real file in the system.

---

## The Periodic Review Cadence

Quality isn't a one-time assessment. Without a cadence, quality degrades invisibly. Skills get written, used, never tested, never improved. The system accumulates technical debt that only becomes visible when something breaks badly enough that you notice.

With a cadence, degradation gets caught early and fixed incrementally.

**Weekly.** Run the health dashboard. Read the score. Do the top 3 actions. This takes 10-15 minutes and keeps the system from drifting. The health dashboard is not the place for deep analysis. It's a pulse check: is everything roughly okay, and what are the two or three things most worth doing right now?

**Monthly.** Re-score the bottom 10 skills by composite score. Check whether any active improvement campaigns are on track. Update the status of campaign tasks. If a skill improved significantly last month, check whether it pulled a lower-scoring skill up with it (often the case when they share components or patterns). The monthly review takes about an hour.

**Quarterly.** Full skill library re-evaluation. Every skill gets re-scored on all six dimensions. Update the scorecard. Set new campaign targets. If the system has evolved significantly (new departments added, new workflows, new tools), consider whether any dimensions need reweighting or whether new dimensions are worth adding. The quarterly review takes a half-day, and it's worth it.

One practical note: the first time you run the full scorecard, the results are humbling. Test coverage will be 0 or near-0 for most skills. Error handling will be weak across the board. Format compliance will be inconsistent. That's normal. The point of the first run isn't to feel good about the system. It's to establish a baseline and identify the first campaign. Every subsequent run shows improvement against that baseline, which is where the motivation to keep going comes from.

---

## Quality is What You Trust

There's a difference between a system that works and a system you trust.

A system that works produces output. Most of the time it's correct. When it isn't, you find out by reading carefully or stumbling across the error. You verify the important things manually because you're not quite sure what the system would do.

A system you trust produces output you can act on without re-checking every line. You know the daily-checkin skill handles API failures gracefully, because you read the skill file and you saw the error handling section and you tested it. You know the capture skill routes correctly, because you have test coverage that verifies the routing. You know the morning brief is covering all five sections at an 84% complete rate, because the outcome classifier has been telling you that for six weeks.

That trust is built through the scorecard, the health dashboard, the improvement campaigns, and the review cadence. It doesn't happen at once. It accumulates, quarter over quarter, as the skill library gets better and the health score trends up.

Observability tells you what happened. Quality and health tell you whether it was good enough and whether the system is improving. Together, they close the loop: build something, measure whether it works, improve it systematically, build trust in the result.

That loop is what makes the difference between an experiment and an organization.

---

Everything in this guide so far has been about systems, structures, and processes. Chapter 8 turns to a different question: who builds these systems well, and why the answer is often not who you'd expect. The best agent operators are frequently not traditional developers, and understanding why changes how you hire, train, and think about the work.

---

**Previous: [Chapter 6 — Observability](06-observability.md)**

**Next: [Chapter 8 — The Non-Developer Advantage](08-non-developer-advantage.md)**
