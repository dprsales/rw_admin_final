# Employee Onboarding — Continuation Checklist

Use this file as the handoff when continuing employee-onboarding work on another device or with another agent. Attach this file and `EMPLOYEE-ONBOARDING-REVIEW.md` from the repository root, then ask the agent to continue from the first unchecked item. Update the checkboxes and progress notes as work is completed.

> **Current status (29 September 2026):** The backend has an employee schema, validated initial-create DTO, and internal service for allocating unique Employee IDs and creating a Draft/Prejoining record. Public signup can no longer assign a role, user self-updates cannot change roles, and user administration endpoints now require an authenticated admin role. Backend and frontend TypeScript checks pass. No HTTP route exposes employee creation yet. JWT secret management/rotation, current-account validation, the HR permission model, invitations/OTP, employee self-service, private documents, review workflow, PDFs, audit, reminders, deployment, and production testing remain outstanding. Use the status matrix below and the dated progress log as the source of truth; do not infer completion from a screen, schema, or checklist title alone.

## How to use this checklist on any device

This file is the implementation handoff and single source of truth for the employee-onboarding project. Before coding, read this file from the repository and then read `EMPLOYEE-ONBOARDING-REVIEW.md` and the attached specification PDF. Continue from the first unchecked, unblocked item in the order below. Do not recreate a prototype or restart completed work because another device is being used.

At the end of every coding session, update this same file before switching devices:

1. Mark only work that is implemented, verified, and present in the shared codebase as `[x]`.
2. Add a newest dated progress-log entry with the files changed, commands/tests run, result, screenshots/artifacts, blockers, and the next concrete item.
3. If a requirement is awaiting an HR/management decision, leave it unchecked and record the decision needed in the blockers section.
4. Never mark an item complete because UI exists. The API, authorization, persistence, failure handling, and relevant test must also work.
5. Keep secrets, production credentials, personal employee data, and real documents out of this file and out of source control.

The shared workspace is `C:\Users\sales\OneDrive\Desktop\RW`. The primary source folders are `rw_admin_final`, `merchandising_backend`, and `react`. The public website in `react` remains unchanged while onboarding is developed in `rw_admin_final` and `merchandising_backend`.

## Current status matrix

| Area | Status | Evidence/current truth | Completion rule |
|---|---|---|---|
| Employee schema | Complete foundation | `merchandising_backend/src/employees/schema/employee.schema.ts` | Keep only after schema review, indexes, migration/retention decisions, and tests are complete |
| Yearly Employee ID counter | Complete foundation | `employees.service.ts` uses an atomic yearly counter and unique employee code | Must pass concurrent-create and duplicate/idempotency tests |
| Initial employee DTO | Partial | First/last name, personal email, phone, designation, department, joining date | Add approved employment type, manager, location, offer status and restricted fields where required |
| Internal create service | Complete foundation, not exposed | Creates Draft/Prejoining records; no controller | Expose only through an authorized HR endpoint with audit event and idempotency |
| Public role escalation repair | Complete targeted repair | Public signup forces `customer`; role is excluded from registration DTO | Re-test signup with malicious role fields and unknown fields |
| User administration guards | Complete targeted repair | Create/list/delete routes require JWT + `admin` | Replace legacy `admin/customer` model with approved HR permissions before onboarding use |
| JWT secret/session security | Blocked/required next | Secrets remain hardcoded; validation returns token claims only | Managed secret, rotation/migration plan, account-status lookup, revocation/expiry behavior, tests |
| Employee/HR roles | Not started | No employee, HR, or Super Admin role system exists | Backend permission matrix and server guards implemented and tested |
| Employee creation API | Not started | No `EmployeesController` or HTTP route exists | HR can create and view a candidate through an authorized endpoint |
| Admin frontend onboarding pages | Not started | Existing admin routes have no employee workflow | HR dashboard, create form, list, profile, review pages connected to API |
| Stakeholder demo walkthrough | Complete locally / deployment pending | Public API-free route `/demo/onboarding` in `rw_admin_final` uses sample data and shows the four-stage flow | Deploy a preview link only after sharing the URL; keep it clearly labelled demo and never connect it to production data |
| Candidate invitation/OTP | Not started | No invitation or OTP module | Expiring, revocable, rate-limited, single-employee invitation flow |
| Employee self-service | Not started | No employee onboarding route/form | Candidate can save, resume, validate, review and submit only their own record |
| Private documents | Not started | Existing public upload/CDN paths are unsuitable | Private storage, authenticated delivery, versioning, verification and access logging |
| Policies/declaration | Not started | No policy module | Versioned policy assignment and attributable acknowledgement |
| HR review/corrections | Not started | No review workflow | Approve/reject/re-upload/reopen with reasons and state checks |
| Joining Form PDF | Not started | No PDF module | Server-generated, versioned HR/employee copies stored privately |
| Audit log | Not started | No onboarding audit module | Append-only events for all sensitive actions and downloads |
| Notifications/reminders | Not started | No onboarding delivery history/job flow | Durable, retryable invitation and reminder jobs without duplicates |
| Deployment | Not started | `employee.rajivwilliams.com` is target architecture only | Staging and production deployment, SSL, SPA fallback, CORS, backup and restore verified |
| Acceptance testing | Not started | No end-to-end onboarding test | Dummy employee flow and authorization/recovery tests pass before real data |

