#!/usr/bin/env bash
set -euo pipefail

echo "# Data Files"
echo

find data -name '*.json' -type f | sort | while read -r file; do
  echo "## $file"
  echo
  echo '```json'
  cat "$file"
  echo
  echo '```'
  echo
done
