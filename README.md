<div align="center">

# Noterx

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/Build-passing-brightgreen)](https://github.com/jxngrx/notes_apps)
[![Last commit](https://img.shields.io/github/last-commit/jxngrx/notes_apps)](https://github.com/jxngrx/notes_apps/commits/main)
[![Stars](https://img.shields.io/github/stars/jxngrx/notes_apps?style=social)](https://github.com/jxngrx/notes_apps/stargazers)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js%2016-black?logo=next.js)](https://nextjs.org/)

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=DM+Sans&weight=500&size=22&duration=4000&pause=1200&color=1A1A1A&center=true&vCenter=true&width=520&lines=Capture+ideas.+Organize+work.+Stay+in+flow.)](https://github.com/jxngrx/notes_apps)

<!-- TODO: replace with actual demo GIF/screenshot -->
![Noterx demo placeholder](https://placehold.co/1200x640/1C1C1A/F0EDE8?text=Noterx+Demo+Screenshot+Coming+Soon)

*A fast, local-first productivity workspace — sticky notes, rich pages, drawings, kanban todos, and world clocks in one app.*

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

Noterx is a multi-mode productivity app. All workspace data stays in your browser (`localStorage` / IndexedDB) unless you export it.

### Sticky Notes

Infinite canvas with pan/zoom, draggable resizable notes, pastel color picker, pinning, and JSON export/import.

<!-- TODO: replace with sticky notes screenshot -->
![Sticky notes placeholder](https://placehold.co/800x450/F5F4F0/1A1A1A?text=Sticky+Notes+Mode)

### Pages

TipTap-powered rich text editor with slash commands, callouts, code blocks, tables, task lists, link previews, notebook view, per-page fonts/icons, and auto-titled pages.

<!-- TODO: replace with pages editor screenshot -->
![Pages editor placeholder](https://placehold.co/800x450/FFFFFF/1A1A1A?text=Pages+Editor)

### Area (Drawings)

Excalidraw-based whiteboard mode with multiple scenes, autosave, and JSON export/import.

<!-- TODO: replace with area mode screenshot -->
![Area mode placeholder](https://placehold.co/800x450/111110/F0EDE8?text=Area+%2F+Excalidraw)

### Todo (Kanban)

Drag-and-drop kanban board with customizable columns, recycle bin, list management, celebration effects, and optional custom completion/move sounds (IndexedDB).

<!-- TODO: replace with todo kanban screenshot -->
![Todo kanban placeholder](https://placehold.co/800x450/EDECEA/1A1A1A?text=Todo+Kanban)

### World Time & Pomodoro

Interactive 3D globe (amCharts) for picking countries/timezones, floating clock widgets, focus view, and a built-in Pomodoro timer with customizable durations.

<!-- TODO: replace with world time screenshot -->
![World time placeholder](https://placehold.co/800x450/242422/F0EDE8?text=World+Time+%2B+Pomodoro)

### Appearance & Personalization

- Light/dark theme presets (Noterx, Monkeytype-inspired palettes, and more)
- Custom typography (primary + mono secondary fonts)
- Photo, gradient, and custom wallpaper backgrounds with contrast-aware UI tokens
- Magnetic navigation dock with per-mode shortcuts
- Optional eye-tracking decorative widget

<!-- TODO: replace with settings/themes screenshot -->
![Settings placeholder](https://placehold.co/800x450/1C1C1A/F0EDE8?text=Themes+%26+Settings)

### Data portability

Per-mode JSON export/import from **Settings → Data** (sticky notes, pages, area scenes, todos).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| UI | [React 19](https://react.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| State | [Zustand](https://zustand.docs.pmnd.rs/) |
| Rich text | [TipTap](https://tiptap.dev/) |
| Drawings | [Excalidraw](https://excalidraw.com/) |
| Globe / maps | [amCharts 5](https://www.amcharts.com/) |
| Drag & drop | [@dnd-kit](https://dndkit.com/) |
| Animation | [Motion](https://motion.dev/) |
| Icons | [Lucide](https://lucide.dev/) |
| Analytics | [@vercel/analytics](https://vercel.com/docs/analytics) (on Vercel deploys) |
| Linting | ESLint + `eslint-config-next` |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **Yarn** 1.x (project uses `yarn.lock`)

### 1. Clone

```bash
git clone https://github.com/jxngrx/notes_apps.git
cd notes_apps
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your public site URL (required for metadata and Open Graph):

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example.com/
```

> Include the scheme (`https://`) and a trailing slash.

### 4. Run the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Production build

```bash
yarn build
yarn start
```

<details>
<summary><strong>Troubleshooting</strong></summary>

**Build fails: `NEXT_PUBLIC_SITE_URL is required`**

Copy `.env.example` → `.env.local` and set the variable before running `yarn build`.

**Notes not persisting**

Ensure browser `localStorage` is enabled (DevTools → Application → Local Storage).

**Import fails**

Exports must be valid JSON from Noterx's export action for that mode.

</details>

---

## Project Structure

```
notes_apps/
├── app/                    # Next.js App Router (layout, page, API routes)
│   ├── api/
│   │   ├── link-preview/   # Server-side OG metadata fetch (SSRF-protected)
│   │   └── location/       # IP-based timezone lookup for world clocks
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Main shell — mode switching
│   └── globals.css         # Global styles + mode-specific CSS
├── components/
│   ├── pages/              # TipTap editor, slash menu, notebook view
│   ├── pomodoro/           # Pomodoro timer UI
│   ├── settings/           # Settings modal panels
│   ├── world-time/         # Globe picker, clock cards, focus view
│   ├── ui/                 # Shared UI (dock, scroll area, eye widget)
│   ├── canvas.tsx          # Sticky notes infinite canvas
│   ├── todo-kanban-board.tsx
│   └── ...
├── hooks/                  # React hooks (navigation, fonts, location)
├── lib/                    # Zustand stores, utilities, theme presets
├── public/                 # Static assets (SVG icons)
├── THIRD_PARTY_LICENSES/   # Third-party license files (e.g. amCharts)
├── .env.example            # Required environment variable template
├── package.json
├── README.md
└── CONTRIBUTING.md
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | **Yes** (local) / Optional (Vercel) | Public canonical URL for metadata, Open Graph, and `metadataBase`. Example: `https://noterx.example.com/`. On Vercel, falls back to `VERCEL_PROJECT_PRODUCTION_URL` or `VERCEL_URL` when unset. Required for local `yarn build` / `yarn dev`. |

No other environment variables are used in the current codebase.

---

## Roadmap

- [x] Multi-mode workspace (sticky notes, pages, area, todo, world time)
- [x] Local-first persistence (`localStorage` + IndexedDB)
- [x] Per-mode JSON export/import
- [x] Custom themes, typography, and wallpapers
- [x] Link preview cards in Pages editor
- [x] Kanban todo with column management
- [x] SSRF protection on link-preview API
- [ ] Full-text search across notes and pages
- [ ] Keyboard shortcut reference in-app (expanded)
- [ ] Mobile layout polish
- [ ] CI pipeline (lint + build on PRs)
- [ ] Privacy policy page (analytics + IP geolocation disclosure)
- [ ] Cloud sync with authentication *(speculative)*
- [ ] Real-time collaboration *(speculative)*

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branch naming, commit style, and PR guidelines.

---

## License

[MIT](LICENSE) — see [LICENSE](LICENSE) for details.

Third-party licenses (including [amCharts 5 linkware terms](THIRD_PARTY_LICENSES/amcharts5-LICENSE.txt)) are in `THIRD_PARTY_LICENSES/`.
