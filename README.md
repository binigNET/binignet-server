# 🕶 PVPGN PRO ➕ GHOST++ ➕ WEB STATS

## Deployment (WINDOWS / LINUX / MAC)

> **ℹ️ NOTE:** The Ghost configuration is designed to work with the ***Warcraft 1.26x*** client, but you can adjust it to work with ***1.28x*** or higher. The default map is ***dota-6.83d-en.w3x***, but any other is possible.

### 🛠 Requirements
1. [Docker](https://www.docker.com/products/docker-desktop)

### ⬇️ Clone repo (*)

```shell
git clone https://github.com/binigNET/binignet-server.git
cd binignet-server
```

### 📦 Export pvpgn data (LINUX / MAC)

```shell
docker run --rm -v $PWD/pvpgn/var:/tmp/var ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/var/pvpgn /tmp/var
docker run --rm -v $PWD/pvpgn/etc:/tmp/etc ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/etc/pvpgn /tmp/etc
```

### 📦 Export pvpgn data (WINDOWS)

```shell
docker run --rm -v %CD%/pvpgn/var:/tmp/var ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/var/pvpgn /tmp/var
docker run --rm -v %CD%/pvpgn/etc:/tmp/etc ender25/pvpgn-server:bnetd-d2cs-d2dbs-mysql cp -r /usr/local/etc/pvpgn /tmp/etc
```

### ⚙ Copy default config (*)
1. Copy `pvpgn/.env.example` to `pvpgn/.env`.  Configure the `pvpgn/.env` for the [ssl termination](https://github.com/evertramos/nginx-proxy-automation) of the statistics website, otherwise you can ignore it and continue with the next step.
> Even if SSL termination is not configured the `pvpgn/.env` file **must exist** in the root of the directory.
```shell
cp pvpgn/.env.example pvpgn/.env
```
2. Copy `ghostpp/.env.example` to `ghostpp/.env`.  Configure the `ghostpp/.env` for the [ssl termination](https://github.com/evertramos/nginx-proxy-automation) of the statistics website, otherwise you can ignore it and continue with the next step.
> Even if SSL termination is not configured the `ghostpp/.env` file **must exist** in the root of the directory.
```shell
cp ghostpp/.env.example ghostpp/.env
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

### 🚛 Create Ghost Database Schemas and run seeders (*)
1. Seed database.
```shell
docker compose up -d ghostpp-db
docker exec -i ghostpp_databse mysql -ughost -psecret ghost < ghostpp/db-schema.sql
docker exec -i ghostpp_databse mysql -ughost -psecret ghost < ghostpp/db-populate.sql
```

### 🚩 Start pvpgn, d2cs, d2dbs and ghostpp services (*)
 
```shell
docker compose up -d pvpgn ghostpp
```

### 🔀 Configure address translation for docker network (*)

1. Get the IP assigned to your `ghostpp` service.
```shell
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ghostpp_server
```
```shell
'192.168.224.3'
```
- `92.168.128.3`: **ghostpp-service-ip**
2. In the first line of the `pvpgn/etc/pvpgn/address_translation.conf` file add the following.
```shell
<ghostpp-service-ip>:6320 <your-public-ip>:6320 NONE ANY
########################################################################################################
#------------------------------------------------------------------------------------------------------#
# Address Translation table                                                                            #
#----------------------------------------------------------------------------
#
```
3. Restart pvpgn service `docker compose restart pvpgn`

### 🤖 Bot Account creation (*)

1. Add the gateway to your battlenet servers `<your-public-ip>`.
2. Open your Warcraft client, go to battlenet and create a bot account, example user `bot` password `secret`.
3. Login and put any email.

### ⚙️ Ghost Configuration (*)

1. Copy the `ghostpp/config/default.cfg` to `ghostpp/config/ghost.cfg`.
```shell
cp ghostpp/config/default.cfg ghostpp/config/ghost.cfg
```
2. Edit the file `ghostpp/config/ghost.cfg` and set the following settings. This is enough to start.
```shell
bnet_username = bot
bnet_password = secret
```
3. Restart ghost service `docker compose restart ghostpp`

### 🎮 Invite friends and play (*)

1. You and your friends can now add this battlenet server, create an account, and join the self-created game.

### 👮‍♂️ Adding root admins

1. Edit the file `ghostpp/config/ghost.cfg` and set the following settings.
```shell
bnet_rootadmin = yourAccount friendAccount otherFriend
```
2. Restart ghost service `docker compose restart ghostpp`

### 🕹 Commands (*)

1. To see the list of available commands visit [Ghost++ Commands](https://github.com/binigNET/binignet-server/blob/main/ghost-commands.md)

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

### 📊 [Optional] Setup Dota OpenStats (*)
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
