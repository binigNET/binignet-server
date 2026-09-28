#!/bin/sh
set -eu

: "${DB_HOST:=pvpgn-db}"
: "${DB_NAME:=bnetd}"
: "${DB_USER:=bnetd}"
: "${DB_PASS:=secret}"
: "${DB_PREFIX:=pvpgn_}"
: "${AURA_HOST:=aura}"

TMPL=/usr/local/share/pvpgn/templates
ETC=/usr/local/etc/pvpgn

if [ -z "${PUBLIC_IP:-}" ]; then
  echo "ERROR: PUBLIC_IP not set (use 127.0.0.1 for local dev)" >&2
  exit 1
fi

# escape sed replacement specials: \ | &
esc() { printf '%s' "$1" | sed -e 's/[\\|&]/\\&/g'; }

echo "Rendering bnetd.conf (db ${DB_USER}@${DB_HOST}/${DB_NAME})..."
sed -e "s|@DB_HOST@|$(esc "$DB_HOST")|" \
    -e "s|@DB_NAME@|$(esc "$DB_NAME")|" \
    -e "s|@DB_USER@|$(esc "$DB_USER")|" \
    -e "s|@DB_PASS@|$(esc "$DB_PASS")|" \
    -e "s|@DB_PREFIX@|$(esc "$DB_PREFIX")|" \
    "$TMPL/bnetd.conf" > "$ETC/bnetd.conf"

echo "Resolving ${AURA_HOST}..."
AURA_IP=""
i=0
while [ $i -lt 30 ]; do
  AURA_IP=$(getent hosts "$AURA_HOST" | awk '{ print $1; exit }') || true
  [ -n "$AURA_IP" ] && break
  i=$((i + 1))
  sleep 1
done
if [ -z "$AURA_IP" ]; then
  echo "ERROR: could not resolve ${AURA_HOST} after 30s" >&2
  exit 1
fi

echo "Address translation: ${AURA_IP}:6320 -> ${PUBLIC_IP}:6320"
cp "$TMPL/address_translation.conf" "$ETC/address_translation.conf"
echo "${AURA_IP}:6320 ${PUBLIC_IP}:6320 NONE ANY" >> "$ETC/address_translation.conf"

echo "Starting PvPGN..."
exec /usr/local/sbin/bnetd -f
