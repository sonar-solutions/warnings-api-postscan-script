#!/usr/bin/env bash
set -euo pipefail

BINARY_NAME="warnings-api-postscan-script"
NODE_MAJOR=$(node -e "console.log(process.version.split('.')[0].replace('v',''))")

echo "Detected Node.js $(node --version) (major: $NODE_MAJOR)"

mkdir -p dist

if [[ "$NODE_MAJOR" -ge 25 ]]; then
    echo "Using --build-sea (Node v25.5+)..."

    OS="$(uname -s)"
    case "$OS" in
        Darwin) OUTPUT="dist/${BINARY_NAME}-macos" ;;
        Linux)  OUTPUT="dist/${BINARY_NAME}-linux" ;;
        MINGW*|MSYS*|CYGWIN*) OUTPUT="dist/${BINARY_NAME}-win.exe" ;;
        *) echo "Unsupported OS: $OS"; exit 1 ;;
    esac

    ARCH="$(uname -m)"
    case "$ARCH" in
        x86_64|amd64) OUTPUT="${OUTPUT}-x64" ;;
        arm64|aarch64) OUTPUT="${OUTPUT}-arm64" ;;
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    if [[ "$OS" == MINGW* || "$OS" == MSYS* || "$OS" == CYGWIN* ]]; then
        OUTPUT="${OUTPUT}.exe"
    fi

    cat > sea-config-build.json <<EOF
{
  "main": "index.js",
  "output": "$OUTPUT",
  "disableExperimentalSEAWarning": true,
  "useCodeCache": true
}
EOF

    node --build-sea sea-config-build.json
    rm -f sea-config-build.json

    if [[ "$(uname -s)" = "Darwin" ]]; then
        codesign --sign - "$OUTPUT" 2>/dev/null || echo "Warning: codesign failed (ad-hoc signing). Binary may still work."
    fi

else
    echo "Using --experimental-sea-config + postject (Node v20+)..."

    node --experimental-sea-config sea-config.json

    OS="$(uname -s)"
    case "$OS" in
        Darwin) OUTPUT="dist/${BINARY_NAME}-macos" ;;
        Linux)  OUTPUT="dist/${BINARY_NAME}-linux" ;;
        MINGW*|MSYS*|CYGWIN*) OUTPUT="dist/${BINARY_NAME}-win.exe" ;;
        *) echo "Unsupported OS: $OS"; exit 1 ;;
    esac

    ARCH="$(uname -m)"
    case "$ARCH" in
        x86_64|amd64) OUTPUT="${OUTPUT}-x64" ;;
        arm64|aarch64) OUTPUT="${OUTPUT}-arm64" ;;
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    if [[ "$OS" == MINGW* || "$OS" == MSYS* || "$OS" == CYGWIN* ]]; then
        OUTPUT="${OUTPUT}.exe"
    fi

    cp "$(command -v node)" "$OUTPUT"

    if [[ "$(uname -s)" = "Darwin" ]]; then
        codesign --remove-signature "$OUTPUT" 2>/dev/null || true
    fi

    npx --yes postject "$OUTPUT" NODE_SEA_BLOB sea-prep.blob \
        --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6

    if [[ "$(uname -s)" = "Darwin" ]]; then
        codesign --sign - "$OUTPUT" 2>/dev/null || echo "Warning: codesign failed (ad-hoc signing). Binary may still work."
    fi

    rm -f sea-prep.blob
fi

chmod +x "$OUTPUT"
echo ""
echo "Build complete: $OUTPUT"
echo "Run with: $OUTPUT"
