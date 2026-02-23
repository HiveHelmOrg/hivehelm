# HiveHelm

**The Non-Developer's Guide to Agent Operations**

You don't need to build agents. You need to run them.

HiveHelm is a methodology for organizing and operating multi-agent AI systems: departments, personas, policies, and observability. It's extracted from a real system running 30 agents, 83 skills, and 16 team blueprints in production daily.

This is not a framework. There's nothing to install. It's a set of patterns and principles for anyone running more than a couple of AI agents and wondering why everything keeps breaking.

---

## The Problem

Your first agent worked great. Your second one was fine. By agent number three, you have:

- Agents overwriting each other's work
- No idea which agent should handle what
- Routing logic copy-pasted in three places
- "Policies" that live in your head, not in code
- Zero visibility into what agents actually did

This is **agent chaos**. HiveHelm is the fix.

---

## What's Inside

### The Guide (8 Chapters)

All 8 chapters are published. Each documents a pattern extracted from a real multi-agent system, framed as lessons learned, not "install my code."

| Ch | Title | What You'll Learn |
|----|-------|-------------------|
| 1 | [The Problem: Agent Chaos](chapters/01-agent-chaos.md) | Why single agents work but multi-agent systems break without structure |
| 2 | [The Department Model](chapters/02-department-model.md) | How to organize agents into divisions with clear responsibilities |
| 3 | [Agent Personas That Work](chapters/03-agent-personas.md) | The identity framework: name, role, escalation, delegation, tool scoping |
| 4 | [Policies as Code](chapters/04-policies-as-code.md) | Routing rules, write scopes, content constraints, all declarative |
| 5 | [Composing Teams](chapters/05-composing-teams.md) | Blueprint definitions, parallel + sequential modes, lifecycle management |
| 6 | [Observability](chapters/06-observability.md) | JSONL event streams, distributed tracing across agent swarms |
| 7 | [Quality and Health](chapters/07-quality-and-health.md) | Automated skill scoring, system health dashboards |
| 8 | [The Non-Developer Advantage](chapters/08-non-developer-advantage.md) | Why "builder who ships" beats "10 years of C++ at FAANG" for agent ops |

### deep-review (Showcase Plugin) *coming soon*

A standalone Claude Code plugin that runs a 13-agent hierarchical analysis on any codebase. Four division heads (Engineering, Data, DevOps, AI & Automation) each run sub-teams of specialists, cross-discuss findings, and deliver a unified report with prioritized action plan.

Install it, run one command, get a comprehensive codebase audit.

### Hooks Collection *coming soon*

10+ copy-paste hook recipes with explanations for Claude Code:

- File validation on every write
- Session dashboard on startup
- Notification routing by event type
- File change tracking for RAG sync
- Teammate monitoring patterns
- Task lifecycle automation

---

## Who This Is For

- **AI builders** running more than 2-3 agents who need structure
- **Non-developers** using Claude Code, Cursor, or similar tools to build with AI
- **Team leads** designing agent workflows for their organizations
- **Anyone** who's felt the pain of "agent chaos" and wants a proven approach

## Who This Is NOT For

- People looking for an agent framework to install (use [CrewAI](https://crewai.com), [LangGraph](https://github.com/langchain-ai/langgraph), or similar)
- Researchers building novel agent architectures
- Anyone whose agents work fine as-is (if it ain't broke, don't helm it)

---

## The HiveHelm Model

```
You (Human, the Helmsman)
│
├── Executive Division
│   ├── Chief of Staff (coordinator)
│   ├── Work Ops
│   └── Finance Controller
│
├── Engineering Division
│   ├── Code Reviewer
│   ├── Security Auditor
│   └── Test Analyst
│
├── Data Division
│   ├── Schema Analyst
│   ├── Pipeline Analyst
│   └── Metrics Analyst
│
└── Creative Division
    ├── Content Writer
    ├── Designer
    └── Growth Strategist
```

Each division has:
- **Clear ownership**: which problems belong to which agents
- **Defined escalation paths**: when to hand off vs. handle
- **Scoped permissions**: what each agent can read and write
- **Declared policies**: routing rules, constraints, approval gates

The hive is the structure. You are the helm.

---

## Quick Start

You don't install HiveHelm. You read it, adapt the patterns, and apply them to your own agent system. Start here:

1. **Read [Chapter 1](chapters/01-agent-chaos.md)** to diagnose whether you have agent chaos
2. **Read [Chapter 2](chapters/02-department-model.md)** to design your department structure
3. **Read [Chapter 3](chapters/03-agent-personas.md)** to write agent definitions that actually work
4. **Try [deep-review](deep-review/)** to see a 13-agent team in action on your own codebase

---

## Background

HiveHelm is extracted from a real system that has been running in production since late 2025. The author is not a software developer. They're an automation specialist who learned to run multi-agent systems by building one for their own work, making every mistake in the book, and documenting what survived.

80+ Claude Code sessions. 44,000+ messages. 30 agents. This guide is the distilled result.

---

## Contributing

This is an opinionated methodology, not a community framework. That said:

- **Issues**: If a chapter is unclear or wrong, open an issue
- **Discussions**: Share your own agent operations patterns
- **Pull requests**: Accepted for typos, clarifications, and hook recipes

---

## License

MIT. Use it however you want. Attribution appreciated but not required.

---

## Links

- [Author's LinkedIn](https://www.linkedin.com/in/tolga-oral/)
- [Verluna](https://verluna.de) (GTM Engineering consultancy)
