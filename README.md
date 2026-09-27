# 🕶 PVPGN PRO ➕ AURA BOT ➕ WEB STATS

![Status](https://img.shields.io/badge/status-active-success.svg)
[![GitHub Issues](https://img.shields.io/github/issues/acollazo25/pvpgn-ghost-docker.svg)](https://github.com/acollazo25/pvpgn-ghost-docker/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/wwmoraes/pvpgn-server-docker.svg)](https://github.com/acollazo25/pvpgn-ghost-docker/pulls)
---

## Deployment (WINDOWS / LINUX / MAC)

> **ℹ️ NOTE:** The game host bot is [Aura](https://github.com/jasjamjos/aura-bot) (image `jasjamjos/aura-bot`), built for the ***Warcraft 1.26a*** client only. Maps live in `aura/data/maps`.

### 🛠 Requirements
1. [Docker](https://www.docker.com/products/docker-desktop)
2. [Docker Compose](https://docs.docker.com/compose/install/)

### ⬇️ Clone repo (*)

```shell
git clone https://github.com/acollazo25/pvpgn-ghost-docker.git
cd pvpgn-ghost-docker
```

### 📦 Export pvpgn data (LINUX / MAC)

```shell
mkdir "pvpgn"
docker run --rm -v $PWD/pvpgn/var:/tmp/var ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/var/pvpgn /tmp/var
docker run --rm -v $PWD/pvpgn/etc:/tmp/etc ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/etc/pvpgn /tmp/etc
```

### 📦 Export pvpgn data (WINDOWS)

```shell
mkdir "pvpgn"
docker run --rm -v %CD%/pvpgn/var:/tmp/var ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/var/pvpgn /tmp/var
docker run --rm -v %CD%/pvpgn/etc:/tmp/etc ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/etc/pvpgn /tmp/etc
```

### ⚙ Copy default config (*)
1. Copy `.env.example` to `.env` and fill it in.
```shell
cp .env.example .env
```
```shell
PUBLIC_IP=<your-public-ip>          # used for pvpgn address translation
AURA_REALM1_USERNAME=binignet_aura  # bot account, auto-registered on first login
AURA_REALM1_PASSWORD=<bot-password>
AURA_REALM1_SUDO_USERS=yes          # root admins, comma-separated
```
2. Copy `pvpgn/.env.example` to `pvpgn/.env`.  Configure the `pvpgn/.env` for the [ssl termination](https://github.com/evertramos/nginx-proxy-automation) of the statistics website, otherwise you can ignore it and continue with the next step.
> Even if SSL termination is not configured the `pvpgn/.env` file **must exist** in the root of the directory.
```shell
cp pvpgn/.env.example pvpgn/.env
```
⚠ If SSL termination is not configured you must create a default proxy network.
```shell
docker network create proxy
```

### 🚚 Setup Pvpgn Database (*)
1. Edit the file `pvpgn/etc/pvpgn/bnetd.conf` and set the following settings.
```shell
storage_path = "sql:mode=mysql;host=pvpgn-db;name=bnetd;user=bnetd;pass=secret;default=0;prefix=pvpgn_"
```
1. Up pvpgn database.
```shell
docker compose up -d pvpgn-db
```

### 🚩 Start pvpgn and aura services (*)

The aura container runs as uid 1000, so it must own its data folder.
```shell
sudo chown -R 1000:1000 aura/data
docker compose up -d pvpgn aura
```
- pvpgn writes `<aura-ip>:6320 <PUBLIC_IP>:6320 NONE ANY` to `pvpgn/etc/pvpgn/address_translation.conf` on every start, so players can join games hosted by aura.
- The bot registers its account on first login. Check `docker compose logs aura` for `logged in as [binignet_aura]`.
- Open TCP `6112` (pvpgn) and `6320` (aura games) in your firewall.

### 🎮 Invite friends and play (*)

1. Add the gateway to your battlenet servers `<your-public-ip>`.
2. You and your friends can now create an account and ask the bot to host a game by whispering it:
```shell
/w binignet_aura !host dota lod, my game name
```

### 👮‍♂️ Adding root admins

1. Set `AURA_REALM1_SUDO_USERS` in `.env` (comma-separated pvpgn usernames).
2. Recreate the bot `docker compose up -d aura`

### 🗺 Adding maps

1. Copy the `.w3x` file into `aura/data/maps`.
2. Host it with `!host <part of map name>, <game name>`. Aura generates its map config in `aura/data/mapcfgs` on first use.

### 🕹 Commands (*)

1. To see the list of available commands visit [Aura Commands](https://github.com/jasjamjos/aura-bot/blob/master/COMMANDS.md)

### 🔁 Migrating from Ghost++

Ghost++ and its MySQL database (`ghostpp-db`) and dota-stats were removed; aura stores its data in SQLite at `aura/data/aura.db`. Old ghost stats, bans and admins are not migrated.
1. [Optional] Archive old ghost data before switching:
```shell
docker exec ghostpp_databse mysqldump -ughost -psecret ghost > ghost-backup.sql
```
2. Pull and recreate, removing old containers:
```shell
docker compose up -d --remove-orphans
```

### 📊 [Optional] Setup Pvpgn Stats (*)
1. Copy `pvpgn-stats/config.inc.example.php` to `pvpgn-stats/config.inc.php`.
```shell
cp pvpgn-stats/config.inc.example.php pvpgn-stats/config.inc.php
```
```shell
server_URL = http://<your-public-ip>:8081/
```
2. Edit `pvpgn-stats/config.inc.php` and set the following settings.
# SSL Configured
$homepage = "https://stats-domain.com/";
$ladderroot = "https://stats-domain.com/"; # include last /
...
```
3. Up pvpgn stats.
```shell
docker compose up -d pvpgn-stats
```
4. Run Seeders.
```shell
docker exec -i pvpgn_databse mysql -ubnetd -psecret bnetd < pvpgn-stats/migrations/d2ladder.sql
docker exec -i pvpgn_databse mysql -ubnetd -psecret bnetd < pvpgn-stats/migrations/stats.sql
```
5. Open in browser [Pvpgn Stats](🌐 http://127.0.0.1:9082/)

### 📄 View Logs (*)
#### Pvpgn Logs
```shell
docker compose logs -f --tail 200 pvpgn
```
#### Aura Logs
```shell
docker compose logs -f --tail 200 aura
```

### ✉️ Contact
[Creating an issue](https://github.com/acollazo25/pvpgn-ghost-docker/issues)

### 🎉 Acknowledgements
-   [🙌 Pvpgn Official Page](https://pvpgn.pro/)
-   [🙌 Pvpgn Stable Repo](https://github.com/pvpgn/pvpgn-server)
-   [🙌 Pvpgn Docker Repo](https://github.com/wwmoraes/pvpgn-server-docker)
-   [🙌 Aura Repo](https://github.com/jasjamjos/aura-bot)
