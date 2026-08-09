# ONBOARDING

Handoff doc for binignet-server. For step-by-step deploy instructions see `README.md`. For in-game bot commands see `ghost-commands.md`. This doc gives the full picture: what it is, how it's wired, and known gaps.

## What this is

Docker Compose stack that self-hosts a private Battle.net-like server for Warcraft III (targets client 1.26x), so people can play DotA without Blizzard's real Battle.net. Three parts:

- **PVPGN** (`pvpgn`) - open-source bnetd emulator, handles login/chat/ladder.
- **Ghost++** (`ghostpp`) - bot that auto-hosts WC3 game lobbies, records stats.
- **PHP stats sites** (`pvpgn-stats`, `dota-stats`) - optional web dashboards, currently disabled.

Not a typical app repo - no package.json/go.mod, no CI, no tests. It's infra/config for running someone else's binaries.

## Components (`docker-compose.yml`)

| Service | Image | Status | Purpose |
|---|---|---|---|
| `pvpgn` | `ender25/pvpgn-server:bnetd-mysql` | active | bnetd server, ports 6112/6200/4000 |
| `pvpgn-db` | `ender25/pvpgn-server:mysql-db` | active | MySQL 5.7, db `bnetd`, bound to 127.0.0.1:3306, data in named volume `pvpgn-db-data` |
| `ghostpp` | `fatorin/ghostpp:1.3` | active | hosting bot, ports 6320/6321 |
| `ghostpp-db` | `ender25/pvpgn-server:mysql-db` | active | MySQL 5.7, db `ghost`, auto-seeded |
| `pvpgn-stats` | `ender25/pvpgn-server:web-server` | disabled (commented out) | ladder web stats, port 9082 |
| `dota-stats` | `ender25/pvpgn-server:web-server` | disabled (commented out) | DotA game stats, port 9081 |
| `phpmyadmin` | `phpmyadmin/phpmyadmin` | disabled (commented out) | DB admin UI, port 8085 |

Re-enable the disabled ones by uncommenting in `docker-compose.yml` (per `e0a767f`).

## Directory map

- `pvpgn/` - bnetd runtime config + data, bind-mounted into the `pvpgn` container.
  - `etc/pvpgn/*.conf` - core server config (bnetd.conf, realm.conf, address_translation.conf, etc). Now committed to git (previously gitignored/exported manually).
  - `var/pvpgn/files` - server file storage, also now committed.
- `ghostpp/` - bot runtime config, maps, DB seed.
  - `config/default.cfg` - template, copied to `ghost.cfg` at container start (gitignored once generated).
  - `maps/` - WC3 map files (currently `DotA LoD 6.85m4.w3x` - README still says 6.83d is default, doc is stale on this point).
  - `db-schema.sql`, `db-populate.sql` - loaded into `ghostpp-db` via `docker-entrypoint-initdb.d`.
- `pvpgn-stats/`, `dota-stats/` - PHP 5.x web apps, raw SQL via mysqli, no framework.
- `src/*/Dockerfile` (`pvpgn-server/{bnetd,d2cs,d2dbs}`, `ghostpp-server`, `web-server`, `db-sever`) - **dead code**. Nothing in `docker-compose.yml` builds from these; compose pulls prebuilt images instead. Last touched 2021. Candidate for deletion/archival - confirm with team first.

## Deploy flow (current, automated)

`docker compose up -d` is basically it now. What used to be manual steps (per README) are now handled by container entrypoints:

- `pvpgn` entrypoint resolves `ghostpp`'s container IP via `getent hosts ghostpp` and writes `address_translation.conf` itself.
- `ghostpp` entrypoint copies `default.cfg` → `ghost.cfg` and `sed`-injects `BNET_USERNAME`/`BNET_PASSWORD`/`BNET_ROOTADMIN`.
- `ghostpp-db` auto-seeds schema/data on first boot from the mounted SQL files.

Deploy target is implied to be **Coolify** (entrypoint comment says "Injecting Coolify variables...") but this isn't documented anywhere else - worth confirming/writing down if a new maintainer needs to reproduce the environment.

## Env vars

Root level (no `.env.example` committed for these - gap, see below):
- `PUBLIC_IP` - public IP for `pvpgn` address translation.
- `BNET_USERNAME` / `BNET_PASSWORD` / `BNET_ROOTADMIN` - Ghost++ bot's battle.net account + admin.

`pvpgn/.env.example` and `ghostpp/.env.example` - unrelated to the above, these are for the optional reverse-proxy/SSL setup (`VIRTUAL_HOST`, `VIRTUAL_PORT`, `LETSENCRYPT_HOST`, `LETSENCRYPT_EMAIL`, `NETWORK`), only matter if you enable the disabled stats services behind `nginx-proxy-automation`.

## Networks

- `internal` (bridge) - all game/DB services.
- `proxy` (bridge, named `proxy`) - for reverse proxy/SSL, now created by this compose file itself (`external: true` is commented out, so `docker network create proxy` from the README is no longer needed).

## Database

MySQL 5.7 x2, no ORM. "Migrations" are just SQL dump files run once via `docker-entrypoint-initdb.d` (ghostpp) or manually via `mysql` CLI (`pvpgn-stats/migrations/*.sql`). Not a real migration framework - schema changes are manual.

`pvpgn-db` uses a Docker named volume (`pvpgn-db-data`) instead of a bind mount, so its data survives redeploys/checkout resets. `ghostpp-db` still bind-mounts to `./ghostpp/database` (gitignored) - same class of bug (data can be wiped on redeploy if the checkout dir gets reset), not yet fixed.

## Recent history (branch `feat/streamline-deployment-for-cloud-provider`, merged PR #6)

- `d5cda47` - added the automated entrypoints described above; committed previously-gitignored `pvpgn/etc` and `pvpgn/var` files into the repo so fresh clones work out of the box.
- `842c7c9` - fixed shell escaping bug (`\$(...)` vs `\$$(...)`) that broke the ghost IP lookup.
- `bd4f370` - added explicit `driver: bridge` to `internal` network, made `proxy` network self-created instead of requiring `external: true`.
- `e0a767f` - commented out `pvpgn-stats`/`dota-stats`/`phpmyadmin` since not in active use.

## Known gaps (flagged, not fixed)

- `README.md` deploy walkthrough is stale - describes manual IP lookup / `ghost.cfg` editing / `docker network create proxy` steps that the automated entrypoints and compose changes above have made unnecessary.
- No root `.env.example` documenting `PUBLIC_IP`, `BNET_USERNAME`, `BNET_PASSWORD`, `BNET_ROOTADMIN` - anyone deploying fresh has to know these exist from reading `docker-compose.yml`.
- `src/*/Dockerfile` tree is dead/unused (see above).
- Coolify as the deploy target is implied by a code comment, never documented.
- `pvpgn-db`/`ghostpp-db` use hardcoded `MYSQL_PASSWORD: "secret"` (comment says "this is not a risk" - presumably because DB is internal-network-only / bound to 127.0.0.1). Worth revisiting if network exposure ever changes.
- README says default map is DotA 6.83d; actual map file in `ghostpp/maps/` is 6.85m4.
- No CI/CD, no tests - all verification is manual (bring the stack up, connect a WC3 client, check bot behavior).

claude --resume d009505e-b730-4405-948a-dfd5033266c0