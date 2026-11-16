# Employee onboarding flow

Start to end. Do these in this order. The current task is the first step that is not done.

1. **Security and identity** — Done. JWT secret, role checks, and the Super Admin user screen are in place.
2. **Employee record** — Done. HR creates an employee. The server assigns the employee ID and saves a Draft record.
3. **HR employee screen** — Done. HR can open Employees, enter the person, and see the list.
4. **Send the invitation** — Done. HR sends one email from an employee row. The record stores a hashed token, an expiry, and a revoked flag. A successful send replaces the previous invitation for that employee.
5. **Open the link** — Done. `GET /join?token=` hashes the token and refuses missing, expired, and revoked invitations. Public `/join` shows valid or refused.
6. **Verify the email** — Done. Candidate requests a 6-digit code, verifies it on `/join`, with resend/attempt limits and audit events.
7. **Candidate form** — Done for draft fields. Personal extras, education, previous employment, and bank save/resume on `/join`. Review-before-submit still outstanding.
8. **Documents** — Done for first release review loop. Fixed checklist, private storage, candidate upload/preview, HR open/approve/reject with reason, and candidate re-upload. Full historical version archive still light.
9. **Policies and declaration** — Done for first release. Versioned policy catalog, per-policy acknowledge, joining declaration after all policies, Join Policies step, and audits.
10. **Submit** — Current task. The candidate reviews and submits once. A second submit does not create a second record.
11. **HR review** — Broader package review after policies/submit; document approve/reject is already in place.
12. **Joining form and audit** — The system keeps the joining-form PDF and a history of the sensitive actions.

## Current task

**Title:** Submit

- Review of form, documents, and policies before one submit.
- Idempotent submit so a second click does not create a second record.
