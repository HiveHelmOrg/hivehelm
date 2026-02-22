# Chapter 6: Observability

*JSONL event streams, distributed tracing across swarms, rollup aggregation, and semantic outcome classification.*

---

## What You Have After Chapter 5

You have departments, personas, policies, and blueprints. A thirteen-agent swarm can run your Monday morning startup in under five minutes. The coordinator synthesizes five parallel reports into one coherent briefing. The system assembles itself.

Now you need to answer a different question: how do you know whether it's working?

Not "did the agents run." That's the easy question. The harder question is whether what they produced was actually complete and correct. Whether the briefing covered all five sections or quietly dropped two of them. Whether the health agent got real biometric data or fell back to a generic response because the API was down. Whether the content draft that came out of the sprint used the latest research or something six months old.

Without observability, you're guessing. You read the output, it looks roughly right, you move on. The failures are invisible because nothing broke, nothing crashed, and nobody told you anything was wrong.

That's the problem this chapter solves.

---

## Why Agent Systems Fail Silently

In traditional software, failure is loud. A service throws a 500. CI goes red. The deployment pipeline stops. Someone gets paged. The system actively tells you something is wrong.

Agent systems don't work this way.

An agent that fails to reach an external API doesn't crash. It adapts. It produces output with the data it has, notes somewhere in the prose that "weather data was unavailable," and finishes. The run status is "complete." The output exists. Nobody's alarm went off. But the briefing is incomplete.

An agent halfway through a seven-section report that hits a context limit doesn't crash either. It finishes what it has, wraps up, and returns five sections. The file gets written. The run ends. Unless you count the sections, you don't know anything is missing.

This is the silent failure mode that traditional observability misses entirely. Uptime monitors, HTTP response codes, error rates: these measure whether the service responded. They say nothing about whether the response was what it should have been.

You need a different kind of observability for agent systems. Not "did this service respond, and how long did it take?" but "did this agent produce a complete, correct result?"

The answer requires three things working together: a structured event stream that records what happened, distributed tracing that connects events from different agents in the same swarm, and semantic outcome classification that evaluates whether the result was actually good.

---

## The Event Stream

Everything starts with events. Every meaningful action in the system emits a structured event to a daily log file.

The format is JSONL: one JSON object per line, appended in chronological order. No database. No external service. No schema migrations. Just files.

```json
{
  "ts": "2026-02-17T14:30:22Z",
  "event_type": "skill_execution",
  "trace_id": "tr_20260217_143022_morning",
  "session_id": "sess_20260217_1430",
  "agent": "health-tracker",
  "skill": "daily-checkin",
  "duration_ms": 45000,
  "status": "complete",
  "domain": "personal/health"
}
```

Every event has the same core fields: a timestamp, an event type, a trace ID (more on this shortly), a session ID, the agent that emitted it, and a status. Additional fields depend on the event type.

The event types cover the full lifecycle of agent activity:

