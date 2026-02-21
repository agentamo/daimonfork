#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/sync-fork-keep-agentamo.sh \
    --upstream-url <url> \
    --origin-url <url> \
    [--base-branch main] \
    [--work-branch <current-branch>] \
    [--resynced-branch <name>] \
    [--pick-regex <regex>]

What it does:
  1) Creates a backup branch from your current work branch.
  2) Configures/updates origin and upstream remotes.
  3) Fetches remotes and creates a clean branch from upstream/<base-branch>.
  4) Lists commits unique to your previous work branch.
  5) Optionally cherry-picks commits that match --pick-regex (oldest first).

Example:
  scripts/sync-fork-keep-agentamo.sh \
    --upstream-url git@github.com:ORIGINAL/REPO.git \
    --origin-url git@github.com:YOU/REPO.git \
    --base-branch main \
    --pick-regex 'agentamo|\\[daimon\\]'
USAGE
}

UPSTREAM_URL=""
ORIGIN_URL=""
BASE_BRANCH="main"
WORK_BRANCH=""
RESYNCED_BRANCH=""
PICK_REGEX=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --upstream-url)
      UPSTREAM_URL="${2:-}"; shift 2 ;;
    --origin-url)
      ORIGIN_URL="${2:-}"; shift 2 ;;
    --base-branch)
      BASE_BRANCH="${2:-}"; shift 2 ;;
    --work-branch)
      WORK_BRANCH="${2:-}"; shift 2 ;;
    --resynced-branch)
      RESYNCED_BRANCH="${2:-}"; shift 2 ;;
    --pick-regex)
      PICK_REGEX="${2:-}"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -z "$UPSTREAM_URL" || -z "$ORIGIN_URL" ]]; then
  echo "Error: --upstream-url and --origin-url are required." >&2
  usage
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: run this inside a git repo." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash first." >&2
  git status -sb
  exit 1
fi

if [[ -z "$WORK_BRANCH" ]]; then
  WORK_BRANCH="$(git branch --show-current)"
fi

if [[ -z "$WORK_BRANCH" ]]; then
  echo "Error: unable to determine current branch." >&2
  exit 1
fi

if [[ -z "$RESYNCED_BRANCH" ]]; then
  RESYNCED_BRANCH="${WORK_BRANCH}-resynced"
fi

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_BRANCH="backup/${WORK_BRANCH}-${TS}"

echo "==> Creating backup branch: ${BACKUP_BRANCH}"
git checkout "$WORK_BRANCH"
git branch "$BACKUP_BRANCH"

echo "==> Setting remotes"
if git remote get-url upstream >/dev/null 2>&1; then
  git remote set-url upstream "$UPSTREAM_URL"
else
  git remote add upstream "$UPSTREAM_URL"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$ORIGIN_URL"
else
  git remote add origin "$ORIGIN_URL"
fi

echo "==> Fetching origin + upstream"
git fetch --all --prune

echo "==> Creating fresh branch ${RESYNCED_BRANCH} from upstream/${BASE_BRANCH}"
if git show-ref --verify --quiet "refs/heads/${RESYNCED_BRANCH}"; then
  git branch -D "$RESYNCED_BRANCH"
fi

git checkout -b "$RESYNCED_BRANCH" "upstream/${BASE_BRANCH}"

echo "==> Commits on ${BACKUP_BRANCH} not in upstream/${BASE_BRANCH}:"
git log --oneline "upstream/${BASE_BRANCH}..${BACKUP_BRANCH}" || true

COMMITS_TO_PICK=""
if [[ -n "$PICK_REGEX" ]]; then
  COMMITS_TO_PICK="$(git log --reverse --pretty=format:%H "upstream/${BASE_BRANCH}..${BACKUP_BRANCH}" --grep "$PICK_REGEX" || true)"
fi

if [[ -n "$COMMITS_TO_PICK" ]]; then
  echo "==> Cherry-picking commits that match regex: ${PICK_REGEX}"
  while IFS= read -r sha; do
    [[ -z "$sha" ]] && continue
    echo "Cherry-picking $sha"
    if ! git cherry-pick "$sha"; then
      echo
      echo "Conflict detected while cherry-picking $sha"
      echo "Resolve conflicts, then run: git cherry-pick --continue"
      echo "Or abort with: git cherry-pick --abort"
      exit 2
    fi
  done <<< "$COMMITS_TO_PICK"
else
  echo "==> No auto cherry-picks selected."
fi

echo
cat <<DONE
Done.
- Backup branch: ${BACKUP_BRANCH}
- Clean branch:  ${RESYNCED_BRANCH}

Next steps:
1) Inspect differences:
   git diff --name-status upstream/${BASE_BRANCH}..${BACKUP_BRANCH}
2) Cherry-pick manually as needed:
   git cherry-pick <sha>
3) Push and open PR:
   git push -u origin ${RESYNCED_BRANCH}
DONE
