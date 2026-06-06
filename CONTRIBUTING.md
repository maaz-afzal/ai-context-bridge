# Contributing to AI Context Bridge

Thanks for taking the time to contribute. This document covers everything you need to get started — from reporting bugs to adding support for new AI platforms.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting a Pull Request](#submitting-a-pull-request)
- [Adding a New Platform](#adding-a-new-platform)
- [Coding Standards](#coding-standards)
- [Commit Message Format](#commit-message-format)

---

## Code of Conduct

Be respectful. Give constructive feedback. We're all here to build something useful together.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/ai-context-bridge.git
   cd ai-context-bridge
   ```
3. **Add the upstream remote** to stay in sync:
   ```bash
   git remote add upstream https://github.com/maaz-afzal/ai-context-bridge.git
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```

---

## Development Setup

```bash
npm run dev          # Start development build with hot reload
npm run build        # Production build → dist/
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run type-check   # TypeScript check (no emit)
```

**Loading the extension in Chrome:**

1. Run `npm run build`
2. Go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** → select the `dist/` folder
5. After making changes, run `npm run build` again and click the refresh icon on the extension card

---

## Project Structure

```
src/
├── background/       # Service worker — extension lifecycle, message passing
├── content/          # Scripts injected into AI platform pages
├── popup/            # React popup UI (components, store, styles)
├── extractors/       # Per-platform conversation extractors
├── injectors/        # Per-platform context injectors
├── services/         # Core logic: compression, history, platform detection
├── utils/            # Shared helpers: storage, downloads, shortcuts, etc.
└── types/            # Shared TypeScript types
```

Understanding this structure is important before opening a PR. If you're unsure where something belongs, open a discussion first.

---

## How to Contribute

### Reporting Bugs

Before opening an issue, search existing issues to avoid duplicates.

When filing a bug report, include:

- **What you were doing** — steps to reproduce
- **What you expected** — the intended behavior
- **What happened instead** — the actual behavior
- **Environment** — OS, Chrome version, extension version
- **Screenshots or console logs** — if applicable

Open a bug report → [GitHub Issues](https://github.com/maaz-afzal/ai-context-bridge/issues/new?template=bug_report.md)

---

### Suggesting Features

Use [GitHub Discussions](https://github.com/maaz-afzal/ai-context-bridge/discussions) for feature requests.

A good feature request answers:

- What problem does this solve?
- Who benefits from it?
- What would the user experience look like?
- Are there any alternative approaches?

---

### Submitting a Pull Request

1. **Sync with upstream** before starting:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a branch** with a descriptive name:
   ```bash
   git checkout -b feature/add-mistral-support
   git checkout -b fix/gemini-extractor-scroll
   git checkout -b chore/update-dependencies
   ```

3. **Make your changes** — keep commits focused and atomic

4. **Run checks before pushing:**
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

5. **Push your branch:**
   ```bash
   git push origin feature/your-branch-name
   ```

6. **Open a Pull Request** against `main` and fill out the PR template

**PR requirements:**
- Passes lint and type-check
- Builds successfully (`dist/` generated without errors)
- Description explains *what* changed and *why*
- Screenshots included for any UI changes
- No unrelated changes bundled in

---

## Adding a New Platform

This is the most common contribution. Here's the full process:

### 1. Create the Extractor

Create `src/extractors/newplatform.ts`:

```typescript
import type { ExtractedConversation, ChatMessage } from '../types';

export async function extractNewPlatform(): Promise<ExtractedConversation> {
  const messages: ChatMessage[] = [];

  // Query the DOM for conversation turns
  const turns = document.querySelectorAll('.your-message-selector');

  turns.forEach((turn) => {
    const role = turn.classList.contains('user-class') ? 'user' : 'assistant';
    const content = turn.querySelector('.content-selector')?.textContent?.trim() ?? '';

    if (content) {
      messages.push({ role, content });
    }
  });

  return {
    platform: 'NewPlatform',
    extractedAt: new Date().toISOString(),
    messages,
  };
}
```

Tips for writing extractors:
- Use `document.querySelectorAll` with stable, semantic selectors (avoid generated class names)
- Handle edge cases: empty messages, code blocks, multi-turn threads
- Test with conversations of varying lengths

### 2. Create the Injector

Create `src/injectors/newplatform.ts`:

```typescript
export function injectNewPlatform(text: string): boolean {
  const input = document.querySelector<HTMLElement>('.input-selector');

  if (!input) return false;

  // For contenteditable fields
  input.focus();
  document.execCommand('insertText', false, text);

  // For textarea elements
  // const textarea = input as HTMLTextAreaElement;
  // textarea.value = text;
  // textarea.dispatchEvent(new Event('input', { bubbles: true }));

  return true;
}
```

### 3. Register in Factories

In `src/services/extractorFactory.ts`, add to `extractorMap`:
```typescript
import { extractNewPlatform } from '../extractors/newplatform';

const extractorMap = {
  // ...existing entries
  newplatform: extractNewPlatform,
};
```

Do the same in `src/services/injectorFactory.ts`:
```typescript
import { injectNewPlatform } from '../injectors/newplatform';

const injectorMap = {
  // ...existing entries
  newplatform: injectNewPlatform,
};
```

### 4. Update Platform Detection

In `src/services/platformDetector.ts`, add the URL pattern:
```typescript
if (hostname.includes('newplatform.com')) return 'newplatform';
```

### 5. Update the README

Add the new platform to the **Supported Platforms** table in `README.md`.

---

## Coding Standards

- **TypeScript** for all source files — no `any` unless genuinely unavoidable
- **Functional components** with hooks for all React code
- **Descriptive names** — `extractConversationTurns()` over `extract()`
- **No console.log** in committed code — use `errorTracker` for logging
- **Comments** only where the *why* isn't obvious from the code itself
- Keep functions small and single-purpose

Run before every commit:
```bash
npm run lint && npm run type-check
```

---

## Commit Message Format

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature or platform support |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `chore` | Tooling, deps, config updates |
| `docs` | Documentation only |
| `style` | Formatting, no logic changes |

**Examples:**

```
feat(extractor): add Mistral platform support
fix(injector): handle contenteditable fields in Gemini
refactor(contextEngine): simplify balanced compression logic
docs: update contributing guide with platform examples
chore: bump vite to 5.2.0
```

---

## Questions?

Open a [discussion](https://github.com/maaz-afzal/ai-context-bridge/discussions) — happy to help you get started.
