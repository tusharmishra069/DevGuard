# DevGuard — Build Checklist

## Phase 1 — Project Bootstrap
- [ ] Initialize `package.json` (ESM, bin entry)
- [ ] Create `tsconfig.json` (NodeNext, strict, jsx: react-jsx)
- [ ] Install all dependencies (Ink, LangChain, Commander, etc.)

## Phase 2 — TUI Layer ⭐
- [ ] `src/tui/index.tsx` — entry, Ink `render(<App />)`
- [ ] `src/tui/App.tsx` — screen router + global keybindings
- [ ] `src/tui/screens/SplashScreen.tsx` — ASCII art banner, "Press Enter"
- [ ] `src/tui/screens/HomeScreen.tsx` — tips + prompt + menu
- [ ] `src/tui/screens/ReviewScreen.tsx` — review config → run agents
- [ ] `src/tui/screens/AgentsScreen.tsx` — toggle agents on/off
- [ ] `src/tui/screens/ConfigScreen.tsx` — view/edit .devguardrc
- [ ] `src/tui/screens/ResultsScreen.tsx` — scrollable findings
- [ ] `src/tui/screens/HelpOverlay.tsx` — keybinding reference
- [ ] `src/tui/components/Header.tsx` — branded top bar
- [ ] `src/tui/components/StatusBar.tsx` — CWD, model, mode
- [ ] `src/tui/components/Prompt.tsx` — `>` input prompt
- [ ] `src/tui/components/FindingCard.tsx` — severity badges
- [ ] `src/tui/components/Menu.tsx` — arrow-key navigable menu
- [ ] `src/tui/components/Spinner.tsx` — animated spinner

## Phase 3 — Core Modules
- [ ] `src/config/schema.ts` — Zod config schema
- [ ] `src/config/loader.ts` — `.devguardrc` loader
- [ ] `src/git/diff.ts` — git diff extraction
- [ ] `src/chunker/index.ts` — diff text splitter
- [ ] `src/security/redact.ts` — secret redaction

## Phase 4 — AI Providers
- [ ] `src/providers/anthropic.ts`
- [ ] `src/providers/gemini.ts`
- [ ] `src/providers/groq.ts`
- [ ] `src/providers/index.ts` — factory

## Phase 5 — Review Agents
- [ ] `src/agents/types.ts` — Finding schema
- [ ] `src/agents/base.ts` — agent chain builder
- [ ] `src/agents/bug-hunter.ts`
- [ ] `src/agents/security-scan.ts`
- [ ] `src/agents/performance-check.ts`
- [ ] `src/agents/style-guide.ts`
- [ ] `src/agents/test-coverage.ts`
- [ ] `src/agents/runner.ts` — concurrent runner + dedup

## Phase 6 — Output Renderers
- [ ] `src/output/terminal.ts` — chalk + cli-table3
- [ ] `src/output/json.ts`
- [ ] `src/output/sarif.ts` — SARIF 2.1.0
- [ ] `src/output/interactive.ts` — fix application prompts

## Phase 7 — CLI Entry
- [ ] `src/cli/index.ts` — Commander (no args → TUI, else direct)
- [ ] `src/cli/init.ts` — writes `.devguardrc`

## Phase 8 — Tests & Verify
- [ ] Unit tests for git, config, chunker, output, security, agents
- [ ] `npx vitest run` — all green
- [ ] `npm run build` — clean compile
- [ ] Smoke test: `devguard` opens TUI, `devguard review --json` works
