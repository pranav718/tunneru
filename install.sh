#!/usr/bin/env bash

set -e

REPO="pranav718/tunneru"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="tunneru"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64)
    ARCH="amd64"
    ;;
  arm64|aarch64)
    ARCH="arm64"
    ;;
  *)
    echo "unsupported architecture: $ARCH"
    exit 1
    ;;
esac

case "$OS" in
  darwin|linux)
    ;;
  *)
    echo "unsupported operating system: $OS"
    exit 1
    ;;
esac

echo "installing tunneru ($OS/$ARCH)..."

if command -v go >/dev/null 2>&1; then
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT
  git clone --depth 1 "https://github.com/${REPO}.git" "$TMP_DIR/tunneru"
  cd "$TMP_DIR/tunneru"
  go build -ldflags="-s -w" -o "$TMP_DIR/$BINARY_NAME" ./cmd/client
  if [ -w "$INSTALL_DIR" ]; then
    mv "$TMP_DIR/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
  else
    sudo mv "$TMP_DIR/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
  fi
else
  RELEASE_URL="https://github.com/${REPO}/releases/latest/download/tunneru_${OS}_${ARCH}.tar.gz"
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT
  curl -fsSL "$RELEASE_URL" -o "$TMP_DIR/tunneru.tar.gz"
  tar -xzf "$TMP_DIR/tunneru.tar.gz" -C "$TMP_DIR"
  if [ -w "$INSTALL_DIR" ]; then
    mv "$TMP_DIR/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
  else
    sudo mv "$TMP_DIR/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
  fi
fi

chmod +x "$INSTALL_DIR/$BINARY_NAME"
echo "successfully installed tunneru to $INSTALL_DIR/$BINARY_NAME"
"$INSTALL_DIR/$BINARY_NAME" --help
