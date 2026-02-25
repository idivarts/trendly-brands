---
name: UI rule – External stylesheets (batch A)
overview: "Move styles into component file or document exception; ensure only Colors(theme). Consumers: onboarding, auth, ViewCollaborationMap, notifications, menu, CollaborationHeader, PreSigninMobile, MembersModal, InvitedMemberTabContent, SearchComponent. Part of UI rule violation audit (split); implement after Plan 08 (Phase 4)."
todos: []
isProject: false
---

# UI rule – External stylesheets (batch A)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 08 (Phase 4).

## Task

Rule: styles in the same file as the component; no external stylesheets. For each consumer below, either move the style function + `StyleSheet.create` into the consuming component file, or keep a single theme-taking module and document the exception. Ensure those modules use only `Colors(theme)` and no hardcoded colors.

## Consumers and their external style imports

| Consumer | External style import(s) |
|---------|-------------------------|
| app/(main)/(onboarding)/onboarding-your-brand.tsx | @/styles/onboarding/brand.styles |
| app/(main)/(onboarding)/onboarding-get-started.tsx | @/styles/onboarding/get-started.styles |
| app/(auth)/create-new-account.tsx | @/styles/signup.styles |
| components/view-collaboration/ViewCollaborationMap.tsx | @/styles/modal/UploadModal.styles |
| components/notifications/index.tsx | @/styles/NotificationCard.styles |
| components/menu/index.tsx | @/styles/menu/MenuItem.styles |
| components/collaboration/CollaborationHeader.tsx | @/styles/collaboration-details/CollaborationHeader.styles |
| components/pre-signin/PreSigninMobile.tsx | @/styles/tab1.styles |
| components/ui/modal/MembersModal.tsx | @/styles/Members |
| components/collaboration/collaboration-details/InvitedMemberTabContent.tsx | @/styles/collaboration-details/CollaborationDetails.styles |
| components/SearchComponent.tsx | @/styles/searchbar/Searchbar.styles, SearchComponent.styles |

## Done when

- Each consumer either has styles in the same file or the exception is documented and the style module uses only `Colors(theme)`.
