# Repository operating rule

All work in this repository must be preserved on GitHub.

- Before finishing any task that changes the repository, review `git status` and include every intended project change in a commit. Preserve pre-existing user work; never discard or overwrite it.
- Push the commit to `origin` on the current branch and verify that the local branch has no commits ahead of its upstream.
- A code-changing task is not complete until the push succeeds. If authentication, conflicts, branch protection, or connectivity prevents the push, report that clearly and leave the commit intact for recovery.
- Do not commit credentials, local environment files, generated dependency folders, or other ignored/private material merely to satisfy this rule.
- The repository uses `.githooks/post-commit` as an additional safeguard that automatically pushes newly created commits. Keep the hook enabled with `git config core.hooksPath .githooks`.

# Development session startup rule

This rule applies to every chat and agent working on Kavanah, including temporary checkouts and worktrees.

- Before starting Expo, Metro, a web preview, Expo Go, or an iOS/Android emulator session, inspect listening ports, process commands/working directories, and running simulators for existing Kavanah sessions.
- Stop existing Kavanah development servers and their child processes gracefully; verify they exited and released their ports before starting a replacement. Do not work around an old session by silently choosing another port. Use force termination only if an identified project process will not stop normally.
- Close the existing Kavanah/Expo Go preview and shut down any simulator or emulator used by the previous Kavanah session before launching one fresh target. Do not erase device data. Leave unrelated projects, apps, databases, and macOS services alone unless the user explicitly requests otherwise.
- Keep only one Kavanah development server and one requested native preview target running. Check the Metro status endpoint and confirm the app actually loads; report the runtime checkout, port/URL, device, and any limitations.
- If cloud-only files in Documents stall startup, use a fully local runtime checkout with the intended source changes preserved. Keep dependencies inside that checkout; an external node_modules symlink can make Metro scan outside the project. Never preview an older commit without disclosing it.

# Interface consistency rule

For all UI changes, follow `docs/design-system.md`. Use shared surface, choice, button, and screen primitives; do not introduce square selected backgrounds, redundant card outlines, or duplicate safe-area/header ownership. Verify the changed states in the live iOS preview, including readable contrast, scroll clearance, and reduced motion for new animations. Keep loading feedback tied to actual work and remove temporary visual-test overrides before committing.
