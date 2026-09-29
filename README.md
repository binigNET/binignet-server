# 🕶 PVPGN PRO ➕ AURA BOT ➕ WEB STATS

![Status](https://img.shields.io/badge/status-active-success.svg)
[![GitHub Issues](https://img.shields.io/github/issues/binigNET/binignet-server.svg)](https://github.com/binigNET/binignet-server/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/binigNET/binignet-server.svg)](https://github.com/binigNET/binignet-server/pulls)
---

## Deployment (WINDOWS / LINUX / MAC)

> **ℹ️ NOTE:** The game host bot is [Aura](https://github.com/jasjamjos/aura-bot) (image `jasjamjos/aura-bot`), built for the ***Warcraft 1.26a*** client only. Maps live in `aura/data/maps`.

### 🛠 Requirements
1. [Docker](https://www.docker.com/products/docker-desktop)
2. [Docker Compose](https://docs.docker.com/compose/install/)

> **ℹ️ NOTE:** pvpgn is amd64 only (`platform: linux/amd64`). On arm hosts (Apple Silicon, arm VPS) it runs emulated and slower.

### ⬇️ Clone repo (*)

```shell
git clone https://github.com/binigNET/binignet-server.git
cd binignet-server
```

### ⚙ Copy default config (*)
1. Copy `.env.example` to `.env` and fill it in.
```shell
cp .env.example .env
```
```shell
PUBLIC_IP=<your-public-ip>          # used for pvpgn address translation
AURA_REALM1_USERNAME=bot            # bot account, auto-registered on first login
AURA_REALM1_PASSWORD=<bot-password>
AURA_REALM1_SUDO_USERS=yes          # root admins, comma-separated
# optional, shared by pvpgn + pvpgn-db (defaults shown)
# DB_NAME=bnetd
# DB_USER=bnetd
# DB_PASS=secret
```

### 🚩 Start pvpgn and aura services (*)

```shell
docker compose up -d --build pvpgn-db aura pvpgn
```
- pvpgn is built from `src/pvpgn` with its config baked in; no host config files needed. It waits for `pvpgn-db` to be healthy and stores accounts in MySQL. Ladders, mail and reports live in the `pvpgn-ladders`, `pvpgn-mail` and `pvpgn-reports` volumes; logs go to `docker compose logs pvpgn`.
- On every start pvpgn writes `<aura-ip>:6320 <PUBLIC_IP>:6320 NONE ANY` to its address translation, so players can join games hosted by aura. It exits if `PUBLIC_IP` is unset or `aura` can't be resolved. aura has a fixed IP (`172.28.0.10`), so recreating it alone needs no pvpgn restart.
- `aura-init` makes aura (uid 1000) own `aura/data`; no manual `chown` needed.
- The bot registers its account on first login. Check `docker compose logs aura` for `logged in as [bot]`.
- Open `6112` TCP+UDP (pvpgn), `6200` TCP+UDP (pvpgn WC3 routing) and `6320` TCP (aura games) in your firewall.

### 🎮 Invite friends and play (*)

1. Add the gateway to your battlenet servers `<your-public-ip>`.
2. You and your friends can now create an account and ask the bot to host a game by whispering it:
```shell
/w bot !host dota lod, my game name
```

### 👮‍♂️ Adding root admins

1. Set `AURA_REALM1_SUDO_USERS` in `.env` (comma-separated pvpgn usernames).
2. Recreate the bot `docker compose up -d aura`

### 🗺 Adding maps

1. Copy the `.w3x` file into `aura/data/maps`.
2. Host it with `!host <part of map name>, <game name>`. Aura generates its map config in `aura/data/mapcfgs` on first use.

### 🔧 Customizing pvpgn config

Defaults come from the base image (`ender25/pvpgn-server:bnetd-mysql`). To change a file (motd, channels, news...), put your version in `src/pvpgn/conf/` (same path as under `/usr/local/etc/pvpgn`) and rebuild:
```shell
docker compose up -d --build pvpgn
```
To see the defaults: `docker run --rm --entrypoint cat ender25/pvpgn-server:bnetd-mysql /usr/local/etc/pvpgn/<file>`.
`bnetd.conf` keeps `@DB_*@` placeholders in `storage_path`, filled from `.env` at start.

Files the admin dashboard edits (bans, motd/news under `i18n/`, `ad.json` + `files/`, `channel.conf`, `topics.json`, `icons.conf`) live in `./pvpgn/admin` instead. They're seeded from the image on first start and never overwritten, so edit them there and apply live from the dashboard or with `/rehash <mode>`.

### 🛡 Admin dashboard
Web UI at `https://bnetadmin.bubuyogg.com` (`ADMIN_DOMAIN`), served by Caddy with automatic HTTPS. Login user `admin`.
1. DNS: add an A record `bnetadmin` → VPS IP, **DNS only** (grey cloud) in Cloudflare. Open TCP `80`, `443` in the firewall.
2. In `.env` set `ADMIN_PASSWORD` (`openssl rand -base64 24 | tr -d '/+=' | cut -c1-32`) and `PVPGN_ADMIN_PASS` (another random string). Add `binignet_admin` to `AURA_REALM1_SUDO_USERS`.
3. Start pvpgn with the new config (`docker compose up -d --build pvpgn aura`), then create the dashboard's pvpgn account from your admin account in the game client:
```
/addacct binignet_admin <PVPGN_ADMIN_PASS>
/set binignet_admin BNET\auth\botlogin true
/set binignet_admin BNET\auth\command_groups 255
/admin +binignet_admin
```
4. `docker compose up -d --build admin caddy`
- The dashboard logs in to pvpgn over telnet (port 23, internal network only). Only one session per account, so don't log in as `binignet_admin` elsewhere.
- Local dev: add a gitignored `docker-compose.override.yml` that publishes `admin` on `127.0.0.1:3000`, sets `ORIGIN=http://localhost:3000` and `ADDRESS_HEADER=`, and disables `caddy` (`profiles: [disabled]`). On macOS also move `pvpgn-db` to a named volume (the `./pvpgn/database` bind breaks MySQL table-name case).

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
3. Uncomment the `pvpgn-stats` service in `docker-compose.yml`, create the env file it reads (`touch pvpgn/.env`, or fill it for [ssl termination](https://github.com/evertramos/nginx-proxy-automation)) and start it.
```shell
docker compose up -d pvpgn-stats
```
4. Run Seeders.
```shell
docker exec -i pvpgn-db mysql -ubnetd -psecret bnetd < pvpgn-stats/migrations/d2ladder.sql
docker exec -i pvpgn-db mysql -ubnetd -psecret bnetd < pvpgn-stats/migrations/stats.sql
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

### 💾 Backup / restore
Accounts live in MySQL (`pvpgn-db`, data in `./pvpgn/database`); ladders, mail and reports in named volumes. Use your `DB_*` values.
```shell
# backup
docker exec pvpgn-db mysqldump -ubnetd -psecret bnetd > bnetd-$(date +%F).sql
docker run --rm -v binignet-server_pvpgn-ladders:/v -v "$PWD":/b alpine tar czf /b/pvpgn-ladders.tgz -C /v .
# restore
docker exec -i pvpgn-db mysql -ubnetd -psecret bnetd < bnetd-<date>.sql
docker run --rm -v binignet-server_pvpgn-ladders:/v -v "$PWD":/b alpine tar xzf /b/pvpgn-ladders.tgz -C /v
```
Repeat the volume commands for `pvpgn-mail` / `pvpgn-reports`. Volume names are prefixed with the compose project (dir name); check with `docker volume ls`.

### ✉️ Contact
[Creating an issue](https://github.com/binigNET/binignet-server/issues)

### 🎉 Acknowledgements
-   [🙌 Pvpgn Official Page](https://pvpgn.pro/)
-   [🙌 Pvpgn Stable Repo](https://github.com/pvpgn/pvpgn-server)
-   [🙌 Pvpgn Docker Repo](https://github.com/wwmoraes/pvpgn-server-docker)
-   [🙌 Aura Repo](https://github.com/jasjamjos/aura-bot)
