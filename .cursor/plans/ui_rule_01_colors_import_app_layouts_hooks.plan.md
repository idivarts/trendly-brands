---
name: UI rule – Colors import (app, layouts, screens, hooks)
overview: "Replace `@/constants/Colors` with `@/shared-uis/constants/Colors` in app/, layouts/, screens/, and hooks/. Part of UI rule violation audit (split); implement first (Phase 1)."
todos: []
isProject: false
---

# UI rule – Colors import (app, layouts, screens, hooks)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement this plan first (Phase 1).

## Task

Replace every import from `@/constants/Colors` with `@/shared-uis/constants/Colors` in the files listed below. This is a drop-in change when the API matches; use the same import style (default import `Colors`).

## Files in scope (15)

**app/**
- app/index.tsx
- app/(auth)/_layout.tsx
- app/(auth)/login.tsx
- app/(auth)/forgot-password.tsx
- app/(auth)/create-new-account.tsx
- app/(main)/(drawer)/(secondary)/applications.tsx
- app/(main)/(drawer)/(secondary)/notifications.tsx
- app/(main)/(drawer)/(secondary)/contract-details/[pageID].tsx
- app/(main)/(drawer)/(tabs)/_layout.tsx
- app/(main)/(onboarding)/onboarding-your-brand.tsx

**layouts/**
- layouts/app-layout/index.tsx
- layouts/protected/brand-protected-screen.tsx

**screens/**
- screens/PreSigninScreen.tsx

**hooks/**
- hooks/use-stream-theme.web.tsx
- hooks/use-stream-theme.native.tsx

## Done when

- Each file imports `Colors` from `@/shared-uis/constants/Colors`.
- No behavior change; UI and themes should look the same.
