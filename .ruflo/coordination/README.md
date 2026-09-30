# Coordination records (fallback store)

Ruflo's native task store is not initialized in this repository (see
`docs/reports/txt/ruflo-orchestration-foundation.txt`). This folder is the
lightweight, file-based fallback. No database service.

- `baselines.json`      approved baseline registry (committed)
- `tasks/<TASK>.json`   one record per task (committed)
- `locks/<TASK>.lock`   ephemeral runtime lock (git-ignored, never committed)

Rules: see `docs/AGENT-GOVERNANCE.md`. Task `status` is one of READY, ACTIVE,
REVIEW, BLOCKED, MERGE_READY, CLOSED, PAUSED, RECONCILIATION_REQUIRED.

Create a lock atomically. It fails if one already exists; never overwrite it
and never take it over:

    set -o noclobber
    printf '%s\n' "TASK=<id>" "WORKTREE=<path>" "BRANCH=<branch>" \
      "WRITE_OWNER=<agent>" "STATUS=ACTIVE" "STARTED=$(date -u +%FT%TZ)" \
      "LAST_SEEN=$(date -u +%FT%TZ)" > .ruflo/coordination/locks/<id>.lock
