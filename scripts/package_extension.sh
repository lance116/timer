#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

version="$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')"
package="dist/life-timer-${version}.zip"

mkdir -p dist

if [[ -e "$package" ]]; then
  echo "Package already exists: $package" >&2
  exit 1
fi

COPYFILE_DISABLE=1 zip -r -X "$package" \
  manifest.json \
  newtab.html \
  newtab.js \
  styles.css \
  popup.html \
  popup.js \
  popup.css \
  assets/icons

echo "$package"
