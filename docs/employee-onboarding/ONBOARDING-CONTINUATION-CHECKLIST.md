# Employee Onboarding — Continuation Checklist

Use this file as the handoff when continuing employee-onboarding work on another device or with another agent. Attach this file and `EMPLOYEE-ONBOARDING-REVIEW.md` from the repository root, then ask the agent to continue from the first unchecked item. Update the checkboxes and progress notes as work is completed.

> **Status at handoff (28 September 2026):** The backend has an employee schema, validated initial-create DTO, and internal service for allocating unique Employee IDs and creating a Draft/Prejoining record. Public signup can no longer assign a role, user self-updates cannot change roles, and user administration endpoints now require an authenticated admin role. The backend build passes. No HTTP route exposes employee creation yet. JWT secret management/rotation and the HR permission model, invitations/OTP, employee self-service, private documents, review workflow, and deployment remain outstanding. Check the dated progress log before assuming any item is complete.

## Source of truth and repository locations

- Full requirements analysis: [`../../../EMPLOYEE-ONBOARDING-REVIEW.md`](../../../EMPLOYEE-ONBOARDING-REVIEW.md)
- Admin application: `rw_admin_final/` (this repository)
- Backend application: `merchandising_backend/` (sibling directory at repository root)
- Deployment notes: [`../../../DEPLOYMENT.md`](../../../DEPLOYMENT.md)

The review maps the requested workflow to the employee onboarding specification and records the current source findings, architecture, security concerns, decisions needed from HR/management, delivery estimate, and release acceptance points. Read it before changing code. The specification and company decisions remain authoritative for business rules.

## Current system facts to keep in mind

- `rw_admin_final` is a React + TypeScript + MUI admin application. It has existing dashboard, project, lead, application, partner, and integration pages.
- The admin route guard currently admits only the `admin` user type using browser-readable cookies. It is not a finished employee/HR permission model.
- `merchandising_backend` is a NestJS + Mongoose/MongoDB application. It now has an employee data model and internal creation service only; it has no employee API route, invitation/OTP flow, private HR document, policy acknowledgement, or audit module.
- Existing public uploads/static `/uploads` paths must not be used for confidential employee documents.
- A frontend-only prototype may support design feedback, but it is not the current implementation priority or a functioning onboarding flow.
- Full Phase 1 is estimated in the review at 30–45 working days for one experienced full-time developer, subject to decisions and assumptions listed there.

## Agreed delivery scope: onboarding first

The Head of Operations' direction is to deliver the **employee self-onboarding flow first**. The specification and review describe this as an end-to-end Phase 1 onboarding product, not only a form mockup. Keep implementation focused on the following flow:

**HR selects/creates a candidate → system assigns a unique Employee ID → secure invitation is emailed → candidate verifies the invited email with OTP → employee completes and saves their own onboarding details → uploads required documents → acknowledges applicable policies and declaration → submits → HR reviews documents/details → HR approves or requests corrections → authorised joining form/PDF and audit history are retained.**

The required supporting roles for this flow are Super Admin (accounts, permissions, authorised administration), HR (employee creation, invitations, review, corrections and completion), invited employee/candidate (their own details, uploads, acknowledgements and progress), and other staff (only specifically granted tools). Permissions must be enforced by the backend; the existing admin cookie check is not this role system.

Attendance, leave, payroll integrations, appraisals, training, assets, exit management, and broader HRMS features are **future scope (Phase 2)**. Do not start these as part of the first onboarding release. Employee records, permissions, audit, private documents and joining-form generation are included only to the extent required to securely complete the onboarding flow and the specification's Phase 1 acceptance criteria.

The proposed hosting shape in the review is `www.rajivwilliams.com` for the unchanged public website, `employee.rajivwilliams.com` for employee and authorised staff UI (extending `rw_admin_final`), and `api.rajivwilliams.com` for the existing backend extended with HR modules. This is a target architecture, not a completed deployment.

## Project entry and planning estimate

Use these details if creating/updating the work item in the team's project tracker. These are planning values, not an approved commitment; replace the tentative dates when the actual kickoff is confirmed.

