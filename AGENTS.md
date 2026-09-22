# Repository operating rule

All work in this repository must be preserved on GitHub.

- Before finishing any task that changes the repository, review `git status` and include every intended project change in a commit. Preserve pre-existing user work; never discard or overwrite it.
- Push the commit to `origin` on the current branch and verify that the local branch has no commits ahead of its upstream.
- A code-changing task is not complete until the push succeeds. If authentication, conflicts, branch protection, or connectivity prevents the push, report that clearly and leave the commit intact for recovery.
- Do not commit credentials, local environment files, generated dependency folders, or other ignored/private material merely to satisfy this rule.
- The repository uses `.githooks/post-commit` as an additional safeguard that automatically pushes newly created commits. Keep the hook enabled with `git config core.hooksPath .githooks`.
