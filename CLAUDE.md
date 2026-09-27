# CLAUDE.md

## Every session: delegate down, oversee at the top

For any task bigger than a one-line edit or a single lookup, load the
`delegate-and-oversee` skill (`.claude/skills/delegate-and-oversee/SKILL.md`)
and work that way. This section is for the main session; subagents follow
their brief instead. In short:

- **You are the overseer.** Spend top-model tokens on judgment: framing the
  task, design decisions, writing precise briefs and reviewing results.
- **Delegate the volume down** to the agents in `.claude/agents/`: `scout`
  (Haiku) finds and summarizes, `checker` (Haiku) runs tests and lint, `builder`
  (Sonnet) implements from a spec. Don't let routine work run on the top model,
  and always set `model` when using built-in agents like `Explore`, which
  otherwise inherit the session's model.
- **Nothing is done until you have verified it.** Read the real diff, see the
  checks pass and tick off the acceptance criteria. If this session runs on
  Sonnet or Haiku, the final review goes to `reviewer`, which runs on Fable,
  the most capable model.
