# Isolated logical recovery procedure — approval draft

This is a preparation document. No real database export, source credentials, restored personal data, or production connection is included. A fresh logical export tests that export; it does not test Supabase's scheduled physical backup.

## Approval scope to supply before real data access

The coordinating task must obtain one exact approval covering:

1. Read-only logical export from **Kavanah Development**, project `wrbbmrzwssefrjrzakth`, with the confirmed PostgreSQL major version. No OnHand data, no source SQL writes, no source restore or cutover.
2. Data included: Kavanah's application `public` and `private` schemas, Auth users/identities and other required Auth records, migration history, and password-free role/grant definitions. Enumerate any other required schemas/extensions after read-only inventory. Exclude database-role passwords and unrelated provider secrets. Auth records themselves remain highly sensitive.
3. An owner-approved **encrypted, non-synced local destination**, exact authorized operators, maximum export size/storage, and deadline for deleting the temporary copy. Do not place real exports in this Documents checkout, Git, Library, shared folders, chat attachments or logs. A private plaintext `/tmp` file alone is not an approved durable backup strategy.
4. Credential delivery through an existing authorized local secret mechanism, without printing it or putting it in a command line, report or commit. No new service role, persistent access, firewall exception, secret rotation or permission changes are part of this approval.
5. A temporary local destination with no network, no published ports, no source credential mounted, no connection to OnHand or production, and explicit CPU/memory/PID/storage bounds appropriate to the approved export size. No paid cloud clone, purchase or new provider agreement.
6. Tests may mutate **only the isolated restored copy**, including synthetic identity/policy fixtures and a deletion test inside a transaction or disposable copy. No real external Auth sign-in, email/SMS delivery, production API request or traffic cutover is part of this drill.

Suggested approval wording, after filling in the missing values:

> Approve a read-only logical export of the listed Kavanah schemas from the confirmed source into [encrypted local path], accessible only to [operators], up to [size], retained until [deadline]. Restore only inside the bounded local Docker container with networking disabled, test the isolated copy, and delete the temporary data afterward. No source mutations, external sends, additional services, paid resources, or cutover.

If access or secure storage is unavailable, stop before export. Do not request secrets in chat or create broader access as a workaround.

## Preflight

- Reconfirm the Docker context is local and inspect `DOCKER_HOST` / `DOCKER_CONTEXT` for overrides without exposing credentials. October 13 evidence confirmed `desktop-linux`, `unix:///Users/leeoniisrael/.docker/run/docker.sock`, both overrides unset, Engine 25.0.3 / Docker Desktop. Recheck before handling real data.
- Inventory existing containers. Use a uniquely named/labeled Kavanah test container; never stop, mount, inspect application data from, or reuse an OnHand database.
- Confirm source version, dump format, extensions, roles, schemas, Auth coverage, current jobs/hooks and any Vault/key requirements. The prior October 9 hook review is historical evidence, not a current complete inventory.
- Choose a verified image compatible with the source major version/extensions. The available PostgreSQL 17 image used for synthetic tests has digest `sha256:0450166354dc9c1d25f0322ac8b580774d4fb0184d2b087f6e4fe9499c66cf53`; that does not establish compatibility with a newly exported source. Fetch tools/images before creating the network-disabled destination.
- Keep an encrypted private manifest with export start/end time, source/version, included schema/table list, source counts from a consistent snapshot where available, cryptographic checksum, size and exclusions. Never copy row data, identifiers, tokens or function bodies into the public audit report. Cross-snapshot counts can legitimately differ and do not prove a broken restore.

## Export and containment

- Use the approved read-only export mechanism and a consistent database snapshot. Verify Auth data and `private` records are included; public/schema-only exports are insufficient. Do not run speculative source queries, reset passwords, create roles or change server settings to make export work.
- Keep credentials out of the destination. Before loading any SQL, create a fresh isolated database through a custom entrypoint, not a cloned application's startup scripts. Configure `--network none`, no port publication, `--cap-drop ALL`, `--security-opt no-new-privileges`, bounded resources, read-only root filesystem where compatible, and a dedicated temporary writable database area. Mount only the approved export read-only. Do not mount the Docker socket, home directory, source repository, credentials, or unrelated data.
- Inspect the created container's effective network mode, mounts, privileges and ports **before** restoration. Reject any mismatch. Keep logs local/private; turn off shell tracing and avoid dumping errors that contain statement/data contents into chat.
- Treat restored SQL/functions as executable untrusted input. Review extension and role handling. Preserve/reconstruct required ownership and grants deliberately; do not silence restore errors with blanket `--no-owner`, drop policies, grant superuser to client roles, enable network or silently skip failed objects to obtain a green test.
- Restore with stop-on-error semantics. Capture failures privately, identify the exact missing dependency or incompatibility, and decide on a bounded repair to the isolated copy only. A partial restore is a failure, not acceptance.

## Acceptance inside the isolated copy

Record pass/fail and sanitized aggregates for:

- Required schemas, Auth users/identities, migration history, roles and ownership; table and relationship counts, constraints, indexes, sequences, functions, RLS flags and grants.
- The repository's read-only installed-safeguard verification queries, with expected source version checked first.
- Two synthetic identities under the app's database-role/JWT-claim semantics: own-record access, cross-account denial, anonymous denial, blocked visibility, sharing choices, stable pagination, deletion cascades and concurrency. These database tests still do not prove hosted Supabase Auth/PostgREST behavior.
- No copied jobs/webhooks/extensions can contact an external service. Keep the assistant disabled. Reconcile assistant consumption conservatively before any future service restoration; never reset its lifetime counter to restore availability.
- Known deletions/sharing changes after the exported snapshot. If a reliable reconciliation record is missing, label public restoration blocked. Do not infer completeness from absence of log events.
- Actual elapsed export/restore/verification time, recoverable data cutoff and observed failure/retry behavior. Compare against the owner's explicitly accepted RPO/RTO; do not invent those objectives.

## Disposal and evidence

- Remove only the dedicated test container and its dedicated writable storage. Confirm no test container, anonymous volume, writable mount or temporary plaintext copy remains. Dispose of the temporary export at the approved deadline; retain a durable encrypted backup only under a separately accepted retention plan.
- Publish only sanitized outcome, checksum if approved, versions, counts/check totals, timing, exclusions and blockers. Do not publish dumps, SQL bodies, Auth rows, tokens or identity-level diffs.
- Leave source services and existing Docker containers unchanged. Do not stop the shared Docker engine as cleanup.
- Keep scheduled-backup recovery, hosted two-account acceptance, signed-device QA and any production cutover as separate unchecked gates with their own scope/approval.
