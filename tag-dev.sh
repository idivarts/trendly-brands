#!/usr/bin/env bash
set -euo pipefail

git fetch --tags --quiet origin

latest=$(git tag -l 'dev-[0-9]*' \
  | grep -E '^dev-[0-9]+$' \
  | sed 's/^dev-//' \
  | sort -n \
  | tail -1)

next=$(( ${latest:-0} + 1 ))
tag="dev-${next}"

echo "Latest: dev-${latest:-<none>}  ->  Next: ${tag}"

git tag "${tag}"
git push origin "${tag}"

echo "Pushed ${tag} to origin."
