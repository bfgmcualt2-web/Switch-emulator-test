#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Publish this repository to GitHub.

Usage:
  scripts/publish-to-github.sh <git-remote-url> [branch]
  scripts/publish-to-github.sh --create <owner/repo> [branch]

Examples:
  scripts/publish-to-github.sh git@github.com:YOUR-USERNAME/Switch-emulator-test.git main
  scripts/publish-to-github.sh https://github.com/YOUR-USERNAME/Switch-emulator-test.git main
  scripts/publish-to-github.sh --create YOUR-USERNAME/Switch-emulator-test main

Notes:
  - The script never commits for you; commit first, then publish.
  - --create requires the GitHub CLI (`gh`) to be installed and authenticated.
  - If an origin remote already exists, the script leaves it in place and pushes to it.
USAGE
}

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: run this script inside a git repository" >&2
  exit 1
fi

current_branch="$(git branch --show-current)"
branch="${2:-${current_branch:-main}}"

if [[ -z "$branch" ]]; then
  echo "error: could not determine a branch name; pass one explicitly" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree has uncommitted changes; commit them before publishing" >&2
  git status --short
  exit 1
fi

if [[ "$1" == "--create" ]]; then
  if [[ $# -lt 2 ]]; then
    echo "error: --create requires <owner/repo>" >&2
    usage
    exit 1
  fi
  repo="$2"
  branch="${3:-${current_branch:-main}}"
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: GitHub CLI (gh) is required for --create" >&2
    exit 1
  fi
  if ! git remote get-url origin >/dev/null 2>&1; then
    gh repo create "$repo" --source=. --remote=origin --private --push
  else
    echo "origin already exists: $(git remote get-url origin)"
    git push -u origin "$branch"
  fi
else
  remote_url="$1"
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$remote_url"
  else
    echo "origin already exists: $(git remote get-url origin)"
  fi
  git push -u origin "$branch"
fi

echo "Published branch '$branch' to GitHub."