**Project title:** Employee Self-Onboarding Portal — Phase 1

**Project description:** Build the first release of Rajiv Williams' secure employee self-onboarding portal by extending `rw_admin_final` and `merchandising_backend`. The flow covers HR selecting/creating a candidate and assigning a unique Employee ID; sending an invitation; candidate email verification with OTP; saved onboarding details; required document uploads; policy acknowledgements and declaration; submission; HR review and corrections; and retention of authorised joining forms/PDFs and audit history. Include backend-enforced permissions for Super Admin, HR, invited employees, and other staff with specifically assigned access. Keep employee information and documents private, permission-controlled, and auditable. Host the internal portal at `employee.rajivwilliams.com`; keep the existing public website unchanged. Phase 2 exclusions: attendance, leave, payroll integrations, appraisals, training, assets, and exit management.

**Estimate:** 30–45 working days for one experienced full-time developer (approximately 6–9 weeks). Assuming 8-hour days, that is 240–360 hours; use **300 hours as a provisional midpoint** only if the tracker requires a single number. This is a preliminary estimate and depends on HR decisions, approved forms/policies, security work, and hosting details.

**Tentative dates only:** 28 Sep 2026 start through 27 Nov 2026 conservative target, if kickoff is approved for 28 Sep. A 30-working-day scenario would finish around 6 Nov 2026. Holidays, reviews, and pending decisions may shift these dates; no project dates are confirmed here.

| Delivery phase | Estimate | Main outcome |
|---|---:|---|
| Requirements, permissions, and design | 3–5 working days | HR-approved fields, workflow, permissions, screens, data/storage decisions |
| Security foundation, employee records, IDs, and staging | 7–10 working days | Safe account/role foundation, employee master, unique IDs, private-storage approach, staging |
| Employee invitation and onboarding form | 8–11 working days | Invitation/OTP, saved sections, required documents, policies, submission |
| HR review and workflow | 7–11 working days | Work queue, verification/corrections, joining PDFs, audit, reminders, export |
| Validation, HR pilot, and handover | 5–8 working days | Permission and recovery validation, pilot, operating guide, handover |

## Handoff update rule

Whenever work on this project is started or completed, update this checklist in the same work session: mark completed items, add a dated progress-log entry with files changed and verification results, note screenshots/artifacts, and state the next concrete task. Keep estimates and tentative dates labelled as such until the project owner confirms them. On a later device or with a different agent, attach this checklist and the specification PDF (or the full review) and ask to continue from the first incomplete, unblocked item.

## Next recommended work item

The former static demo page has been removed. Continue with real onboarding functionality only. Public role escalation and user administration route guards are now implemented. Before exposing the employee creation service through an API, migrate JWT signing/verification to managed configuration with a rotation plan, validate current account status/role on requests, and establish how initial Super Admin/HR accounts are provisioned. Then add a role-guarded employee creation endpoint and connect the HR UI.

## Product and company decisions to collect

- [ ] Confirm employee population: new hires only or existing employees too; employees, contractors, interns, rehires, and no-shows.
- [ ] Confirm required and conditional fields for each employee category, including fresher and missing prior-employment cases.
- [ ] Approve document checklist, acceptable alternatives, file size/type limits, and missing-document exception process.
- [ ] Name initial Super Admin, HR reviewers, backup reviewer, and define access to salary, bank, and identity documents.
- [ ] Decide employee and HR login methods, invitation expiry/revocation, recovery, session expiry, and account disable behavior.
- [ ] Agree on draft, submission, correction, document-review, completion, and employment-state transitions.
- [ ] Approve policy/declaration text, versioning, retention, privacy notice, joining form content, and employee-visible PDF fields.
- [ ] Decide database direction: confirm whether MongoDB is acceptable for the employee master or whether relational storage is mandatory.
- [ ] Confirm staging/production ownership, backend runtime, database, private storage, email sender, backup and restore responsibilities.

## Implementation checklist

### Foundation and security

