#!/usr/bin/env bash
set -euo pipefail

echo "# File Structure"
echo
echo '```text'

if command -v tree >/dev/null 2>&1; then
  tree -I "node_modules|.git"
else
  find . \
    -path "./.git" -prune -o \
    -path "./node_modules" -prune -o \
    -print | sort
fi

echo '```'
