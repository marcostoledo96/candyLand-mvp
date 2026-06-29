# Spec — Backend Railway + PostgreSQL

## Goal

Mover el backend de CandyLand a Railway como servicio Node.js/Express long-running y usar PostgreSQL Railway como única base.

## Requirements

### Scenario: Backend starts on Railway

Given Railway injects `PORT`  
When the backend starts  
Then it MUST listen on `process.env.PORT` and host `0.0.0.0`.

### Scenario: Database uses Railway PostgreSQL

Given `DATABASE_URL` is configured in Railway  
When Prisma connects  
Then it MUST use PostgreSQL and SHOULD NOT depend on Neon.

### Scenario: Production migrations

Given a production deploy is running  
When schema changes exist  
Then Prisma migrations MUST be applied with `prisma migrate deploy`.

### Scenario: Seed is manual

Given a Railway deploy runs  
When the backend starts  
Then it MUST NOT seed automatically unless explicitly invoked.

### Scenario: CORS

Given the frontend is deployed at `https://candy-land-mvp.vercel.app`  
When the frontend calls the API  
Then the backend MUST allow that origin and local development origin.

## Acceptance checklist

```text
[ ] backend/package.json has start/dev/prisma scripts
[ ] server.js uses process.env.PORT
[ ] DATABASE_URL is Railway PostgreSQL
[ ] /api/health works
[ ] /api/db/health works
[ ] /api/productos works
[ ] seed is manual
[ ] CORS configured by CORS_ORIGIN
```
