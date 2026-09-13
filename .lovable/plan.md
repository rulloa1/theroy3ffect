# Client approval dashboard

## Goal
Turn the existing client project timeline into an approval dashboard. Every design stage and build step can carry a review link, move into client review, record a one-click sign-off or written change request, and notify both Rory and the client.

## 1. Approval records and security
- Add a dedicated `project_approvals` history table linked to projects and milestones, rather than overwriting a single approval field.
- Record stage type, review status, deliverable URL, client decision, feedback, signed-in approver identity, and timestamps.
- Keep clients read-only on projects and milestones. Client approval actions will use authenticated server functions that verify project ownership before writing; admin actions will require the admin role.
- Add explicit grants, RLS, ownership indexes, and status constraints in the same migration.

## 2. Admin approval controls
- Extend the existing Client Portal admin view so each milestone can be classified as Design or Build and marked “Ready for review.”
- Let Rory attach or update the deliverable/review link, due date, and client-facing note.
- Show pending, approved, and changes-requested states plus client feedback and decision times.
- Sending a stage to review creates one current approval request and emails the client a direct authenticated sign-off link.

## 3. Client approval dashboard
- Add an Approvals tab to `/portal` with a clear “Needs your approval” queue across projects.
- Upgrade each project page into a live design/build timeline showing pending, active, awaiting-review, approved, changes-requested, and completed states.
- For review-ready stages, show the deliverable link, “Approve stage,” and “Request changes.”
- One-click approval records the signed-in account and timestamp. Change requests require written feedback.

## 4. Sign-off links and notifications
- Use protected links to `/projects/:projectId?approval=:approvalId`; signed-out clients return through `/portal/login` and then to the requested project.
- Email the client when Rory sends a stage for review.
- Email Rory when the client approves or requests changes; do not auto-send any other client-facing messages.
- Make sends idempotent so retries do not duplicate review or decision emails.

## 5. Live timeline and automation
- Keep the current milestone order, dates, progress bar, and project next step as the timeline source of truth.
- Normalize automated milestone status from the unsupported `todo` value to the existing `pending` value.
- New purchase onboarding stages will appear in the same dashboard, but they will not request client approval until Rory explicitly marks them ready.
- Approval updates will refresh portal/admin views immediately through query invalidation; no separate public or token-based approval route will be introduced.

## 6. Validation
- Apply the database migration and verify grants, RLS, and ownership isolation.
- Test the admin send-for-review flow, client approval, written change request, repeated-click safety, and both email directions.
- Run type checking and the existing tests.
- Verify `/admin`, `/portal`, and a project approval deep link at desktop and 360px.
- Do not publish.
