# Team Spaces

Base recommendation for a 5-person split on this starter app:

1. Authentication and access
`src/pages/LoginPage.tsx`
`src/App.tsx`
Future scope: auth API, route protection, session state.

2. Athlete planner calendar
`src/pages/PlannerPage.tsx`
Future scope: create/edit/delete sessions, planner persistence.

3. Performance analytics
`src/pages/PerformancePage.tsx`
`src/data/mockData.ts`
Future scope: charts, aggregates, planner-performance linkage.

4. Social hub and AI missions
`src/pages/SocialHubPage.tsx`
Future scope: activity feed, mission generation, weekly challenges.

5. Avatar, progression and rewards
`src/pages/AvatarPage.tsx`
Future scope: cosmetics, unlockables, XP, points, skin inventory.

Shared zone
`src/layout/AppLayout.tsx`
`src/components/`
`src/styles.css`
Only change shared files when the change is agreed by the group.
