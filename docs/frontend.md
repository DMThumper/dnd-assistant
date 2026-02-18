# Frontend

## Tech Stack

- **Next.js 16** — Turbopack, React Compiler
- **React 19** — Server Components
- **Tailwind CSS 4** — CSS-first config (`@theme`)
- **shadcn/ui** — Radix-based components
- **TypeScript 5** — strict mode

## Key Packages

- `next-intl` — i18n with locale-based routing
- `@radix-ui/*` — Headless UI (shadcn/ui)
- `framer-motion` — Animations
- `@tanstack/react-table` — DataTables
- `howler.js` — Audio для Display client
- `laravel-echo` + `pusher-js` — WebSocket
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `@xyflow/react` — Редактор дерева сцен
- `@dnd-kit/core` — Drag & drop
- `react-hook-form` + `zod` — Forms

## i18n

- Locale: только `ru` сейчас
- Route structure: `[locale]/(group)/page`
- Translations: `apps/web/messages/ru.json`
- NEVER hardcode text — всегда `useTranslations()` hook

## UI Patterns

### Color Palette

```css
--primary: #8B0000;        /* Deep Red */
--secondary: #C9A94E;      /* Gold */
--background: #1a1a2e;     /* Dark Navy */
--surface: #16213e;        /* Darker Blue */
--text: #e0e0e0;           /* Light Gray */
--text-muted: #8892a4;
--success: #48c715;
--danger: #dc2626;
--warning: #f59e0b;
--info: #3b82f6;
```

### Design Principles

- Dark theme by default
- Display client — fullscreen, НОЛЬ UI элементов
- Player client — **mobile-first**, компактный
- DM client — **desktop-first**, много информации

### Toast Notifications

```typescript
import { toast } from "sonner";
toast.success("Character saved!");
toast.error("Spell casting failed");
```

### State Persistence (localStorage)

```
Pattern: dnd-{context}-{purpose}
Examples:
  dnd-player-active-character
  dnd-dashboard-active-campaign
  dnd-dashboard-battle-state
```

## Directory Structure

```
src/
├── app/[locale]/
│   ├── (auth)/         # Login, register
│   ├── (landing)/      # Landing page
│   ├── (player)/       # Player client (mobile-first)
│   │   ├── campaigns/
│   │   ├── characters/
│   │   ├── sheet/[id]/
│   │   └── spellbook/
│   ├── (dashboard)/    # Backoffice DM (desktop-first)
│   │   └── dashboard/
│   │       ├── campaigns/
│   │       ├── campaign/[id]/
│   │       ├── monsters/
│   │       ├── spells/
│   │       └── users/
│   └── (display)/      # Display client (fullscreen)
├── components/
│   ├── ui/             # shadcn/ui
│   ├── player/         # Player components
│   ├── dashboard/      # DM components
│   │   └── campaign-control/
│   │       ├── HpControl.tsx
│   │       ├── InspirationControl.tsx
│   │       ├── ConditionsControl.tsx
│   │       ├── CustomRulesControl.tsx
│   │       └── ActionsPanel.tsx
│   └── display/        # Display components
├── contexts/
│   ├── AuthContext.tsx
│   ├── CampaignContext.tsx
│   ├── PlayerSessionContext.tsx
│   └── WebSocketContext.tsx
├── hooks/
│   ├── useWebSocket.ts
│   ├── useDiceRoller.ts
│   └── useBattleTracker.ts
├── lib/
│   ├── api.ts
│   ├── dice.ts
│   ├── dnd-rules.ts
│   └── utils.ts
└── types/
    ├── character.ts
    ├── campaign.ts
    ├── spell.ts
    └── game.ts
```

## Coding Conventions

### Reference Implementation

Use XStream project (`C:\Projects\xstream-next`) as reference for:
- Docker setup
- Laravel API patterns
- Next.js patterns
- DataTable with sorting
- Auth flow with Passport

### From XStream, adopt:

- `FormatsWithTranslations` trait
- API response format: `{ success: true, data: {...}, meta: {...} }`
- Backoffice controller CRUD pattern
- `BackofficeAccess` middleware
- DataTable + columns.tsx pattern
- Dashboard sidebar layout
