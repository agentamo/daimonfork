# Sync fork to upstream while keeping agentamo updates

Use this when GitHub says your branch is behind/diverged and resolving in the UI is painful.

## One-command helper

```bash
scripts/sync-fork-keep-agentamo.sh \
  --upstream-url git@github.com:UPSTREAM_OWNER/REPO.git \
  --origin-url git@github.com:YOUR_OWNER/REPO.git \
  --base-branch main \
  --pick-regex 'agentamo|\[daimon\]'
```

What this does:

1. Creates a backup branch from your current branch (`backup/<branch>-<timestamp>`).
2. Sets/updates `upstream` and `origin` remotes.
3. Fetches remotes.
4. Creates a fresh `<branch>-resynced` branch from `upstream/main`.
5. Optionally cherry-picks commits whose message matches `--pick-regex`.

If a conflict appears during cherry-pick:

```bash
git status
# edit conflicted files
git add <resolved-files>
git cherry-pick --continue
```

Or abort that cherry-pick:

```bash
git cherry-pick --abort
```

## Manual fallback

```bash
git checkout <your-branch>
git branch backup/<your-branch>-before-sync

git remote add upstream <upstream-url> # if missing
git remote add origin <fork-url>       # if missing
git fetch --all --prune

git checkout -b <your-branch>-resynced upstream/main
git log --oneline upstream/main..backup/<your-branch>-before-sync
# cherry-pick wanted commits one-by-one
```