- `session_start`: a new session began. Includes system health metadata: inbox count, pending tasks, last check-in time. This is the system doing a pulse check on itself before any work starts.
- `skill_execution`: an agent ran a skill. Includes duration, status, and the domain the skill operated in.
- `capture_event`: a file was written to the knowledge base. Includes the domain and any quality signals the agent reported.
- `swarm_start` / `swarm_end`: a blueprint-driven team was created or destroyed. Includes the blueprint name, team size, and total duration.
- `error_occurred`: something went wrong. Includes severity and source so you can distinguish a warning (API rate limit, retry succeeded) from a real failure (skill couldn't complete, fallback data used).

The design choice that matters here is the append-only, file-based architecture. Events are never edited. Never deleted. A day's events live in `events-YYYY-MM-DD.jsonl`. When the day rolls over, a new file starts. You can grep any file with standard tools. You can parse it with any language. You can back it up by copying a directory. Nothing depends on a running service.

This is the foundation. Everything else in this chapter builds on top of it.

---

## Distributed Tracing Across Agent Swarms

Here's the problem that appears the moment a blueprint spawns more than one agent.

A morning-standup blueprint runs five agents in parallel. Each agent emits several events. By the time the run is done, the event file has thirty new lines, interleaved chronologically from all five agents. How do you reconstruct what happened during that specific run? How do you know which agent took longest? Which one emitted an error halfway through?

Without trace IDs, the event file is a flat stream of activity with no structure. You can see that five agents ran at roughly the same time, but you can't connect their events to each other or to the swarm that spawned them.

Distributed tracing solves this with one simple mechanism: a shared ID that every agent in a swarm inherits.

Before the swarm launches, the orchestrator generates a trace ID: `tr_20260217_143022_morning`. The format encodes the date, time, and blueprint name, so it's human-readable at a glance. Every agent in the swarm receives this trace ID in their prompt context. Every event they emit carries it.

After the run, reconstructing it is a single grep:

```bash
grep "tr_20260217_143022_morning" events-2026-02-17.jsonl
```

This returns every event from every agent in that swarm, in chronological order. You can see which agent started first, which ran longest, which emitted a warning, and how long the total run took from swarm_start to swarm_end.

The trace lifecycle has four steps:

1. The orchestrator calls `swarm-trace start <blueprint>` before spawning any agents. This generates the trace ID and emits a `swarm_start` event.
2. The trace ID gets passed to every spawned agent as part of their initial context.
3. Each agent includes the trace ID in every event it emits throughout its run.
4. The orchestrator calls `swarm-trace end <blueprint> success|failure|partial` after all agents complete. This emits a `swarm_end` event with the total duration.

The result is a complete audit trail for any swarm run, reconstructible from one file with one command.

One operational note: keep trace IDs deterministic within a run but unique across runs. Including the timestamp and blueprint name in the ID serves both purposes. `tr_20260217_143022_morning` can only refer to one specific run. If you run morning-standup again at 2pm, it gets `tr_20260217_140000_morning` and the events are cleanly separated.

---

## Rollup Aggregation: Three Zoom Levels

Raw events are for debugging a specific run. They're not useful for understanding patterns across days and weeks. For that, you aggregate.

The rollup pipeline has three levels: raw events, daily summaries, and weekly comparisons. Each level answers different questions.

### Daily Rollup

A daily rollup script reads the day's event file and produces a structured JSON summary. It runs at the end of each day (or at the start of the next session).

```json
{
  "date": "2026-02-17",
  "total_events": 47,
  "sessions": 3,
  "skills_executed": 12,
  "captures": 8,
  "alerts": 1,
  "skill_stats": [
    {
      "skill": "daily-checkin",
      "runs": 1,
      "avg_duration_ms": 45000,
      "success_rate": 100.0
    },
    {
      "skill": "morning-brief",
      "runs": 1,
      "avg_duration_ms": 32000,
      "success_rate": 100.0
    }
  ],
  "domain_activity": [
    {"domain": "personal", "captures": 4},
    {"domain": "work", "captures": 3},
    {"domain": "learning", "captures": 1}
  ],
  "agent_activity": [
    {
      "agent": "health-tracker",
      "actions": 5,
      "skill_runs": 2,
      "avg_skill_ms": 38000
    },
    {
      "agent": "coordinator",
      "actions": 8,
      "skill_runs": 3,
      "avg_skill_ms": 28000
    }
  ]
}
```

This answers questions like: how active was the system today? Which skills ran? Which domains got the most attention? Are any skills taking significantly longer than usual?

### Weekly Rollup

A weekly rollup aggregates seven daily summaries. The implementation can use a columnar query engine like DuckDB, which handles the aggregation in a few lines of SQL against the daily JSON files:

```sql
SELECT
  MIN(date) AS week_start,
  MAX(date) AS week_end,
  SUM(total_events) AS events,
  SUM(sessions) AS sessions,
  SUM(skills_executed) AS skill_runs,
  SUM(captures) AS captures,
  SUM(alerts) AS alerts
FROM read_json_auto('rollups/daily-*.json')
WHERE date >= '2026-02-10'
```

The weekly rollup produces a summary table with a row per day and a totals row. It runs on Sundays and feeds into the weekly review.

### The Three Zoom Levels in Practice

Event files: when something goes wrong, trace it. Grep by trace ID to see exactly what a specific swarm run did.

Daily rollup: spot the pattern. Did the morning-brief skill slow down this week? Is the work domain getting fewer captures than usual?

Weekly rollup: see the trend. Is the system more or less active than last week? Which skills are getting used more? Which have dropped off?

The pipeline is simple: raw events go to daily files, a nightly script produces daily rollups, a weekly script aggregates them. No real-time streaming required. No dashboards. Three JSON files and a couple of scripts.

---

## Semantic Outcome Classification

This is the piece that everything else depends on, and it's the hardest to get right.

A skill that runs and produces output has a status of "complete." But "complete" doesn't mean "good." The morning-brief skill ran. It produced output. But did it cover all five sections? Was the health summary based on real data or a cached fallback? Did the task prioritization step actually read the task backlog or just summarize whatever was in context?

Traditional status codes can't answer these questions. You need semantic classification: a post-execution evaluation that reads the skill's output and determines whether it actually meets the expected quality threshold.

### The Outcome Schema

For each skill, you define an outcome schema that describes what a complete result looks like:

```json
{
  "skill": "morning-brief",
  "expected_sections": [
    "weather",
    "schedule",
    "tasks",
    "inbox",
    "focus"
  ],
  "validation": {
    "min_sections": 4,
    "complete_threshold": 5,
    "min_output_chars": 500
  },
  "classification_rules": {
    "complete": "all 5 sections present AND file written",
    "partial": "4 sections present OR file not written",
    "degraded": "2-3 sections present OR fallback data used",
    "failed": "fewer than 2 sections OR no output produced"
  }
}
```

### Five Classification Levels

**Complete.** Everything worked. All expected sections are present. The output meets the minimum length. The file was written to the right location. This is the baseline you're optimizing for.

**Partial.** Most things worked, but something is missing. Four of five sections present. Output is shorter than expected. The file exists but is smaller than usual. Partial is not a failure: the output is usable. But it's a signal worth tracking.

**Degraded.** The skill ran but used fallback data or produced reduced-quality output. The weather section exists but reads "weather data unavailable, using cached data from yesterday." The health summary is present but pulls from a 48-hour-old snapshot. Degraded output is complete in structure but not in substance.

**Failed.** The skill did not produce usable output. Fewer than two sections, no file written, or the output is a boilerplate apology ("I was unable to complete this task"). Failed is an alert condition.

**Timeout.** The skill ran but hit its time limit before finishing. This is distinct from failed because the cause is known: it wasn't an error, it was an execution constraint. Timeouts often point to external API latency or runaway context size, not logic errors.

### The Classification Step

Classification happens post-execution. A validation hook reads the skill's output file (or the output text), checks it against the outcome schema, and updates the skill_execution event with the classification:

```json
{
  "event_type": "skill_execution",
  "skill": "morning-brief",
  "status": "complete",
  "outcome_classification": "partial",
  "outcome_details": "4 of 5 expected sections present. Missing: weather. Likely cause: weather API unreachable.",
  "duration_ms": 29000
}
```

Notice that `status` is "complete" (the skill ran to completion) but `outcome_classification` is "partial" (the result wasn't fully complete). These are different signals. Status tells you what happened at the execution level. Classification tells you whether the result was good enough.

### Building a Quality History

Once you have classification, you can track it over time. The daily rollup includes outcome distributions per skill:

```json
{
  "skill": "morning-brief",
  "runs": 21,
  "complete": 17,
  "partial": 3,
  "degraded": 1,
  "failed": 0,
  "timeout": 0,
  "complete_rate": 81.0
}
```

This is a quality metric you can trend, alert on, and improve. If the morning-brief complete rate drops from 90% to 75% over two weeks, something changed. Maybe an external API became less reliable. Maybe a blueprint change reduced the context available to the skill. The quality history surfaces these regressions before they become permanent.

---

## Correlation Rules: When Agents Work Together

Individual skill outcomes aren't the whole picture when agents work in teams.

Consider this scenario: the morning-standup blueprint runs the health-tracker skill first, then the morning-brief skill. Both run to completion. Both classify as "complete." But the morning briefing doesn't actually reference the recovery score from the health check. The briefing agent didn't read the health tracker's output; it generated its own summary from whatever was in context.

Each agent's individual output looks fine. The cross-agent data flow is broken.

Correlation rules are post-run checks that validate expected data flows between skills:

```json
{
  "id": "brief-references-checkin",
  "description": "The morning briefing should incorporate recovery data from the health check",
  "source_skill": "daily-checkin",
  "target_skill": "morning-brief",
  "expected": "brief output mentions recovery percentage or recovery score from checkin output",
  "check_type": "data_reference",
  "severity": "warning"
}
```

After a swarm completes, the correlation validator reads the outputs of both skills and checks whether the data reference exists. If the briefing doesn't mention recovery data from the checkin, it logs a correlation failure.

This catches the subtle failure class that no individual-skill validation can catch: agents that run cleanly but don't actually use each other's outputs. In a well-integrated swarm, the whole is more than the sum of the parts. Correlation rules verify that integration is actually happening.

Keep your correlation rule set small and high-value. Rules that check obvious structural dependencies (skill B should reference skill A's output) are worth the overhead. Rules that check semantic coherence between outputs require much more careful calibration and tend to produce false positives.

---

## The Session Dashboard

All of this telemetry is useless if nobody looks at it. The simplest observability surface is one that appears automatically, without requiring any manual effort: a health summary at the start of every session.

```
System Health | 2026-02-22
Last check-in: 2d ago  |  Inbox: 4 items  |  Tasks: 38 ready / 93 open
ALERT [HABITS]: Streak Day 0 — protect today
ALERT [RAG]: 27 files pending re-ingestion
```

The session-start hook reads the latest daily rollup, checks a set of health indicators, and surfaces anything that needs attention before the first task begins. The human starts every session already aware of what the system's state is.

The health indicators worth checking:

- **Days since last domain activity:** if the work domain hasn't had a capture in three days, is that intentional or is something broken?
- **Inbox accumulation:** more than 10 items in the inbox without a triage pass is a signal to schedule review time.
- **Task count in "ready" state:** if the task backlog is growing but the ready count isn't, something in the prioritization pipeline has stalled.
- **Skill error rate from the last 7 days:** if any skill has a complete rate below 80%, show it.
- **RAG sync status:** if more than 20 files have been edited without re-ingestion, search quality is degrading.

The dashboard isn't a monitoring tool. It's ambient awareness. The system surfaces what it knows. You decide whether to act on it. But you always start informed.

---

## What to Track, and What Not To

More events doesn't mean better observability. Noisy telemetry is worse than sparse telemetry because it buries the signals you actually care about.

**Track these:**

- Skill executions, with duration and outcome classification. This is the core unit of work.
- Swarm runs, with trace IDs and total duration. This connects the dots across multi-agent runs.
- Captures, with domain and quality signals. This tells you whether the knowledge base is growing correctly.
- Session starts, with system health metadata. This gives you the daily pulse check.
- Errors, with severity and source. Distinguish warnings from real failures.

**Don't track these:**

- Every tool call. A single skill execution might involve dozens of tool calls: file reads, searches, API requests. Tracking all of them produces thousands of events per day with no additional insight. Track the skill run, not each step within it.
- Every file read. File reads don't change system state and don't have quality outcomes. They're implementation details.
- Token usage at the event level. Track token costs at the billing level (monthly, per agent type) if you care about cost. Individual skill executions don't need per-event token counts; they add noise without adding insight.

**The overhead rule:** if emitting an event adds more than 100ms to a skill's execution time, the telemetry pipeline needs to be fixed. Events should be fire-and-forget appends to a local file. They should never block execution. If they do, the event stream has become a bottleneck, which is the opposite of what observability is supposed to be.

---

## Connecting to the Quality Layer

One more design choice worth being explicit about.

Outcome classification tells you whether a specific skill run was complete, partial, degraded, failed, or timed out. The daily rollup tells you the distribution of those classifications over time. The session dashboard surfaces the headline numbers.

What it doesn't tell you is whether the system as a whole is getting better or worse. Whether the improvements you made last week actually moved the needle. Whether a skill that was failing 20% of the time six weeks ago is now failing 5% of the time. Whether a new blueprint is producing higher-quality outputs than the one it replaced.

That's the job of the quality and health layer, which builds on everything in this chapter. Observability gives you the data. Quality and health give you the trends, the baselines, and the answer to the question every system eventually faces: is this getting better?

---

## What Observability Actually Changes

The practical difference between an instrumented system and an uninstrumented one isn't that failures get caught faster. It's that your relationship with the system changes.

Without observability, you're an optimistic consumer of agent output. Things mostly work, you mostly assume they worked, and the edge cases are invisible. With observability, you're an informed operator. You know the morning-brief skill completes at 85% and you have a theory about why the other 15% are partial. You know the health-tracker runs 40 seconds slower on days when the biometric API is slow, and you know how often that happens. You know which agents are doing most of the work and which haven't run a skill in two weeks.

That knowledge is what lets you maintain a multi-agent system without it quietly degrading over time. Agents that fail silently tend to fail worse and worse until the output becomes useless. Agents that fail visibly get fixed.

Observability is what makes the silence visible.

---

Observability tells you what happened and whether individual results were complete. The next layer answers a harder question: is the system as a whole performing well, and is it trending in the right direction? Chapter 7 covers quality and health: the metrics, baselines, and trend analysis that turn event data into system intelligence.

---

**Previous: [Chapter 5 — Composing Teams](05-composing-teams.md)**

**Next: [Chapter 7 — Quality and Health](07-quality-and-health.md)**
