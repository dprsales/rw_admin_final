# Employee onboarding flow

Start to end. Do these in this order. The current task is the first step that is not done.

1. **Security and identity** — Done. JWT secret, role checks, and the Super Admin user screen are in place.
2. **Employee record** — Done. HR creates an employee. The server assigns the employee ID and saves a Draft record.
3. **HR employee screen** — Done. HR can open Employees, enter the person, and see the list.
4. **Send the invitation** — Done. HR sends one email from an employee row. The record stores a hashed token, an expiry, and a revoked flag. A successful send replaces the previous invitation for that employee.
5. **Open the link** — Current task. The link is refused when it is expired, revoked, or replaced by a newer invitation.
6. **Verify the email** — The candidate confirms the invited address with a one-time code.
7. **Candidate form** — The candidate saves their own details and can come back to finish them.
8. **Documents** — The candidate uploads the required files to private storage.
9. **Policies and declaration** — The candidate acknowledges the policies that apply to them.
10. **Submit** — The candidate reviews and submits once. A second submit does not create a second record.
11. **HR review** — HR approves the file or sends it back with a reason.
12. **Joining form and audit** — The system keeps the joining-form PDF and a history of the sensitive actions.

## Current task

**Title:** Open the invitation link

- The employee opens the single link from the invitation email.
- The page loads only when that token is still valid.
- An expired link is refused.
- A revoked link is refused.
- A link replaced by a newer invitation is refused.