- [ ] Design employee identity separately from shopping/customer accounts and recruitment applications.
- [x] Public signup always assigns `customer`; profile updates cannot assign roles; user create/list/delete/delete-all endpoints require a JWT and the `admin` role.
- [ ] Define server-enforced roles, permissions, employee ownership checks, and HR scope; do not trust role cookies or client-supplied employee IDs.
- [ ] Review and address relevant legacy authentication/authorization findings in the review before exposing HR functionality. Public role escalation and unguarded user create/list/delete routes are now addressed; hard-coded JWT signing/verification secrets and session/account-state handling remain outstanding.
- [ ] Establish secure session, invitation, OTP/recovery, expiry, revocation, and account-state behavior.
- [ ] Decide employee data model, indexes, employee-code generation, idempotency, audit event model, and migration/retention approach.

### Employee onboarding

- [x] Employee persistence model and internal create service with atomic, yearly Employee ID counter are implemented; no HTTP route is exposed until authorization is safe.
- [ ] HR-authorized employee creation endpoint and unique, server-assigned permanent employee code.
- [ ] Expiring/revocable invitation tied to the intended employee.
- [ ] Employee self-service sections for personal/contact, family/emergency, education, prior employment, and bank details, with field-level access decisions.
- [ ] Saved drafts, clear progress/next action, validation, and a review-before-submit step.
- [ ] Versioned applicable document checklist, private uploads, replacement history, and employee-visible correction reasons.
- [ ] Versioned policies and attributable acknowledgements/declaration.
- [ ] Submission snapshot, duplicate-submit handling, HR correction/reopen flow, and separate onboarding/employment states.

### HR operations and documents

- [ ] HR work queues and employee profile with permission-aware search/filtering and review ownership.
- [ ] Document verification with approve/reject reason, version-aware decisions, and restricted download/access logging.
- [ ] Private HR object storage and authenticated file delivery; do not expose public/reusable document URLs.
- [ ] Server-generated, versioned joining-form PDFs with employee and HR copies that respect field permissions.
- [ ] Append-only audit events covering sensitive changes, file access, review decisions, exports, and policy acknowledgement.
- [ ] Allowlisted CSV export with sensitive field restrictions.
- [ ] Durable, retryable invitation/correction reminders and email delivery history.

### Validation and release

- [ ] Test role/ownership boundaries, including two employees who must not see one another's data.
- [ ] Validate fresher, experienced joiner, correction/re-upload, expired invitation, and interrupted-save scenarios.
- [ ] Demonstrate database and private-file restore using dummy records.
- [ ] Complete HR pilot, user guide, operational handover, monitoring, and staging/production readiness.
- [ ] Confirm release acceptance criteria against the review and original employee specification; do not treat a UI prototype as Phase 1 completion.

## Progress log

Add newest entries at the top. Keep this log factual and include the date, summary, files, verification performed, screenshot/artifact location, and remaining issues.

### 2026-09-28 — Harden legacy user role assignment and administration

- Completed: Public signup DTO no longer includes a role, and registration explicitly creates `customer` accounts. User profile updates use a role-free DTO, strict validation, and an explicit field allowlist. User create/list/delete/delete-all routes now require a valid JWT with the `admin` role; the account schema constrains new role values to `customer` or `admin`.
- Files changed: `merchandising_backend/src/auth/auth.controller.ts`, `merchandising_backend/src/auth/auth.service.ts`, `merchandising_backend/src/users/dto/create-user.dto.ts`, new `register-user.dto.ts` and `update-user.dto.ts`, `merchandising_backend/src/users/schema/users.schema.ts`, `merchandising_backend/src/users/users.controller.ts`, and `merchandising_backend/src/users/users.service.ts`.
- Verification: `npm run build` passed after correcting two TypeScript readonly assignment errors. Tests were not run.
- Screenshots/artifacts: None.
- Decisions or blockers: This is a targeted legacy-access repair, not the complete HR role system. The hard-coded JWT secret and role claims embedded in existing tokens still require a managed-secret migration/rotation and session/account-state plan. Do not expose the employee creation service until those issues and the initial HR provisioning policy are addressed.
- Next item: Plan JWT secret configuration/rotation and current-account validation without unexpectedly invalidating existing sessions; then define and provision Super Admin and HR roles.