## Required implementation order

Do these in sequence. Do not expose employee creation before steps 1–3 are complete.

### 1. Security and identity foundation

- [ ] Move the JWT signing secret to managed environment configuration in both signing and verification paths.
- [ ] Decide and document secret rotation without unexpectedly invalidating all existing users.
- [ ] Make JWT validation load the current account and reject disabled, deleted, or role-changed accounts.
- [ ] Define `super_admin`, `hr`, `employee`, and any additional staff permissions; do not use browser cookies as authorization.
- [ ] Decide initial Super Admin/HR provisioning; remove or restrict open privileged-account creation.
- [ ] Configure explicit trusted CORS origins for the public site, employee portal and approved local development origins.
- [ ] Define session expiry, invitation expiry, OTP attempt limits, resend limits, logout/revocation and recovery behavior.
- [ ] Add tests proving customer, employee, HR and Super Admin cannot cross permission boundaries.

### 2. Employee master and HR API

- [ ] Confirm MongoDB versus relational storage with management; record the decision here.
- [ ] Finalize employee fields and conditional rules for employees, contractors, interns, freshers, rehires and no-shows.
- [ ] Add approved fields: employment type, reporting manager, work location, offer status, source of hiring and restricted compensation as applicable.
- [ ] Add `EmployeesController` with authenticated, role/permission-guarded create, list, detail and status endpoints.
- [ ] Add request idempotency and server-side allowlists; never accept employee ID, role, status, reviewer or audit actor from the client.
- [ ] Add audit event for employee creation and Employee ID generation.
- [ ] Add API tests for duplicate email, concurrent Employee ID allocation, invalid fields, unauthorized access and repeated requests.

### 3. HR frontend

- [ ] Add role-aware route and navigation handling in `rw_admin_final`; backend permission remains authoritative.
- [ ] Add HR dashboard with invitation, progress, review, corrections and joining-date queues.
- [ ] Add Create Employee form connected to the API, including validation and success/error states.
- [ ] Add employee list/search/filter and employee profile shell.
- [ ] Do not show salary, bank, identity documents, exports or user management unless the current permission allows it.
- [ ] Add loading, empty, API failure, session expiry and unsaved-change states.

### 4. Invitation, candidate authentication and self-service

- [ ] Create a cryptographically random, expiring, revocable invitation tied to one employee.
- [ ] Invalidate or supersede prior invitations according to the approved resend policy.
- [ ] Add candidate email verification/OTP with rate limiting and audit events.
- [ ] Add employee-only routes that resolve the employee from the verified session/invitation, never from a client-supplied employee ID alone.
- [ ] Add saved drafts and section progress for personal/contact, family/emergency, education, previous employment and bank details.
- [ ] Add server validation, review-before-submit, duplicate-submit protection and separate onboarding/employment states.

### 5. Documents, policies and submission

- [ ] Approve the document checklist, conditional requirements, accepted alternatives, file limits and missing-document exception process.
- [ ] Implement private storage separate from public `/uploads` and public CDN assets.
- [ ] Validate file content/type/size, generate server-side storage names, retain versions and prevent predictable public URLs.
- [ ] Implement authenticated file delivery with employee ownership and HR permission checks.
- [ ] Implement Pending, Approved, Re-upload Required and Locked document states with reviewer/reason metadata.
- [ ] Add policy versions, applicability and acknowledgement timestamps.
- [ ] Add final declaration, submission snapshot and correction/reopen flow.

