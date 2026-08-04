# Production Deploy QA Specification

## Purpose

Define the safe, auditable production-release and QA contract for the Railway backend and Vercel frontend.

## Requirements

### Requirement: PD-01 Environment Diagnostic Protection

`/api/env-check` MUST be removed or access-controlled. An unauthenticated response MUST NOT disclose database URLs, environment-derived values, connection errors, or stack details.

#### Scenario: Public diagnostic request
- GIVEN an unauthenticated caller requests `/api/env-check`
- WHEN the route is evaluated
- THEN it returns no sensitive diagnostic data

#### Scenario: Database failure
- GIVEN an authorized diagnostic operation encounters a database failure
- WHEN it reports the failure
- THEN its external response contains no credential or provider detail

### Requirement: PD-02 Railway Release Order

Railway MUST use `backend/` as its service root. Its release sequence MUST deterministically generate Prisma client during build, run `prisma migrate deploy` as pre-deploy, and start the long-running server only after pre-deploy succeeds.

The repository config file MUST remain at `/railway.json`; because Railway config paths are absolute and do not follow Root Directory, selecting that Config File path in the provider remains an explicitly approved provider action.

#### Scenario: Successful release
- GIVEN the backend build and pending migrations succeed
- WHEN Railway promotes the release
- THEN it starts `backend` on its configured host and port

#### Scenario: Pre-deploy failure
- GIVEN client generation or migration fails
- WHEN Railway evaluates the release
- THEN it MUST NOT promote the new backend

### Requirement: PD-03 Idempotency Migration Gate

The forward order-confirmation idempotency migration MUST be applied idempotently before a backend serving idempotent confirmation is promoted.

#### Scenario: First eligible release
- GIVEN the migration is not recorded in production
- WHEN pre-deploy runs
- THEN it completes before the new backend is eligible for promotion

#### Scenario: Repeated release
- GIVEN the migration is already recorded
- WHEN pre-deploy runs again
- THEN it completes without altering existing confirmation data

### Requirement: PD-04 Frontend Separation and Origin Contract

Vercel MUST deploy only the frontend and MUST use `VITE_API_URL` for the Railway API. It MUST NOT run migrations, seeds, database push, or backend functions. Railway CORS MUST allow the production frontend and approved local origin only.

#### Scenario: Frontend deployment
- GIVEN Vercel builds the application
- WHEN the build executes
- THEN it produces frontend output without backend or database work

#### Scenario: Cross-origin API request
- GIVEN the configured production frontend calls the API
- WHEN its origin is allowed
- THEN the API accepts the request through the CORS policy

### Requirement: PD-05 Public Read-only Smoke

Public production smoke QA MUST use only read-only `GET` requests to health, database health, products, and categories, MUST bound every request with a timeout, and MUST record status/result without sensitive payloads.

#### Scenario: Healthy public smoke
- GIVEN the promoted services are reachable
- WHEN the four read-only endpoints are checked
- THEN each expected success response is recorded as evidence

#### Scenario: Failed public smoke
- GIVEN a smoke endpoint fails, times out, or returns an unexpected status
- WHEN QA records the result
- THEN promotion closure is blocked and no write retry is attempted

### Requirement: PD-06 QA Authorization and Evidence Boundaries

QA MUST distinguish executable local checks, public read-only QA, authenticated provider actions, and destructive/write QA. Checkout submission, admin mutation, migration, seed, linking, and global CLI installation MUST NOT occur without explicit user authorization. Authenticated provider evidence MUST be read-only unless separately approved.

#### Scenario: Unapproved write test
- GIVEN a proposed QA step can create, change, or delete data or provider configuration
- WHEN explicit approval is absent
- THEN QA MUST skip it and record the approval dependency

#### Scenario: Approved production mutation
- GIVEN the user explicitly approves a bounded write test
- WHEN QA executes it
- THEN it records scope, actor, result, rollback outcome, and redacted evidence

### Requirement: PD-07 Rollback Readiness

Before promotion, the release record MUST define tested rollback actions for migration, backend, frontend, checkout, and email. Migration rollback MUST preserve data and use a forward fix when a destructive reversal is unsafe.

#### Scenario: Post-release regression
- GIVEN a smoke or approved QA failure after promotion
- WHEN rollback is initiated
- THEN the applicable frontend, backend, checkout, or email mitigation is recorded

#### Scenario: Migration regression
- GIVEN a migration-related regression is detected
- WHEN reversal risks persisted data
- THEN service promotion is halted and a safe forward remediation is required

### Requirement: PD-08 Reconciliation and Parent Closure

Final documentation and OpenSpec MUST reconcile deployed configuration, evidence, rollback status, and deferred approvals. Documentation and evidence MUST name provider variables only, never values. The parent change MUST NOT close until production evidence satisfies PD-01 through PD-07, **unless product explicitly supersedes that gate** (demo-only final).

#### Scenario: Closure review
- GIVEN all required production evidence is available
- WHEN documentation and OpenSpec are reconciled
- THEN the parent change may be closed with redacted references

#### Scenario: Missing evidence
- GIVEN any required production evidence or approval is absent
- WHEN closure is reviewed
- THEN the parent change remains open with the missing condition recorded

#### Scenario: Demo-only product supersession
- GIVEN product declares the Vercel mock portfolio demo as the final deliverable
- WHEN documentation records the supersession (`archive-parent-demo-only.md`) and waives Railway/API provider evidence
- THEN the parent change MAY close without PD-01..PD-07 provider execution; API revive requires a new change
