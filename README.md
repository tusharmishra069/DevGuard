# DevGuard 🔍

**AI-powered code review CLI with interactive full-screen TUI and intelligent chatbot**

DevGuard automates code review using AI providers (Groq, Anthropic, Google Gemini) with a beautiful terminal UI. Get instant feedback on security, performance, and code quality issues, then chat with an AI assistant to fix them directly.

## Features

✨ **Interactive TUI Interface**
- Full-screen terminal UI with rich components
- Real-time review results with folder/file issue mapping
- Config and agent management screens
- Smooth keybinding navigation

🤖 **AI-Powered Code Review**
- Multi-provider support (Groq, Anthropic, Google Gemini)
- Intelligent issue detection and categorization
- Fallback resilience (3-tier failover on rate limits)
- Git diff or project file scanning

💬 **Interactive Chatbot**
- Chat about findings directly in TUI or CLI
- File read/write/list tools for hands-on fixes
- Non-blocking animations and status indicators
- Real-time code editing through AI

📊 **Multiple Output Formats**
- Interactive TUI view
- JSON structured output
- SARIF for IDE integration
- Terminal pretty-printing

## Screenshot

![DevGuard TUI](./public/Screenshot%202026-04-02%20at%206.30.56%20PM.png)

---

## Getting Started

### Installation

```bash
# Clone and install
git clone <repo-url>
cd devguard
npm install

# Build and link globally
npm run build
npm link
```

### Configuration

Create `.env` from the template:

```bash
cp .env.example .env
```

Then set your provider and API key:

```bash
# .env
DEVGUARD_PROVIDER=groq
DEVGUARD_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your_api_key_here
```

**Supported Providers:**
- `groq` - Groq Cloud (fast, free tier available)
- `anthropic` - Claude (requires `ANTHROPIC_API_KEY`)
- `gemini` - Google Gemini (requires `GOOGLE_API_KEY`)

### Quick Start

Launch the interactive TUI:

```bash
devguard
```

Then:
1. Press **Enter** → Start review
2. Wait for AI analysis
3. Review findings with folder/file issue maps
4. Press **Enter** on results → Chat with AI
5. Ask AI to fix issues or explain findings

---

## Usage

### Interactive TUI (Default)

```bash
devguard
```

Navigate with:
- **Up/Down arrows** - Scroll through findings
- **Enter** - Start review or open chat
- **Esc** - Back to previous screen
- **q** - Quit
- **Ctrl+h** - Show help

### Direct CLI Commands

Review code (interactive TUI):
```bash
devguard review
```

Review with output formats:
```bash
devguard review --json    # JSON structured output
devguard review --sarif   # SARIF for IDE tools
```

Run specific agents:
```bash
devguard review --agent security-scan
devguard review --agent performance-check
devguard review --agent error-prone
```

Initialize config:
```bash
devguard init
```

List available agents:
```bash
devguard agents
```

Interactive chatbot (CLI mode):
```bash
devguard chat
```

### Chatbot Features

The `chat` command provides an interactive AI assistant that can:
- **Read files** - Analyze code context
- **Write files** - Make code changes
- **List files** - Explore your workspace
- **Fix issues** - Apply AI-suggested fixes directly

Example:
```bash
devguard chat
you> Fix the authentication logic in src/auth.ts

✨ Creating: src/auth.ts
✅ Done: src/auth.ts

devguard> I've improved the authentication system with...
```

---

## Configuration

Edit `.devguardrc` to customize behavior:

```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "agents": ["security-scan", "performance-check", "error-prone"],
  "redactPaths": ["secrets/", "private/"]
}
```

**Override via environment:**
```bash
export DEVGUARD_PROVIDER=anthropic
export DEVGUARD_MODEL=claude-3-sonnet-20240229
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## Testing

Run the test suite:

```bash
npx vitest run
```

Run with coverage:

```bash
npx vitest run --coverage
```

---

## How It Works

1. **Code Collection** - Git diff or project file scan
2. **Redaction** - Remove secrets and sensitive paths
3. **Chunking** - Split large files intelligently
4. **AI Analysis** - Send to provider model
5. **Deduplication** - Remove duplicate findings
6. **Presentation** - Display in TUI or export

### Rate Limit Handling

If you hit provider rate limits:
- **Tier 1** - Retry with primary model
- **Tier 2** - Switch to fallback model (reduced chunks)
- **Tier 3** - Fall back to static agents (no AI needed)

---

## Architecture

```
src/
├── cli/              # Command dispatcher
├── tui/              # Full-screen TUI (React/Ink)
├── agents/           # Review logic (AI + static)
├── chatbot/          # Interactive chat engine
├── providers/        # LLM provider abstraction
├── config/           # Configuration loader
├── git/              # Git integration
├── chunker/          # Code splitting logic
├── security/         # Path redaction
└── output/           # Formatters (JSON, SARIF)
```

---

## Stack

- **Runtime** - Node.js 24+
- **Language** - TypeScript 5.9
- **TUI** - React 18.3 + Ink 5.2
- **LLM** - LangChain
- **CLI** - Commander.js
- **Testing** - Vitest
- **Config** - Zod

---

## Environment Variables

```bash
# Provider selection
DEVGUARD_PROVIDER=groq|anthropic|gemini
DEVGUARD_MODEL=<model-name>

# API Keys
GROQ_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
GOOGLE_API_KEY=<your-key>
```

---

## Troubleshooting

**"Missing GROQ_API_KEY"**
```bash
# Set in .env or export
export GROQ_API_KEY=gsk_...
```

**Review returns empty findings**
- Check you're in a git repo or have project files
- Ensure excluded dirs (node_modules, .git) aren't blocking scans

**Chatbot not editing files**
- Verify GROQ_API_KEY is set
- Check file paths are relative to workspace root
- Ensure write permissions on target files

---

## License

MIT

---

## Contributing

Contributions welcome! Submit issues and PRs.

---

**Built with ❤️ for developers who want smarter code reviews**
