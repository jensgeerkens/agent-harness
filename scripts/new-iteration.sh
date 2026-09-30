#!/usr/bin/env bash
# new-iteration.sh: legt Branch + Verzeichnisse für eine Iteration an.
# Usage (im Projekt-Root): new-iteration.sh <N>
# Basis: iter-(N-1) falls vorhanden, sonst aktueller HEAD. Überschreibt nie einen Branch.
set -euo pipefail
export MSYS_NO_PATHCONV=1

N_RAW="${1:?Iterationsnummer fehlt}"
N=$(printf "%03d" "$((10#$N_RAW))")
PREV=$(printf "%03d" "$((10#$N_RAW - 1))")

BRANCH="iter-$N"
PREV_BRANCH="iter-$PREV"

if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  echo "Branch $BRANCH existiert, checkout (Resume)."
  git checkout -q "$BRANCH"
elif git rev-parse --verify "$PREV_BRANCH" >/dev/null 2>&1; then
  git checkout -q "$PREV_BRANCH"
  git checkout -q -b "$BRANCH"
  echo "Branch $BRANCH von $PREV_BRANCH erstellt."
else
  git checkout -q -b "$BRANCH"
  echo "Branch $BRANCH von HEAD erstellt."
fi

mkdir -p "research/iter-$N" evals/screenshots scores validation errors
echo "OK: Iteration $N vorbereitet (research/iter-$N, evals, scores, validation, errors)."
