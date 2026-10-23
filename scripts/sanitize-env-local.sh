#!/usr/bin/env bash
# Strip from .env.local every EXPO_PUBLIC_* key the caller already owns.
#
# Why this exists
# ───────────────
# The build and publish npm scripts all start with
#
#     export $(cat .env.local | xargs) && eas ...
#
# and `export FOO=bar` beats an inherited value. So every stage variable the
# workflows set — EXPO_PUBLIC_APP_STAGE, the websocket host, the Firestore
# database id — was silently replaced by whatever the ENV_LOCAL_FILE secret
# happened to carry. A prod build decoded a dev `.env.local` and shipped as dev:
# dev database, dev websocket, Branch TEST keys. Nothing failed, because the
# binary and the OTA bundle were wrong in exactly the same way, which is the one
# divergence the rest of this system checks for.
#
# Run this from inside the step that exports those variables, right before the
# npm script. Anything the step's `env:` block declares is CI-owned and wins;
# everything else in .env.local (Stream, Maps, GrowthBook, Razorpay, FCM) is
# local-only config and survives untouched.
#
# Deriving the list from the live environment rather than hardcoding it is
# deliberate: a new EXPO_PUBLIC_* var added to a workflow is covered the day it
# lands, with no second place to remember.
#
# A CI-owned key that resolves to an empty string still wins. "CI owns this" is
# the whole point — falling back to a stale committed value would put us back
# where we started, just less visibly.
set -euo pipefail

FILE="${1:-.env.local}"
[ -f "$FILE" ] || { echo "[sanitize-env-local] no $FILE; nothing to do"; exit 0; }

removed=()
tmp="$(mktemp)"

while IFS= read -r line || [ -n "$line" ]; do
    key="${line%%=*}"
    # Keep blanks, comments, and anything that is not a KEY=VALUE assignment.
    if [[ ! "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
        printf '%s\n' "$line" >> "$tmp"
        continue
    fi
    # Only EXPO_PUBLIC_* is ever workflow-owned; leave private keys alone.
    if [[ "$key" == EXPO_PUBLIC_* ]] && [ -n "${!key+set}" ]; then
        removed+=("$key")
        continue
    fi
    printf '%s\n' "$line" >> "$tmp"
done < "$FILE"

mv "$tmp" "$FILE"

if [ "${#removed[@]}" -eq 0 ]; then
    echo "[sanitize-env-local] $FILE defines no CI-owned keys"
    exit 0
fi

echo "[sanitize-env-local] dropped ${#removed[@]} CI-owned key(s) from $FILE:"
for k in "${removed[@]}"; do
    echo "  - $k (now: ${!k:-<empty>})"
    # Visible on every run until the ENV_LOCAL_FILE secret stops carrying them.
    echo "::warning::$FILE defines $k, which this workflow also sets. Using the workflow's value; remove $k from the ENV_LOCAL_FILE secret."
done

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
        echo "### \`.env.local\` keys overridden by the workflow"
        echo ""
        echo "| key | workflow value |"
        echo "|---|---|"
        for k in "${removed[@]}"; do
            # Secrets never reach this file — these are all EXPO_PUBLIC_*, which
            # ship inside the bundle regardless — but keep the stage-shaped ones
            # readable and leave the rest as a presence check.
            case "$k" in
                EXPO_PUBLIC_APP_STAGE|EXPO_PUBLIC_FIRESTORE_DATABASE_ID|EXPO_PUBLIC_WEBSOCKET_TRENDLY)
                    echo "| \`$k\` | \`${!k:-<empty>}\` |" ;;
                *)
                    echo "| \`$k\` | $([ -n "${!k:-}" ] && echo 'set' || echo '**empty**') |" ;;
            esac
        done
        echo ""
        echo "Remove these from the \`ENV_LOCAL_FILE\` secret — the workflow owns them."
    } >> "$GITHUB_STEP_SUMMARY"
fi
