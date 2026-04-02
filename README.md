# DevGuard

AI-powered code review CLI with an Ink-based full-screen TUI.

## Quick Start

```bash
npm install
npm run build
npm link
```

## Environment

Create your local env file from the template:

```bash
cp .env.example .env
```

Set `DEVGUARD_PROVIDER`, `DEVGUARD_MODEL`, and the matching API key in `.env`.

## Usage

```bash
devguard
```

Direct CLI mode:

```bash
devguard review --json
devguard review --sarif
devguard review --agent security-scan
devguard init
devguard agents
devguard chat
```

## Groq Chatbot (can edit files)

The `chat` command uses Groq and can read/write files in your workspace through built-in tools.

```bash
devguard chat
```

Required in `.env`:

```bash
DEVGUARD_PROVIDER=groq
GROQ_API_KEY=your_key_here
```

## Testing

```bash
npx vitest run
```
