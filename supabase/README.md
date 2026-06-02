# Supabase

This folder contains committed database migration artifacts for the Sadhana OS production architecture.

## Migrations

Apply migrations to each Supabase environment in order:

```text
supabase/migrations/20260601000000_initial_schema.sql
```

## Environment Strategy

Use separate Supabase projects for:

- Development
- Staging
- Production

Never expose service-role keys in frontend code. Frontend code may only use the public URL and anon key.

## Security Rules

- Every user-owned table must have row-level security enabled.
- Client policies must be scoped to `auth.uid()`.
- Normal users must not have delete policies for product data.
- Audit logs are append-only for normal users.
- Privileged account deletion belongs in a server-side function.
