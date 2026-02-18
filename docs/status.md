# Current Status (Февраль 2026)

## Что реализовано

### Backend (Laravel API)

- ✅ Auth система (login, register, OAuth2 tokens через Passport)
- ✅ Roles & Permissions (owner, dm, player)
- ✅ RuleSystem + Settings (D&D 5e + Eberron с сидерами)
- ✅ Campaigns CRUD с привязкой к сеттингам
- ✅ Acts & Sessions management
- ✅ Characters CRUD с полной структурой D&D 5e
- ✅ Live Sessions (start/stop/status)
- ✅ WebSocket broadcasting через Laravel Reverb
- ✅ Character HP/XP/Conditions updates с WebSocket уведомлениями
- ✅ Level Up API с автоматическим расчётом HP
- ✅ Inspiration toggle API
- ✅ Custom Rules (perks/afflictions) API
- ✅ Currency management API
- ✅ Inventory management API

### Frontend (Next.js)

- ✅ Auth flow с AuthContext
- ✅ Player client: выбор кампании, выбор персонажа, лист персонажа
- ✅ DM Dashboard: список кампаний, детали кампании
- ✅ DM Control Panel:
  - ✅ HP Control (heal/damage/temp HP)
  - ✅ Inspiration Control (toggle)
  - ✅ Conditions Control (add/remove)
  - ✅ Custom Rules (perks/afflictions)
  - ✅ Actions Panel (Award XP, Level Up, Kill Character)
  - ✅ Abilities/Skills/Saving Throws view
  - ✅ Currency Control
  - ✅ Inventory Control
  - ✅ Spells View (для заклинателей)
- ✅ WebSocket интеграция:
  - ✅ Presence channel для отображения онлайн игроков
  - ✅ Real-time обновление HP/XP/conditions между DM и Player
  - ✅ Live Session management (start/stop)
  - ✅ Connection status indicators (Live/Connected/Disconnected/Offline)
- ✅ Level Up flow для игроков
- ✅ OnlinePlayersIndicator для DM

### Работает в реальном времени

- DM может запустить Live Session
- DM видит кто из игроков онлайн
- DM может менять HP/XP/conditions/inspiration персонажам — игроки видят мгновенно
- Игроки видят свой лист персонажа с актуальными данными
- Игроки могут делать Level Up

## Что НЕ реализовано (TODO)

- ❌ Display Client (TV mode)
- ❌ Battle Tracker
- ❌ Dice roller
- ❌ Scene Editor
- ❌ Character creation wizard (базовый шаблон есть, но не wizard)
- ❌ Spellbook UI для игрока (есть только view в DM panel)

## Development Priority

### Phase 1 — MVP (Player Client + Basic DM) ✅ DONE

1. ✅ Auth system
2. ✅ Backoffice skeleton
3. ✅ RuleSystem + Setting models
4. ✅ DM: Campaign CRUD
5. ✅ DM: Acts & Sessions management
6. ✅ Character sheet view
7. ✅ DM: Control Panel

### Phase 2 — Battle, Content & Scene Tree

1. **Battle tracker** — инициатива, HP, состояния, ходы
2. WebSocket интеграция для битвы
3. Визуальный редактор дерева сцен (@xyflow/react)
4. DM: Управление контентом (монстры, заклинания, предметы)
5. DM: Таблицы случайностей, NPC
6. ✅ Level up flow
7. Кладбище персонажей

### Phase 3 — Display Client

1. Управление сценами
2. Музыкальный плеер
3. Display client (fullscreen)
4. Экраны выбора (CRPG style)
5. Display Remote

### Phase 4 — Polish

1. Мультиклассирование, черты
2. Homebrew редактор
3. Экспорт/импорт кампании
4. Character creation wizard
