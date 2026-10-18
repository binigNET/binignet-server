#!/bin/sh
# One-time setup for the hldm service: copy stock maps/cfgs out of the image into
# ./hldm (bind mounts would hide them) and set ownership. Safe to re-run: never
# overwrites existing files.
#   admin (uid 1000) edits config/server.cfg, jk_botti.cfg, mapcycle.txt
#   hlds  (uid 999)  writes banned.cfg / listip.cfg (writeid / writeip)
set -eu
cd "$(dirname "$0")/.."
IMAGE=$(docker compose config --images hldm)
mkdir -p hldm
docker run --rm --user 0:0 --entrypoint sh -v "$PWD/hldm:/seed" "$IMAGE" -c '
set -eu
V=/opt/steam/hlds/valve
S=/seed
[ -e $S/maps ] || cp -a $V/maps $S/maps
[ -e $S/mapcycle.txt ] || cp $V/mapcycle.txt $S/
[ -e $S/jk_botti.cfg ] || cp $V/addons/jk_botti/jk_botti.cfg $S/
mkdir -p $S/config
[ -e $S/config/server.cfg ] || cat > $S/config/server.cfg <<CFG
// executed last on every map change (valve/server.cfg -> default.cfg -> this)
hostname "binignet HLDM"
log on
sv_logecho 1
CFG
touch $S/banned.cfg $S/listip.cfg
chown 1000:1000 $S
chown -R 1000:1000 $S/maps $S/config $S/mapcycle.txt $S/jk_botti.cfg
chown 999:999 $S/banned.cfg $S/listip.cfg
'
echo "seeded ./hldm"
