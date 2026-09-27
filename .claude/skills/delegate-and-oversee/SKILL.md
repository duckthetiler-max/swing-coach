---
name: delegate-and-oversee
description: Default working mode for every Claude Code session. The main session is the overseer on a top-tier model (Opus or Fable) - it frames the task, makes the judgment calls, writes precise briefs and reviews every result - while searching, reading, routine coding and test runs are delegated down to cheaper-model subagents (Haiku, Sonnet). Same quality, far fewer top-model tokens. Use this at the start of any coding, debugging, research or multi-step task - anything bigger than a one-line edit or a single lookup - and whenever you are about to spawn a subagent or pick a model for one, even if the user never mentions delegation, models or tokens.
---

# Delegate and oversee

Spend top-model tokens on judgment and cheaper-model tokens on volume. The main
session is the **overseer**: it works out what is wanted, decides how, writes the
briefs and checks the results. Subagents on cheaper models do the searching,
reading, typing and test-running. Quality holds because two things are never
handed down: the thinking at the start (a precise brief) and the checking at the
end (verifying the real result, not the report).

Why this saves tokens: every file, search hit and log the overseer reads stays in
its context and is paid for again, at top-model rates, on every later turn. A
subagent reads that material on a cheaper model and hands back a short
conclusion, so the expensive context stays small for the rest of the session.
It only pays when there is bulk to hand off, though. A short chain of dependent
steps that fits comfortably in context is cheaper to just do: the brief, the
handoff and the review would cost more than they save.

## The team

| Agent | Model | Give it |
|---|---|---|
| `scout` | Haiku | Finding code, "where/how is X done?", reading and summarizing files, docs, logs. Read-only. |
| `checker` | Haiku | Running tests, lint, type-checks, builds. Reports only what failed and why. |
| `builder` | Sonnet | Implementing a change from a clear spec; writing or updating tests. |
| `reviewer` | Fable | Fresh-eyes review of large or risky changes, and the final review whenever the session itself runs on Sonnet or Haiku. |

List prices per million input/output tokens (September 2026): Haiku 4.5 $1/$5,
Sonnet 5 $2/$10, Opus 5.5 $4/$20, Fable 5.1 $10/$50. Fable is the most capable.
"Top tier" below means Opus or Fable.

These agents are defined in `.claude/agents/`. In a repo that doesn't have them,
use `general-purpose` and set `model` on the call: `haiku` for scout and checker
jobs, `sonnet` for builder jobs, `fable` for review. Always set `model` on
built-in agents: `Explore`, `Plan` and `general-purpose` inherit the session's
model by default, so an unqualified search quietly runs at top-model rates. If
Fable isn't available on the account, use `opus` wherever this skill says `fable`.

## What the overseer keeps

- Working out what the user actually wants, and asking them when it is genuinely their call.
- Design and architecture decisions, and anything that cuts across many files.
- Security, auth, payments, data migrations or deletions, concurrency.
- Root-causing a bug nobody has explained yet. Once the cause is known, a builder can make the fix.
- The briefs, the reviews and the final answer to the user.
- Jobs smaller than their brief: a one-line edit, one known file, a single grep.
  Every subagent starts with a fixed overhead of several thousand tokens, so
  tiny jobs cost more delegated than done.

If this session is running on Sonnet or Haiku, send the judgment up instead of
doing it at a lower tier: a design you are unsure of goes to `Plan` with model
`fable`, and the final review always goes to `reviewer`.

## The loop

1. **Frame.** Pin down the outcome and how you will know it is done: which tests
   must pass, what behavior must show. Split the work into jobs a cheaper model
   could finish with nothing but the brief.
2. **Delegate.** Pick the lowest tier that will reliably succeed. Send
   independent jobs in one message so they run in parallel, but never let two
   builders edit the same files at once. Once a job is out, don't also do it
   yourself; wait for the report.
3. **Verify.** Check evidence, not reports; a subagent's summary is a claim.
   Read the actual diff (`git diff`), see the checks pass (run them yourself or
   through `checker`) and tick off each acceptance criterion. Before building on
   a scout's finding, open the `path:line` it cites.
4. **Correct.** A few-line fix: make it yourself, since a round trip costs more.
   A bigger miss: send it back to the same agent with SendMessage (it keeps its
   context) and say exactly what is wrong. Failed twice, or turned out to need
   judgment: move it up a tier or take it over.
5. **Report.** Tell the user what changed and what you verified yourself.

## Choosing the tier

- **Haiku**: mechanical and fully specified. Locate, read, summarize, run
  commands and report, apply an exact edit (rename, move, find-and-replace).
- **Sonnet**: ordinary engineering from a clear spec. Implement a feature or a
  fix with a known cause, write tests, refactor within a module, write docs.
- **Top tier (Opus, Fable)**: ambiguity or high stakes. Unclear requirements, design, hard
  debugging, security-sensitive code, final review, and anything that already
  failed at a lower tier.

Between two tiers, go lower only when a failure would be cheap to spot and
redo. When a mistake could slip through review or cause damage, go higher.

## Writing the brief

The subagent cannot see this conversation; anything not in the brief does not
exist for it. A vague brief to a cheap model is the most expensive option of
all: it fails, and you pay twice.

```
Goal:      one sentence - the outcome, not the activity
Context:   why it matters, what you already know, exact file paths (and lines)
Do:        the spec and constraints - style to match, APIs to use or avoid, files not to touch
Done when: acceptance criteria - which tests pass, what behavior shows
Return:    the exact shape and size of the answer, e.g. "path:line list + 2-line conclusion, under 200 words"
```

## Quality gate

Before calling anything done:

- The whole diff has been read, every change traces back to the brief, nothing is outside scope.
- Tests, lint and build pass on the final state, and you have seen the output rather than assumed it.
- No tests skipped, disabled or weakened; no TODO stubs or placeholder values.
- The code matches the surrounding style, naming and comment density.
- Risky parts have been read by the top tier: by you, or by `reviewer` if this session is on a lower one.

## Keeping the bill down

- Ask for conclusions, not dumps: `path:line` references and short summaries with a word limit.
- Hand big reads (long files, logs, full test output) to a subagent so they never enter the overseer's context.
- Batch small related jobs into one brief instead of spawning an agent per job.
- Send follow-ups on the same job to the same agent with SendMessage rather than starting a new one.
- Don't re-read files or re-run searches a subagent already covered, except to check a specific claim.
