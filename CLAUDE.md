# CLAUDE.md — trendly-brands

**Read this before touching any code in this project.**
This file was migrated from `.cursor/rules/` and is the authoritative context for all AI-assisted work in this repo.

For the monorepo overview (stack, API routes, domain model, etc.) see the root `../CLAUDE.md`.
Reference plans for complex features: `.claude/plans/`

---

## Project Overview

**trendly-brands** is the React Native (Expo) app for **brand managers** on the Trendly platform.
It is a cross-platform app (iOS + Android + Web via expo-router).

- **Bundle ID**: `@idiv__trendly-brands`
- **Stack**: React Native 0.81 + Expo SDK 54 + Expo Router 6 + TypeScript
- **Extra libs (brands-only)**: `@dnd-kit` (drag & drop), `react-native-razorpay`, `@lottiefiles/dotlottie-react`, GrowthBook feature flags

---

## UI Styling Rules — ALWAYS APPLY

These rules apply to every UI component touched or created in this project. Check against these before finishing any UI work.

### Color and Theme
- **Never** use hardcoded colors (`#hex`, `rgb()`, named CSS colors) in components.
- **Always** derive the palette: `const theme = useTheme(); const colors = Colors(theme);`
- Reuse existing color keys from `shared-uis/constants/Colors.ts` before adding any new key.
- Add new keys only when truly required — keep them aligned with the platform's professional visual tone.
- Every new or updated UI **must** look correct in both **light and dark** themes.

