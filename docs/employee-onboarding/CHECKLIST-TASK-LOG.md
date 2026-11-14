# Employee onboarding flow

Start to end. Do these in this order. The current task is the first step that is not done.

1. **Security and identity** — Done. JWT secret, role checks, and the Super Admin user screen are in place.
2. **Employee record** — Done. HR creates an employee. The server assigns the employee ID and saves a Draft record.
3. **HR employee screen** — Done. HR can open Employees, enter the person, and see the list.
4. **Send the invitation** — Done. HR sends one email from an employee row. The record stores a hashed token, an expiry, and a revoked flag. A successful send replaces the previous invitation for that employee.
5. **Open the link** — Done. `GET /join?token=` hashes the token and refuses missing, expired, and revoked invitations. Public `/join` shows valid or refused.
6. **Verify the email** — Done. Candidate requests a 6-digit code, verifies it on `/join`, with resend/attempt limits and audit events.
7. **Candidate form** — Done for draft fields. Personal extras, education, previous employment, and bank save/resume on `/join`. Review-before-submit still outstanding.
8. **Documents** — Started. Fixed checklist, private disk storage, session-gated list/upload/preview, and `/join` Documents step with thumbnails. HR download, approve/reject, and full version history still outstanding.
9. **Policies and declaration** — The candidate acknowledges the policies that apply to them.
10. **Submit** — The candidate reviews and submits once. A second submit does not create a second record.
11. **HR review** — HR approves the file or sends it back with a reason.
12. **Joining form and audit** — The system keeps the joining-form PDF and a history of the sensitive actions.

## Current task

**Title:** Documents (continue)

- Authenticated download for the candidate/HR.
- Approve / reject / re-upload workflow.
- Keep files off the public CDN (private disk path is in place for uploads).