### 6. HR completion and operations

- [ ] Add document/detail review actions and review ownership.
- [ ] Generate private, versioned Joining Form PDFs from the submitted snapshot; separate HR and employee copies where required.
- [ ] Add append-only audit events for sensitive reads/downloads, edits, approvals, rejection, reopening, export and policy acknowledgement.
- [ ] Add allowlisted CSV export with sensitive-field restrictions.
- [ ] Add durable email invitation, correction and reminder jobs with retry/delivery history and duplicate prevention.
- [ ] Add backup/restore of database, private documents, PDFs and required key recovery material.

### 7. Release and deployment

- [ ] Confirm Hostinger subdomain/document root and deploy `rw_admin_final/dist` independently at `employee.rajivwilliams.com`.
- [ ] Add and test SPA `.htaccess`, HTTPS/SSL, no-index behavior and production API environment configuration.
- [ ] Confirm backend runtime, process manager, database, private storage, email sender, monitoring and backup ownership.
- [ ] Run the dummy end-to-end flow with an HR user and at least two employee accounts.
- [ ] Test direct URL access, refresh, expired invitation, failed OTP, interrupted save, re-upload, approval lock and recovery.
- [ ] Complete HR pilot, user guide, operational handover and production approval before real employee data.

## Definition of done for each code item

An item is complete only when all applicable points are true:

- The backend behavior exists and is reachable through the intended API route.
- DTO validation, database persistence and error responses are implemented.
- Authorization is enforced on the server for the role and employee/resource relationship.
- The frontend handles loading, success, validation, unauthorized, expired-session and network-error states.
- Sensitive fields are not returned to users without permission.
- Audit/notification/state changes are recorded where required.
- A meaningful automated test or documented manual test covers the acceptance behavior.
- Typecheck/build passes and the progress log names the command and result.
- No real employee data or secrets are used in development or screenshots.

## Known blockers and decisions

- [ ] Management approves the employee population and edge cases.
- [ ] HR approves fields and conditional document checklist.
- [ ] Management names initial Super Admin, HR reviewers and backup reviewer.
- [ ] Management approves login/OTP, invitation expiry, correction and completion rules.
- [ ] HR approves policies, declaration, retention and employee-visible PDF fields.
- [ ] Management confirms MongoDB is acceptable or approves a relational database.
- [ ] Technical owner confirms staging/production runtime, storage, email, backup and Hostinger access.

## 2026-09-29 review entry

- Reviewed the checklist against `merchandising_backend/src/employees`, authentication/user changes, `rw_admin_final` routes/layout/API client, and both applications' TypeScript compilation.
- Confirmed the employee schema, counter and internal service are present; confirmed no employee controller/API or onboarding frontend is present.
- Confirmed JWT secrets remain hardcoded, CORS remains wildcard, and the current role model is only `admin/customer`; these remain blockers before exposing HR functionality.
- Verification: `tsc --noEmit --incremental false -p tsconfig.build.json` passed for the backend; `tsc --noEmit --incremental false` passed for `rw_admin_final`. A separate `npm run build` invocation did not produce a completion result in this environment and is not claimed as verified by this entry.
- Next concrete item: complete Section 1 security and identity foundation, then expose the authorized employee creation API.

## 2026-09-29 stakeholder demo entry

- Added `rw_admin_final/src/Pages/EmployeeOnboardingDemo/index.tsx` with a deliberately limited, API-free onboarding walkthrough: HR creates candidate, candidate completes details, documents/declaration, and HR review.
- Added public route `/demo/onboarding` in `rw_admin_final/src/Routes/index.tsx`. It does not bypass or change protection for production admin routes and uses only sample data.
- The demo is for stakeholder understanding and workflow approval; it is not employee creation, authentication, document upload, or production onboarding.
- Verification: `tsc --noEmit --incremental false` passed for `rw_admin_final`. `npm run build` was attempted but Vite failed in this sandbox while resolving the project config with an access-denied path; no TypeScript error was reported. Re-run the build on the normal development machine or CI before deploying the preview.
- Next concrete item: deploy this branch/project as a temporary Vercel preview and share the generated link; then return to Section 1 security foundation.

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