### Responsive Layout
- Use `useBreakpoints()` for `xl` (desktop) vs `!xl` (mobile) layout decisions.
- Use `useBreakpoints().width` for constrained responsive width values.
- **Do not** use `Dimensions.get("window")` directly inside components for responsive layout.
- For module-level utility code (where hooks can't be used), use `getConstrainedWidth()` / `getConstrainedHeight()` from `shared-libs/contexts/mobile-layout-context.provider.tsx`.

### Depth & Separation — Shadows over Borders
**Never use borders to create visual separation between UI elements.** Borders look dated. Use shadows and background contrast instead.

#### Rules
- **No `borderWidth`, `borderTopWidth`, `borderBottomWidth`, `borderLeftWidth`, `borderRightWidth` for structural separation.** This includes panel dividers, section headers, toolbar dividers, card outlines, and input field outlines.
- **Cards and list items** lift off the surface with a shadow, not a box border:
  ```ts
  shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8, shadowOpacity: 0.07, elevation: 3,
  ```
- **Panel dividers** (e.g. left/right split layouts): give the elevated panel a directional shadow toward the lower panel. Example — chat panel on the right casting a shadow leftward:
  ```ts
  shadowColor: "#000", shadowOffset: { width: -6, height: 0 },
  shadowRadius: 16, shadowOpacity: 0.07, elevation: 8,
  ```
- **Toolbars and sticky headers** cast a downward shadow over the content below:
  ```ts
  shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
  shadowRadius: 8, shadowOpacity: 0.07, elevation: 3,
  ```
- **Floating input areas** (fixed at screen bottom) cast an upward shadow:
  ```ts
  shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
  shadowRadius: 8, shadowOpacity: 0.05, elevation: 4,
  ```
- **Input fields** use `backgroundColor: colors.tag` (a subtle off-white/off-black depending on theme) instead of a border to signal interactivity. Add a micro shadow:
  ```ts
  backgroundColor: colors.tag,
  shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
  shadowRadius: 3, shadowOpacity: 0.04, elevation: 1,
  ```
- **Primary/CTA buttons** get a coloured shadow matching `colors.primary` to feel tactile:
  ```ts
  shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
  shadowRadius: 12, shadowOpacity: 0.35, elevation: 4,
  ```
- **Active items** (selected state in a list) use `backgroundColor: colors.primary` + a primary-coloured shadow — no border highlight needed.
- **Accent stripes** (e.g. quote callouts, attachment chips) — use a narrow `<View>` with a background colour instead of `borderLeftWidth`:
  ```tsx
  // ✅ Do this
  <View style={{ flexDirection: "row", overflow: "hidden", borderRadius: 10 }}>
    <View style={{ width: 4, backgroundColor: colors.primary }} />
    <View style={{ flex: 1, padding: 10 }}><Text>...</Text></View>
  </View>

  // ❌ Not this
  <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primary }}>
  ```
- **Slide-in drawers and modals** cast a large directional shadow toward the page content they overlay — no border needed on the edge.

#### Exceptions — when a border IS acceptable
- Form inputs showing a **validation error** may use a coloured `borderWidth: 1.5` with `borderColor: colors.error` to indicate the problem field.
- Decorative **dashed or dotted outlines** (e.g. upload drop zones) where the dashed pattern itself is the affordance.

### Stylesheet Structure
- Keep `StyleSheet.create(...)` at the **bottom** of the file — never at the top or mid-file.
- Keep styles **colocated** in the same file as the component — no external stylesheet files.
- **No inline style objects** in JSX (no `style={{ marginTop: 8 }}`). Put them in `StyleSheet`.

### Quick Pattern (copy this)
```tsx
const theme = useTheme();
const colors = Colors(theme);
const { xl, width } = useBreakpoints();
const styles = useMemo(() => useStyles(colors, xl, width), [colors, xl, width]);
```

### Self-Check Before Finishing UI Work
- [ ] Colors come from `Colors(theme)` tokens — zero hardcoded hex/rgb values
- [ ] Existing color tokens were preferred over adding new ones
- [ ] UI is correct in both light and dark themes
- [ ] Responsive behavior is correct for desktop (`xl`) and mobile (`!xl`)
- [ ] `StyleSheet.create(...)` is at the bottom of the file
- [ ] No inline style objects in JSX
- [ ] No external stylesheet imports
- [ ] No `borderWidth` / directional border used for visual separation — shadows used instead
- [ ] Input fields use `backgroundColor: colors.tag` (not a border) to signal interactivity
- [ ] Accent stripes use a `<View width={4}>` child element, not `borderLeftWidth`

---

## Project Structure

```
trendly-brands/
├── app/                    # Expo Router file-based routes
│   ├── (auth)/             # Login, signup, forgot-password, wrong-app
│   ├── (landing)/          # Pre-auth marketing screens (get-started, pricing, create-brand)
│   ├── (main)/
│   │   ├── (onboarding)/   # First-run brand setup + pay-wall
│   │   └── (drawer)/
│   │       ├── (tabs)/     # Bottom tabs: discover, collaborations, explore, messages, menu
│   │       └── (secondary)/ # Stack screens: applications, contracts, billing, CRM, etc.
│   │           └── (modal)/ # create-collaboration, edit-collaboration
│   └── (public)/           # Public: influencer profile, collaboration-application
├── components/             # Shared UI components
├── constants/              # Colors, CreateCollaborationForm, Industries, etc.
├── contexts/               # React contexts (auth, brand, collab, contract, chat, etc.)
├── types/                  # TypeScript types (Brand, Collaboration, Contract, etc.)
├── utils/                  # url.ts, date.ts, conversion.ts, router.ts, etc.
├── styles/                 # Shared style files (CollaborationCard, InfluencerCard, etc.)
├── hooks/                  # Custom hooks
├── shared-constants/       # Git submodule: contract-status.ts, app.ts, route-agreement.ts
├── shared-libs/            # Git submodule: shared business logic
└── shared-uis/             # Git submodule: shared UI components
```

---

## Key Contexts

| Context | File | Purpose |
|---|---|---|
| Auth | `contexts/auth-context.provider.tsx` | Firebase user + JWT token |
| Brand | `contexts/brand-context.provider.tsx` | Active brand data |
| Collaboration | `contexts/collaboration-context.provider.tsx` | Brand's collaborations |
| Contract | `contexts/contract-context.provider.tsx` | All contracts |
| Chat | `contexts/chat-context.provider.tsx` | Stream Chat client |
| Niche | `contexts/niche-context.provider.tsx` | Niche taxonomy |
| Notification | `contexts/notification-context.provider.tsx` | Push notifications |
| GrowthBook | `contexts/growthbook-context-provider.tsx` | Feature flags (web) |
| GrowthBook Native | `contexts/growthbook-context-provider.native.tsx` | Feature flags (native) |
| Transition | `contexts/transition-context.provider.tsx` | Screen transition state |
| FirebaseStorage | `contexts/firebase-storage-context.provider.tsx` | File uploads |

---

## Contract Flow

The contract lifecycle has **11 states (0–10)**. States, ownership, and the required UI for each are documented in:

`.claude/plans/users-contract-flow-parity.md` — state-by-state ownership matrix (brands = owner on states 0, 1, 3, 4, 6, 7; influencer = owner on 5, 9)

Contract status enum source of truth: `shared-constants/contract-status.ts`

ActionContainer pattern: `components/contracts/ActionContainer.tsx` — single state router for all contract action buttons, messages, and modal visibility. Do not inline API calls in UI components — keep them in `components/contracts/api/State_<n>_api.ts`.

---

## Shared Submodules (Read Before Editing)

These are **git submodules** shared with `trendly-users`. Changes here affect both apps.

| Path | Contents |
|---|---|
| `shared-constants/contract-status.ts` | ContractStatus enum — source of truth for all states |
| `shared-constants/app.ts` | Global app config (API base URL, etc.) |
| `shared-constants/route-agreement.ts` | KYC route agreement text |
| `shared-libs/` | Shared business logic, firestore models |
| `shared-uis/` | Shared UI components (including `Colors.ts`, `ContractActionsWithMessage`) |

---

## Build Commands

```bash
npm run ios           # Local iOS simulator
npm run android       # Local Android emulator
npm run web           # Web dev server (port 8082)
npm run build-ios     # EAS production iOS build → build/Trendly.ipa
npm run build-android # EAS production Android build → build/Trendly.aab
npm run submit-ios    # Submit to App Store
npm run submit-android-prod # Submit to Play Store
```
