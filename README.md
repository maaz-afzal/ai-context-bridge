<div align="center">

<img src="public/icons/icon128.png" alt="AI Context Bridge" width="80" height="80">

# AI Context Bridge

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)](https://github.com/maaz-afzal/ai-context-bridge/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-orange.svg?style=flat-square&logo=google-chrome)](chrome://extensions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Extract, compress, and transfer conversations across AI platforms — effortlessly.**

[Features](#-features) · [Installation](#-installation) · [Usage](#-usage) · [Architecture](#-architecture) · [Contributing](#-contributing)

</div>

---

## Overview

AI Context Bridge is a Chrome extension that solves a real problem: **losing your context when switching between AI platforms.**

Whether you're moving from Claude to ChatGPT, saving an important research session, or continuing a conversation on a different model — this extension extracts your full conversation, compresses it intelligently, and injects it wherever you need it next. No copy-pasting. No lost context.

---

## Supported Platforms

| Platform | Extract | Inject |
|----------|:-------:|:------:|
| ChatGPT | ✅ | ✅ |
| Claude | ✅ | ✅ |
| Gemini | ✅ | ✅ |
| Grok | ✅ | ✅ |
| Perplexity | ✅ | ✅ |
| DeepSeek | ✅ | ✅ |

---

## Features

### Core Functionality

- **Extract Conversations** — Capture entire conversation threads from any supported platform with a single click
- **Smart Compression** — Three compression modes to fit your use case (details below)
- **Context Injection** — Paste extracted conversations directly into any AI platform's input field
- **Multi-Format Export** — Download as JSON, Markdown, Plaintext, PDF, or a ready-to-use Continuation Prompt
- **Conversation History** — Save, search, and manage up to 50 past conversations
- **Keyboard Shortcuts** — Full keyboard control for power users

### Compression Modes

| Mode | What It Does | Best For |
|------|-------------|----------|
| **Exact** | Full conversation, nothing removed | Backups, legal or audit purposes |
| **Balanced** | Removes duplicates, preserves all context | Everyday use and injection |
| **Aggressive** | Smart summary with key points extracted | Quick overviews, token-limited models |

### Export Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| JSON | `.json` | Data backup, programmatic processing |
| Markdown | `.md` | Notes, documentation, readable format |
| Plaintext | `.txt` | Simple portable text |
| PDF | `.pdf` | Printing, sharing, submission |
| Continuation Prompt | `.txt` | AI-ready context for seamless continuation |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | Extract current conversation |
| `Ctrl+Shift+I` | Inject context into current chat |
| `Ctrl+Shift+H` | Open conversation history |
| `Ctrl+Shift+C` | Copy conversation to clipboard |
| `Ctrl+Shift+S` | Save current conversation |
| `Ctrl+Shift+D` | Clear current conversation |
| `Ctrl+Shift+K` | Show shortcuts reference |
| `Ctrl+Enter` | Submit message in chat |

> **Tip:** Customize any shortcut at `chrome://extensions/shortcuts`

---

## Installation

### Manual Installation (Developer Mode)

```bash
git clone https://github.com/maaz-afzal/ai-context-bridge.git
cd ai-context-bridge
npm install
npm run build
```

Then load in Chrome:

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Chrome Web Store

> Coming soon — submission in progress.

---

## Usage

### Extract a Conversation

1. Open any supported AI platform with an active conversation
2. Click the **AI Context Bridge** icon in your toolbar
3. Choose a compression mode
4. Click **Extract Conversation**
5. View stats: message count, token estimate, compression ratio

### Inject into Another Platform

1. Open the target AI platform
2. Click the extension icon
3. Make sure a conversation is loaded (extracted or from history)
4. Click **Inject Context** — it pastes directly into the input field

### Download or Copy

After extracting, click any format button (JSON / Markdown / Plaintext / PDF) to download immediately, or hit **Copy** to send it to your clipboard.

### Manage History

- Click **History** in the extension header
- Browse, search, or filter past conversations by title, platform, or content
- Click any entry to reload it
- Delete individual entries or clear everything at once

---

## Architecture

```
ai-context-bridge/
├── src/
│   ├── background/          # Chrome service worker (extension lifecycle)
│   ├── content/             # Content scripts injected into AI platform pages
│   ├── popup/               # Extension popup UI
│   │   ├── components/      # React components
│   │   │   ├── DownloadDialog.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── HistorySkeleton.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ShortcutsHelp.tsx
│   │   │   └── ToastContainer.tsx
│   │   ├── App.tsx
│   │   ├── store.ts         # Zustand global state
│   │   └── main.tsx
│   ├── extractors/          # Per-platform conversation extractors
│   │   ├── chatgpt.ts
│   │   ├── claude.ts
│   │   ├── deepseek.ts
│   │   ├── gemini.ts
│   │   ├── grok.ts
│   │   └── perplexity.ts
│   ├── injectors/           # Per-platform context injectors
│   │   ├── chatgpt.ts
│   │   ├── claude.ts
│   │   ├── deepseek.ts
│   │   ├── gemini.ts
│   │   ├── grok.ts
│   │   └── perplexity.ts
│   ├── services/            # Core business logic
│   │   ├── batchProcessor.ts
│   │   ├── contextEngine.ts
│   │   ├── extractorFactory.ts
│   │   ├── formatPreserver.ts
│   │   ├── historyService.ts
│   │   ├── injectorFactory.ts
│   │   └── platformDetector.ts
│   ├── utils/               # Shared utilities
│   │   ├── db.ts
│   │   ├── domObserver.ts
│   │   ├── downloadExport.ts
│   │   ├── errorTracker.ts
│   │   ├── sanitizer.ts
│   │   ├── shortcuts.ts
│   │   ├── storage.ts
│   │   └── tokenCounter.ts
│   └── types/
│       └── index.ts
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── dist/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### How It Works

Each supported platform has a dedicated **extractor** and **injector**. The `extractorFactory` and `injectorFactory` route to the right implementation based on the current URL, detected by `platformDetector`. The `contextEngine` handles compression and formatting. State lives in Zustand, history is persisted via IndexedDB.

To add a new platform:

1. Create `src/extractors/newplatform.ts` — implement `extractConversation()`
2. Create `src/injectors/newplatform.ts` — implement `injectContext(text)`
3. Register both in `extractorFactory.ts` and `injectorFactory.ts`
4. Add URL pattern to `platformDetector.ts`

---

## Development

### Prerequisites

- Node.js v18+
- npm v9+

### Commands

```bash
npm run dev          # Development build with hot reload
npm run build        # Production build → dist/
npm run lint         # ESLint
npm run format       # Prettier
npm run type-check   # TypeScript check without emitting
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Extension not responding | Refresh the page and wait for full load |
| Content script not loading | Wait 2–3 seconds after page load, then retry |
| Injection not working | Confirm you're on a supported platform |
| Shortcuts not triggering | Check `chrome://extensions/shortcuts` for conflicts |
| PDF export failing | Make sure a PDF viewer is installed |
| Build errors | Delete `node_modules/` and run `npm install` again |
| Duplicate history entries | Fixed in v1.0.0 — update the extension |

For bugs or questions, open an [issue](https://github.com/maaz-afzal/ai-context-bridge/issues) or start a [discussion](https://github.com/maaz-afzal/ai-context-bridge/discussions).

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

The short version:

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run `npm run lint` and `npm run type-check`
5. Commit and push
6. Open a Pull Request

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [TypeScript 5.9](https://www.typescriptlang.org) | Type-safe codebase |
| [React 18](https://reactjs.org) | Popup UI |
| [Zustand](https://zustand-demo.pmnd.rs) | State management |
| [Vite + CRXJS](https://crxjs.dev/vite-plugin) | Extension bundling |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Persistent history storage |

---

## License

MIT — see [LICENSE](LICENSE) for full terms.

---

<div align="center">

Built by [Maaz Afzal](https://github.com/maaz-afzal) · [Report a Bug](https://github.com/maaz-afzal/ai-context-bridge/issues) · [Request a Feature](https://github.com/maaz-afzal/ai-context-bridge/discussions)

</div>
