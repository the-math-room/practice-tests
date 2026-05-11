#!/usr/bin/env bash
set -euo pipefail

echo "# Source Code"
echo

for file in index.html style.css js/*.js; do
  if [ -f "$file" ]; then
    echo "## $file"
    echo
    echo '```'
    cat "$file"
    echo
    echo '```'
    echo
  fi
done
