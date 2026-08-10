# 🕶 PVPGN PRO ➕ GHOST++ ➕ WEB STATS

## Deployment (WINDOWS / LINUX / MAC)

> **ℹ️ NOTE:** The Ghost configuration is designed to work with the ***Warcraft 1.26x*** client, but you can adjust it to work with ***1.28x*** or higher. The default map is ***DotA LoD 6.85m4***, but any other is possible.

### 🛠 Requirements
1. [Docker](https://www.docker.com/products/docker-desktop)

### ⬇️ Clone repo (*)

```shell
git clone https://github.com/binigNET/binignet-server.git
cd binignet-server
```

`pvpgn/etc`, `pvpgn/var`, and the Ghost++/pvpgn database schemas are already committed to the repo, so no manual export/seed steps are needed for a fresh clone.

### ⚙ Set environment variables (*)

Set these in your shell / `.env` / Coolify environment before starting the stack:
```shell
PUBLIC_IP=<your-public-ip>
BNET_USERNAME=bot
BNET_PASSWORD=secret
BNET_ROOTADMIN=yourAccount friendAccount otherFriend
```
`pvpgn/.env.example` and `ghostpp/.env.example` are unrelated to the above - copy them to `.env` only if you're setting up [SSL termination](https://github.com/evertramos/nginx-proxy-automation) for the (currently disabled) stats websites. The `proxy` network is created automatically by `docker-compose.yml` - no manual `docker network create proxy` needed.

### 🚩 Start the stack (*)

```shell
docker compose up -d
```

`pvpgn` and `ghostpp` handle their own configuration at startup:
- `pvpgn` resolves `ghostpp`'s container IP and writes `address_translation.conf` itself.
- `ghostpp` copies `config/default.cfg` to `config/ghost.cfg` and injects `BNET_USERNAME`/`BNET_PASSWORD`/`BNET_ROOTADMIN`.
- `pvpgn-db`/`ghostpp-db` create their schemas automatically on first boot.

### 🤖 Bot Account creation (*)

1. Add the gateway to your battlenet servers `<your-public-ip>`.
2. Open your Warcraft client, go to battlenet and create a bot account matching `BNET_USERNAME`/`BNET_PASSWORD` above.
3. Login and put any email.

### 🎮 Invite friends and play (*)

1. You and your friends can now add this battlenet server, create an account, and join the self-created game.

### 👮‍♂️ Adding root admins

1. Set `BNET_ROOTADMIN` (space-separated account names) in the environment and restart the `ghostpp` service: `docker compose up -d ghostpp`.

### 🕹 Commands (*)

1. To see the list of available commands visit [Ghost++ Commands](https://github.com/binigNET/binignet-server/blob/main/ghost-commands.md)

### 📊 [Optional] Setup Pvpgn Stats (*)

> Disabled by default - uncomment the `pvpgn-stats` service in `docker-compose.yml` first.
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

### 📊 [Optional] Setup Dota OpenStats (*)

> Disabled by default - uncomment the `dota-stats` service in `docker-compose.yml` first.

1. Up service.
```shell
docker compose up -d dota-stats
```
2. Set stats page. Edit the file `pvpgn/etc/pvpgn/anongame_infos.conf` and set the following settings.
```shell
server_URL = http://<your-public-ip>:9081/
```
or
```
# SSL Configured
server_URL = https://dota-stats-domain.com
```
3. Restart pvpgn server
```shell
docker compose restart pvpgn
```
4. Open in browser [Pvpgn Stats](🌐 http://127.0.0.1:9081/)

### 📄 View Logs (*)
#### Pvpgn Logs
```shell
docker compose logs -f --tail 200 pvpgn
```
#### Ghost++ Logs
```shell
docker compose logs -f --tail 200 ghostpp
```

### ✉️ Contact
[Creating an issue](https://github.com/binigNET/binignet-server/issues)

### 🎉 Acknowledgements
-   [🙌 Pvpgn Official Page](https://pvpgn.pro/)
-   [🙌 Pvpgn Stable Repo](https://github.com/pvpgn/pvpgn-server)
-   [🙌 Pvpgn Docker Repo](https://github.com/wwmoraes/pvpgn-server-docker)
-   [🙌 Ghost++ Stable Repo](https://github.com/uakfdotb/ghostpp)
-   [🙌 Ghost++ Docker Repo](https://github.com/Fatorin/ghostpp_docker)
-   [🙌 Pvpgn Ghost Docker Repo](https://github.com/acollazo25/pvpgn-ghost-docker)
