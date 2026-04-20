# DevGuard System Design

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [AI Integration](#ai-integration)
5. [TUI Architecture](#tui-architecture)
6. [Rate Limit Resilience](#rate-limit-resilience)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

DevGuard follows a **layered microarchitecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Entry Point                      │
│              (Commander.js dispatcher)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌───────▼────────┐
│  TUI Layer     │   │  CLI Commands  │
│  (React/Ink)   │   │  (Direct I/O)  │
└───────┬────────┘   └───────┬────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Business Logic     │
        │  (Orchestration)    │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────┬──────────┬──────────┐
        │                     │          │          │
┌───────▼────┐    ┌──────────▼──┐  ┌────▼────┐ ┌──▼────────┐
│   Agents   │    │  Chatbot    │  │Providers│ │Config/Git │
│ (AI logic) │    │ (LLM tools) │  │(LangCh.)│ │Management│
└───────┬────┘    └──────────┬──┘  └────┬────┘ └──┬────────┘
        │                    │           │         │
        └────────────────────┴───────────┴─────────┘
                   │
        ┌──────────▼──────────┐
        │   Utility Modules   │
        │ (Chunker, Redact,   │
        │  Output formatters) │
        └─────────────────────┘
```

---

## Core Components

### 1. **CLI Layer** (`src/cli/`)
**Responsibility:** Command parsing and routing

**Files:**
- `index.ts` - Main CLI entry, command setup
- `init.ts` - Configuration initialization

**Flow:**
```
User input
    ↓
Commander.js parser
    ↓
Route to handler (review/chat/agents/init)
    ↓
Execute business logic
```

**Key Decisions:**
- Uses Commander.js for robust CLI parsing
- Supports both interactive (no args) and non-interactive (flags) modes
- Early env validation before execution

---

### 2. **TUI Layer** (`src/tui/`)
**Responsibility:** Full-screen interactive terminal interface using React

**Architecture:**
```
App.tsx (State management & screen router)
    ├── ReviewScreen (Initial scan trigger)
    ├── ResultsScreen (Findings display + folder/file mapping)
    ├── ChatScreen (Interactive chat with AI)
    ├── ConfigScreen (Settings management)
    └── AgentsScreen (Provider/agent selection)

Components/
    ├── Header (Title + info)
    ├── StatusBar (Footer status)
    ├── Prompt (User input field)
    ├── Menu (Navigation options)
    ├── Spinner (Animated loading)
    └── FindingCard (Issue display card)
```

**State Management:**
```typescript
interface AppState {
  screen: 'menu' | 'review' | 'results' | 'chat' | 'config' | 'agents'
  findings: Finding[]
  loading: boolean
  error?: string
  chatHistory: Message[]
}
```

**Key Decisions:**
- **React/Ink** chosen for mature, battle-tested TUI framework
- Non-blocking animations using `setInterval` without await
- Screen transitions via state updates (not complex routing)
- Keybinding handled at App root level for consistency

---

### 3. **Review Engine** (`src/agents/`)
**Responsibility:** Core code analysis logic

**Pipeline:**
```
Code Collection (git diff or project scan)
    ↓
Redaction (remove secrets)
    ↓
Chunking (split large files)
    ↓
AI Analysis (LLM review)
    ↓
Deduplication (remove duplicates)
    ↓
Normalization (consistent format)
    ↓
Return findings
```

**Key Files:**
- `runner.ts` - Orchestrates the review pipeline with resilience
- `base.ts` - Base agent class for consistency
- `*-agent.ts` - Specific review agents (security, performance, etc.)
- `concurrent-runner.ts` - Runs multiple agents in parallel

**Resilience Strategy:**
```
Try AI review
    ├─ Success? → Return findings
    └─ 429 rate limit?
        ├─ Retry with fallback model
        ├─ Success? → Return findings
        └─ Still failed?
            └─ Fall back to static agents
```

---

### 4. **Chatbot Engine** (`src/chatbot/`)
**Responsibility:** Interactive AI assistant with file manipulation

**Architecture:**
```
User message
    ↓
Chat agent (LangChain)
    ├─ Analyzes message
    ├─ Decides tools needed
    └─ Loops until done
        ├─ read_file tool → Fetch code
        ├─ write_file tool → Edit code
        ├─ list_files tool → Browse workspace
        └─ text response
    ↓
Display with animations
```

**Tool Definitions:**
```typescript
Tools:
  - read_file(path: string) → string
  - write_file(path: string, content: string) → string
  - list_files(dir?: string) → string[]
```

**Key Decisions:**
- Uses LangChain's `StructuredOutputParser` for reliable tool invocation
- Tools are workspace-sandboxed (no access outside project root)
- Non-blocking animations fire during tool execution
- Conversation history persisted in memory for context

---

### 5. **Provider Abstraction** (`src/providers/`)
**Responsibility:** Unified interface to different LLM providers

**Supported Providers:**
| Provider | Model | Speed | Cost | Free Tier |
|----------|-------|-------|------|-----------|
| Groq | llama-3.3-70b-versatile | 🚀🚀🚀 | $$ | ✅ 100k TPD |
| Anthropic | claude-3-sonnet-20240229 | 🚀🚀 | $$ | ❌ |
| Google | gemini-1.5-flash | 🚀🚀 | $ | ✅ Limited |

**Interface:**
```typescript
interface ProviderModel {
  invoke(prompt: string): Promise<string>
  invokeWithTools(prompt: string, tools: Tool[]): Promise<AgentAction>
  name: string
}
```

**Selection Logic:**
```
1. Check DEVGUARD_PROVIDER env var
2. Check .devguardrc provider field
3. Default to 'groq'
```

---

## Data Flow

### Review Flow (End-to-End)

```
User: devguard review
    │
    ├─ Load config (.env + .devguardrc)
    ├─ Detect provider (Groq/Anthropic/Gemini)
    ├─ Collect code
    │   ├─ Check if git repo
    │   ├─ Yes? → git diff --no-color
    │   └─ No? → Scan project files (*.ts/*.js/*.tsx)
    │
    ├─ Redact sensitive data
    │   └─ Remove: secrets/, .env, private/
    │
    ├─ Chunk code (max 10KB per chunk)
    │   └─ Keep function boundaries intact
    │
    ├─ Send to AI (with retry logic)
    │   ├─ Tier 1: Primary model
    │   ├─ Tier 2: Fallback model (429)
    │   └─ Tier 3: Static agents (all AI failed)
    │
    ├─ Parse findings
    │   └─ Extract: rule, severity, file, line, message
    │
    ├─ Dedup findings
    │   └─ Remove exact duplicates
    │
    ├─ Normalize
    │   └─ Group by folder/file
    │
    └─ Output
        ├─ TUI: Pretty display + animations
        ├─ CLI: JSON/SARIF/pretty-print
        └─ Findings: [{ rule, severity, file, line, message }]
```

### Chat Flow (End-to-End)

```
User: devguard chat
    │
    ├─ Load config + Groq client
    ├─ Initialize chat history []
    │
    └─ While not exit:
        ├─ Read user input
        ├─ Add to history
        ├─ Call LangChain agent
        │   ├─ Agent analyzes message
        │   ├─ Decides tools: read_file | write_file | list_files
        │   ├─ Execute tools (with animations)
        │   ├─ Parse response
        │   └─ Loop until no more tools
        ├─ Display AI response
        ├─ Add to history
        └─ Prompt for next message
```

---

## AI Integration

### Prompt Engineering

**Review Prompt Template:**
```
You are a code review expert. Analyze this code for:
- Security vulnerabilities
- Performance bottlenecks
- Code quality issues
- Type safety problems
- Best practice violations

Code:
[CHUNKED_CODE]

Return findings as JSON:
{
  "findings": [
    {
      "rule": "string",
      "severity": "high|medium|low",
      "file": "src/file.ts",
      "line": 42,
      "message": "string"
    }
  ]
}
```

**Chat System Prompt:**
```
You are DevGuard, an AI code assistant. Help developers:
1. Understand code review findings
2. Fix issues in their code
3. Improve code quality

You have tools to read/write/list files.
Always explain your changes.
```

### Token Optimization

- Chunk size: 10KB max (balance between context and tokens)
- Redaction: Remove unnecessary files (secrets, node_modules)
- Parallel agents: Run 5 agents concurrently to maximize throughput
- Fallback: Use cheaper models on rate limits

---

## TUI Architecture

### State Flow

```
AppState
    ├─ screen: Current active screen
    ├─ findings: Array of findings from last review
    ├─ loading: Boolean for spinner display
    ├─ error: String for error messages
    └─ chatHistory: Array of { role, content } messages

Key Transitions:
menu → review → results → chat → results → menu
```

### Keybinding System

```
Global (always available):
  q / Ctrl+C → Quit
  Ctrl+h     → Help

Screen-specific:
  ReviewScreen:
    Enter → Start review (set loading=true)
  
  ResultsScreen:
    Up/Down → Scroll findings
    Enter   → Open chat
    Esc     → Back to menu
  
  ChatScreen:
    Enter   → Send message
    Esc     → Back to results
```

### Component Isolation

Each screen is a pure component:
```typescript
interface ScreenProps {
  findings: Finding[]
  loading: boolean
  onNavigate: (screen: Screen) => void
  onFindingsUpdate: (findings: Finding[]) => void
}
```

---

## Rate Limit Resilience

### 3-Tier Fallback Strategy

**Tier 1: Primary Model**
```
POST /api/chat/completions
Model: llama-3.3-70b-versatile
Max tokens: 2000
```

**Tier 2: Fallback Model (on 429)**
```
POST /api/chat/completions
Model: llama-3.1-8b-instant
Max tokens: 1000
Chunk count: 50% of original
```

**Tier 3: Static Agents (all AI failed)**
```
Use heuristic pattern matchers:
- TODO/FIXME detection
- console.log finder
- Nested loop detector
- Type safety checker
```

### Implementation

```typescript
async function reviewWithResilience(code: string) {
  try {
    // Tier 1
    return await aiReview(code, primaryModel)
  } catch (err) {
    if (err.status === 429) {
      try {
        // Tier 2
        return await aiReview(
          reduceChunks(code, 0.5),
          fallbackModel
        )
      } catch {
        // Tier 3
        return staticAgentsReview(code)
      }
    }
    throw err
  }
}
```

---

## Security Considerations

### 1. **Secret Redaction**
```
Patterns redacted before sending to AI:
- API keys: sk-*, gsk_*
- Passwords: password=*
- Tokens: token=*
- Secrets in common paths: ./secrets/*, .env*
```

### 2. **Workspace Isolation**
```
File operations are sandboxed:
- resolveWorkspacePath() ensures no ../ escapes
- Only allows reads/writes within project root
- Prevents access to system files
```

### 3. **API Key Management**
```
- Keys loaded only from .env
- Never logged or displayed
- Passed directly to LangChain providers
- `.env` added to .gitignore
```

### 4. **Code Handling**
```
- Code kept in memory only during review
- Not persisted to disk
- Not logged except in error contexts
- AI processing respects local privacy
```

---

## Performance Optimization

### 1. **Parallel Agent Execution**
```typescript
// Run 5 agents concurrently instead of sequentially
const findings = await Promise.all([
  securityAgent.run(code),
  performanceAgent.run(code),
  errorProneAgent.run(code),
  // ...
])
```

**Benefit:** 5x faster than sequential (when TPD allows)

### 2. **Smart Chunking**
```
Algorithm:
1. Split file at function boundaries (not mid-function)
2. Keep chunks under 10KB
3. Preserve line numbers for mapping

Benefit: Better AI context preservation
```

### 3. **Deduplication**
```
Strategy:
- Hash findings (rule + file + line)
- Keep first occurrence
- Remove duplicates from parallel agents

Benefit: Reduce noise and redundant findings
```

### 4. **Lazy Loading**
```
TUI optimizations:
- Don't render all findings at once
- Render visible window + 1 page buffer
- Re-render only on scroll/state change
```

### 5. **Non-Blocking Animations**
```
Don't await animations:
setInterval(() => updateSpinner(), 100)
// Continue execution immediately
```

---

## Extension Points

### Adding a New Provider

1. Create `src/providers/new-provider.ts`:
```typescript
export class NewProviderModel implements ProviderModel {
  async invoke(prompt: string) {
    // Implementation
  }
  async invokeWithTools(prompt: string, tools: Tool[]) {
    // Implementation
  }
}
```

2. Register in `src/providers/index.ts`:
```typescript
case 'new-provider':
  return new NewProviderModel(apiKey)
```

### Adding a New Agent

1. Create `src/agents/new-agent.ts`:
```typescript
export class NewAgent extends BaseAgent {
  async run(code: string): Promise<Finding[]> {
    // Implementation
  }
}
```

2. Register in `src/agents/runner.ts`:
```typescript
agents.push(new NewAgent())
```

### Adding a New Output Format

1. Create `src/output/new-format.ts`:
```typescript
export function formatNewFormat(findings: Finding[]): string {
  // Implementation
}
```

2. Register in `src/output/index.ts`

---

## Testing Strategy

### Test Coverage

| Module | Coverage | Type |
|--------|----------|------|
| Git integration | 100% | Unit |
| Config loader | 100% | Unit |
| Chunker | 100% | Unit |
| Redaction | 100% | Unit |
| Providers | 80% | Integration |
| Agents | 90% | Unit + Integration |
| Output formatters | 100% | Unit |

### Test Patterns

```typescript
// Unit: Isolated logic
describe('chunker', () => {
  it('splits code at function boundaries', () => {
    const result = chunk(code, 10)
    expect(result).toHaveLength(2)
  })
})

// Integration: With mocks
describe('runner', () => {
  it('retries on 429', async () => {
    mockProvider.throwsOnce(429)
    const result = await reviewWithResilience(code)
    expect(result).toBeDefined()
  })
})
```

---

## Deployment

### Local Development
```bash
npm install
npm run build
npm link
devguard
```

### Global Installation (Future)
```bash
npm install -g devguard
devguard
```

### CI/CD Integration
```bash
devguard review --json | jq '.findings[] | select(.severity == "high")'
```

---

## Future Enhancements

- [ ] Plugin system for custom agents
- [ ] Database for finding history
- [ ] Web dashboard for team reviews
- [ ] GitHub/GitLab integration
- [ ] VSCode extension
- [ ] Pre-commit hook support
- [ ] Multi-file diff analysis
- [ ] Finding suppression rules

---

**Last Updated:** April 20, 2026  
**Status:** MVP Complete