### 2026-09-27 — Project plan and handoff rule recorded

- Completed: Added the proposed project title/description, onboarding-only Phase 1 scope, Phase 2 exclusions, 30–45 working-day / 240–360-hour estimate, provisional 300-hour midpoint, phase breakdown, and explicitly tentative schedule dates. Added a rule to keep this checklist updated after future work.
- Files changed: `rw_admin_final/docs/employee-onboarding/ONBOARDING-CONTINUATION-CHECKLIST.md`.
- Verification: Checked the phase estimates and scope against `EMPLOYEE-ONBOARDING-REVIEW.md`; no implementation verification needed for this documentation-only update.
- Screenshots/artifacts: None.
- Next item: Continue with the security foundation noted above before exposing the internal employee creation service through an API.

### 2026-09-27 — Employee data foundation; demo removed

- Completed: Removed the static-only HR demo page and navigation. Added employee and annual code-counter schemas, initial HR-entered DTO validation, employee creation service with atomic ID allocation, and registered the employees module. The service creates a Draft/Prejoining employee record but is not exposed over HTTP.
- Files changed: `merchandising_backend/src/employees/` (new module, DTO, schemas, service), `merchandising_backend/src/app.module.ts`, `rw_admin_final/src/Routes/index.tsx`, `rw_admin_final/src/Layout/Layout.tsx`, `rw_admin_final/src/Layout/Admin/Tabs.tsx`, `rw_admin_final/src/Layout/Admin/Header.tsx`; removed `rw_admin_final/src/Pages/EmployeeOnboarding/index.tsx`.
- Verification: Backend build was attempted but remained running without compiler output and was interrupted; compile status is unconfirmed. Do not expose the service until auth is hardened. Review found public signup accepts caller-supplied usertype, user administration routes are unguarded, and JWT signing uses a hard-coded secret; an admin-only controller on that base would not establish safe HR authorization.
- Screenshots/artifacts: None; the demo was removed at the user's direction.
- Decisions or blockers: Implementing the endpoint depends on closing the existing authentication/authorization gaps and agreeing who provisions initial HR users. Counter values may have gaps if employee persistence fails after allocation; uniqueness is enforced by the unique Employee ID index.
- Next item: Harden account provisioning and secret/session configuration, define the initial Super Admin/HR permission model, then expose employee creation behind server-side role checks.

### 2026-09-27 — HR onboarding queue prototype

- Completed: Temporarily added a static HR queue and detail drawer with synthetic names/statuses, then removed it after deciding to prioritize functional onboarding work.
- Files changed: `src/Pages/EmployeeOnboarding/index.tsx` was added and later removed; temporary route/navigation edits were reverted.
- Verification: `yarn` is unavailable. `npm run build` first failed with sandbox access denied while loading Vite config; an escalated retry began transforming but produced no output and was interrupted. `tsc --noEmit` also did not finish in this environment and was interrupted. Build/typecheck remain to be confirmed on the user's machine.
- Screenshots/artifacts: Not captured; prototype is no longer in the application.
- Decisions or blockers: Prototype only. Employee invitation is visibly disabled; actions, data, and checklist are illustrative. Existing admin cookie guard remains the route boundary and is not a new HR permission system.
- Next item: Superseded by the functional employee data foundation work logged above.

### 2026-09-27 — Handoff checklist created

- Added this continuation checklist under `rw_admin_final/docs/employee-onboarding/`.
- Implementation status remains: no onboarding UI/API functionality recorded as complete in the review.
- Recommended next slice: static HR onboarding queue prototype with demo data and two screenshots; not yet implemented.
- Verification: checklist content cross-checked against `EMPLOYEE-ONBOARDING-REVIEW.md` and the current admin routes/backend module setup. No application code changed.

### New progress entry template

```text
### YYYY-MM-DD — Short work title

- Completed:
- Files changed:
- Verification performed:
- Screenshots/artifacts:
- Decisions or blockers:
- Next item:
```
