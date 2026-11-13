# Security regression checks

Run with Deno 2:

```sh
deno test --allow-read --allow-env --lock=tests/deno.lock tests
```

The DOM tests use LinkeDOM. The tick-gate test executes the migration in an isolated
PGlite PostgreSQL database: it checks competing admissions, cooldown after release,
expired/superseded tokens, duplicate commits, transaction rollback, and RPC permissions.
No test connects to production. The handler tests exercise the real request-validation
prefix with a mocked admission RPC. Full production simulation is not executed here.
