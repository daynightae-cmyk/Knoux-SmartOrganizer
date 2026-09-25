# Third-Party UI Sources

## TailAdmin React (free) — UI/layout donor

| Item | Value |
| --- | --- |
| Product | TailAdmin React (free admin dashboard template) |
| Version/source | v2.4.0, ZIP `free-react-tailwind-admin-dashboard-main.zip` (files dated 2023–2026; upstream: tailadmin.com) |
| License | MIT — `Copyright (c) 2023 TailAdmin` (LICENSE.md inside the ZIP) |
| Donor copy location | `D:\Knoux Projects\Knoux_Project_Center\01_Ready_ui_donor_tailadmin\` (reference only, outside production tree; original ZIP unmodified) |

### What was adapted (concepts and patterns, re-implemented for this codebase)

- **SidebarProvider pattern** (donor `src/context/SidebarContext.tsx`): collapsed /
  expanded / hover-expand / small-window overlay state machine → re-implemented in
  `src/shell/Sidebar.tsx` with app settings persistence.
- **AppLayout shell shape** (donor `src/layout/AppLayout.tsx`): fixed sidebar + sticky
  header + content margin transition → re-implemented in `src/shell/AppShell.tsx`.
- **Backdrop drawer** (donor `src/layout/Backdrop.tsx`): below the desktop breakpoint the
  sidebar becomes an overlay with a dismissive backdrop → re-implemented in the shell CSS
  and `AppShell.tsx`.
- **Header search with Ctrl+K** (donor `src/layout/AppHeader.tsx`): global keyboard
  shortcut focusing search → re-implemented as a full command palette
  (`src/shell/CommandPalette.tsx`).
- **Grouped/sectioned navigation with accordion groups** (donor nav items) → adapted to
  registry-driven page groups in `src/lib/pages.ts`.
- **Visual language** (donor `src/index.css` + ui primitives): calm neutral surfaces,
  subtle borders, restrained elevation, small pill badges, grouped cards → re-expressed
  with SmartOrganizer's existing CSS variable system (no Tailwind).

### What was rejected

- Tailwind 4 toolchain, react-router, i18next (SmartOrganizer keeps its own locales system).
- All donor dependencies: apexcharts, fullcalendar, jsvectormap, leaflet, maplibre, swiper,
  react-dnd, prismjs, simplebar, flatpickr, floating-ui, dropzone, temporal-polyfill.
- All donor pages: auth, ecommerce, CRM, billing, invoices, calendar, task/email/kanban,
  maps, charts demos, user profile pages.

### Compliance

The MIT license requires retention of the copyright notice in copies or substantial
portions of the software. Adaptations here are re-implementations of layout/interaction
concepts rather than copied files; where any wording or structure is materially derived
from donor sources it is limited to uncopyrightable interface concepts and short idioms.
The license notice is retained here to satisfy attribution honestly. TailAdmin branding
(name, logo, demo copy, links) does not appear in the product.