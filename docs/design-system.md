# Design System & Visual Identity

**Objective:** Create a premium, modern, and consistent look and feel across all POS applications (Desktop, Mobile, Web).

## 1. Visual Foundation

### 1.1 Typography
We will use **Inter** (via Google Fonts or packaged) for its legibility and modern aesthetic.
- **Headings**: SemiBold / Bold, tight tracking.
- **Body**: Regular / Medium, good readability.
- **Monospace**: For code/receipts (e.g., JetBrains Mono or Fira Code).

### 1.2 Color Palette (TailwindCSS)
We adopt a **Slate** or **Zinc** scale for neutrals to give a premium feel (less harsh than pure black/gray).

**Primary Brand Color (Default):**
- A vibrant **Violet** or **Indigo** spectrum.
- *Capability:* The user will be able to customize this "Brand Color" in the layout.

**Dark Mode Strategy:**
- **Background**: `bg-zinc-950` (Deep, rich dark) instead of `bg-black`.
- **Surface**: `bg-zinc-900` / `bg-zinc-800`.
- **Text**: `text-zinc-50` (High contrast) to `text-zinc-400` (Muted).

### 1.3 key UI Concepts
- **Glassmorphism:** Subtle use of backdrop-blur on sticky headers/sidebars.
- **Micro-interactions:** Smooth transitions on hover/active states.
- **Border Radius:** `rounded-lg` or `rounded-xl` for a friendly, modern touch.
- **Spacing:** Generous padding (white space) to avoid clutter, crucial for touch targets in POS.

## 2. Component Library (Shadcn UI + Radix)

We will implement a custom component set in `@pos/ui` based on **Radix UI** primitives and **TailwindCSS**.

### Core Components
- **Button**: Variants (Default, Secondary, Ghost, Destructive). Loading states built-in.
- **Input/Form**: Floating labels or clean accessible labels with validation error states.
- **Card**: Used heavily for grouping content (e.g., "Store Details", "Payment Methods").
- **Dialog/Modal**: For quick actions (e.g., "Add Customer").
- **Toast**: For non-intrusive notifications.

## 3. Theming & Dark Mode

- Uses `class` strategy in Tailwind.
- A global `ThemeProvider` (React Context) will manage:
  - `theme`: 'light' | 'dark' | 'system'
  - `brandColor`: Hex code (dynamically updating CSS variables).

## 4. Layouts

### 4.1 Wizards (Onboarding)
- **Concept:** Focused, step-by-step flow.
- **Visuals:**
  - Left/Top: Progress indicator.
  - Center: Form content.
  - Bottom: Action bar (Back / Next).
- **Animation:** Slide-in / Fade-in transitions between steps.

### 4.2 Dashboard (Main App)
- **Sidebar**: Collapsible, icon-first.
- **Header**: Global search, user profile, connectivity status (Offline/Online).
- **Content Area**: Scrollable, responsive grid.

---

**Implementation Note:**
All components should be exported from `@pos/ui` and consumed by apps. The apps should strictly follow this system to maintain consistency.
