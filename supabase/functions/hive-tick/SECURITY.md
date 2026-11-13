# Tick admission and deployment

Apply `supabase/migrations/20261113160000_atomic_hive_ticks.sql` before deploying
this function. The migration is additive and may be applied while the old function
is still running. It does not change the existing Hive state or history.

Every valid request must acquire the singleton database gate before reading Hive
state. Only one lease can be active. Admission uses the database clock and enforces
one-second interaction / five-second ordinary-tick cooldowns across all isolates.
A crashed worker's lease expires after 90 seconds. The commit checks its token and
expiry under a row lock; state, births, deaths, and existing retention cleanup commit
in one transaction. Duplicate commits are rejected. Broadcasts follow successful
commit and the lease is released in `finally`.

The admission and commit RPCs are executable only by `service_role`. The gate table
is not readable or writable by anonymous or authenticated clients. Public requests
still incur Edge invocation and small admission-query costs. This is application
rate limiting, not upstream volumetric DDoS protection.

Validation: run `deno test --allow-read --allow-env --lock=tests/deno.lock tests`.
The existing unrelated hive-tick type diagnostics remain separate follow-up work.

Rollback: redeploy the previous Edge function source. Leave the additive table/RPCs
in place until no new worker is active; do not delete business state or history.
