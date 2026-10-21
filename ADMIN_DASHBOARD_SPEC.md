# bnet admin dashboard — spec + plan

Spec for a web admin dashboard for the binignet pvpgn + aura stack. Sources: pvpgn flatten review (`PVPGN_FLATTEN_REVIEW.md`), follow-up Q&A on config UX, grilling session 2026-09-29.
Status legend: **verified** = checked in code/config/locally; **unverified** = from pvpgn help text / docs, confirm in Phase 0 spike.

## 1. Background

### 1.1 Stack today
- `pvpgn` (bnetd 1.99.7.2.1, image `src/pvpgn` on pinned `ender25/pvpgn-server:bnetd-mysql`), config baked in, entrypoint renders `bnetd.conf` (`@DB_*@`) + `address_translation.conf` (aura IP → `PUBLIC_IP`) each start.
- `pvpgn-db` (mysql 5.7), accounts in MySQL. `phpmyadmin` on `127.0.0.1:8085`.
- `aura` (`jasjamjos/aura-bot`), fixed IP `172.28.0.10`, host bind `./aura/data` (maps, mapcfgs, saves, `aura.db`), config `./aura/config.ini`.
- Vols: `pvpgn-ladders`, `pvpgn-mail`, `pvpgn-reports`.

### 1.2 Flatten impact on config (verified)
- Deleted host `pvpgn/etc/pvpgn/` (78 files) + `pvpgn/var/pvpgn/files/` (17). All byte-identical to image defaults except `bnetd.conf` (moved to `src/pvpgn/conf/`) and unused `d2cs.conf`/`d2dbs.conf`. No customizations lost.
- Baked now: `src/pvpgn/conf/bnetd.conf` + all image defaults in `/usr/local/etc/pvpgn`, `/usr/local/var/pvpgn/files`.

### 1.3 Config UX regressions found
| # | Issue |
|---|---|
| U1 | **Bans lost on recreate**: `/ipban` writes `bnban.conf` in image layer (`bnetd.conf:80`) |
| U2 | Edit = rebuild + recreate → drops all players (before: host edit + HUP/`/rehash`) |
| U3 | Non-`bnetd.conf` files must be extracted from image before editing |
| U4 | `bnetd.conf` in-container edits overwritten by entrypoint render |
| U5 | `userlogs/` (`log_commands = true`) not on vol → lost on recreate |

Conclusion: keep flattened image; add one shared "admin" dir for the mutable subset. Old version not better for a dashboard (exposes all 78 files incl. DB creds, drift, loses fixes, still needs `/rehash`).

### 1.4 Relevant facts
- aura: `hosting.games_quota.max_lobbies` default **1** (verified, `aura-bot/CONFIG.md`); bot leaves chat while lobby open (bnet protocol). No HTTP/IPC API — control via Discord, IRC, realm whispers, in-game, CLI (verified, source survey).
- pvpgn admin cmds exist (help text, unverified behavior): `/addacct`, `/set <acct> <key> <val>`, `/icon add|del|set|list`, `/ipban`, `/lock`/`/unlock`, `/announce`, `/realmann`, `/alert`, `/w`, `/games`, `/gameinfo`, `/users`, `/who`, `/rehash <mode>` (modes incl. `i18n`, `news`, `ipbans`, `banners`, `channels`, `topiclist`, `icons`, `all`).
- bnetd caches accounts, `usersync = 300` → direct MySQL writes can be overwritten.
- `XML_status_output = false`, `statusdir = /usr/local/var/pvpgn/status`; `telnetaddrs` commented (`bnetd.conf:595`).
- Base `ad.json`: W3XP ads `ad000001.png`, `ad000002.mng` in `files/`.
- Local mac dev: MySQL on bind `./pvpgn/database` → `lower_case_file_system ON` → pvpgn can't find own tables (verified). VPS (linux) unaffected.
- No existing dashboard/API in sibling repos; `binigNET.github.io` = SvelteKit/TS.
- VPS: nothing on 80/443 (only `127.0.0.1:8085`). `bubuyogg.com` on Cloudflare DNS.

## 2. Goals / non-goals
Goals: one admin manages server live from browser anywhere.
Non-goals: multi-user/roles (beyond the restricted player login, §5.4), player self-service, audit log, new custom icons (`.bni` editing), multi-language motd, multiple rotating banners, restarts as part of any action, DB security hardening (separate backlog).

## 3. Features
| # | Feature | Mechanism | Source of truth |
|---|---|---|---|
| 1 | Create player | `/addacct <user> <pass>` | MySQL `pvpgn_BNET` |
| 1a | Ladder stats: solo, team, ffa, AT × level, xp, wins, losses | `/set <acct> Record\W3XP\<key> <val>` (keys TBD spike) | MySQL |
| 1b | User icon (existing only) | `/icon set|add|del <user> <icon>`; list via `/icon list` | `icons.conf` |
| 2 | Banner (single slot) | write png → banner location, update `ad.json` (file+url), `/rehash banners` | `ad.json` |
| 3 | Maps add/delete/rename | files in `./aura/data/maps`; rename also `mapcfgs/*.ini`; delete refused if map in lobby/game (aura `!games`) | fs |
| 4 | Bans | view `bnban.conf` + locked accts; `/ipban`, `/lock <u> [h] [reason]`, `/unlock` | `bnban.conf`, MySQL |
| 5 | MOTD/news (enUS) + messages | edit `i18n/bnmotd.txt`, `i18n/news.txt` → `/rehash i18n|news`; `/announce`, `/w <u>`, `/alert` | files |
| 6 | Active games | XML status file; `/games all` fallback | status |
| 7 | Game status | `/gameinfo <name>`; aura `!games`, `!checkgame` | pvpgn + aura |
| 8 | Online players | XML status file; `/users`/`/who` fallback | status |
| 9 | Saved games upload/load | `.w3z` → `./aura/data/saves`; load writes `<save>.ini` (map, name, players) + aura `!hostsg <save>` (fork cmd, image `bn.2`); public lobby, slots reserved in order, auto-start when full; save deleted after hosting | fs |

Map rules: `.w3x`/`.w3m` only, ≤8MB, reject duplicate name.
Save rules: `.w3z` only, ≤8MB, original file name kept (players load their own `Save\Multiplayer\<name>` copy), same name overwrites; load needs the save's map file in `maps/` and one username per human slot.

## 4. Decisions log (grilling)
| Q | Topic | Decision |
|---|---|---|
| 1 | Users | only me |
| 2 | Exposure | public domain |
| 3 | pvpgn control | hybrid: reads MySQL/status/files, writes via cmds, file edit only where no cmd + `/rehash` |
| 4 | aura control | whispers from same admin session + files |
| 5 | Live | always live, no restarts |
| 6 | Order | read-only → live actions → files/assets |
| 7 | Audit | none |
| 8/8b | Login | public, simple secure login, 1 account |
| 9 | 80/443 | free → Caddy in compose |
| 10 | Stack | SvelteKit + Node |
| 11 | Code | `src/admin/` in this repo |
| 12 | pvpgn acct | dedicated `binignet_admin` |
| 13 | Freshness | poll 10–30s |
| 14 | Domain | `bnetadmin.bubuyogg.com` |
| 15 | Admin files | host bind `./pvpgn/admin` |
| 16 | Dev | local, gitignored `docker-compose.override.yml` |
| 17 | TLS | Caddy auto-HTTPS |
| 18 | DNS record | user adds later |
| 19/26 | Password | generated 32-char `ADMIN_PASSWORD` in `.env`, plain, const-time compare; cookie + rate limit; no Cloudflare Access |
| 20 | Ladder stats | solo, team, ffa, AT × level, xp, wins, losses |
| 21 | Icons | existing only |
| 22 | Banner | single slot |
| 23 | Maps | reject dup, rename cfg too, refuse delete in use |
| 24 | Msgs | enUS motd/news; announce, whisper, alert |
| 25 | Cloudflare | DNS-only (grey) A record |
| 27 | Acct perms | **full admin** (accepted: leak = full server control incl `/shutdown`) |
| 28 | Deploy | build on VPS `docker compose up -d --build admin` |

## 5. Architecture
```
browser ──https──> caddy:443 ──> admin:3000 (SvelteKit/node)
                                   ├─ telnet ──> pvpgn:23  (binignet_admin session; cmds + aura whispers)
                                   ├─ mysql  ──> pvpgn-db:3306 (read accounts/stats/locks)
                                   ├─ fs rw  ──> ./pvpgn/admin   (shared w/ pvpgn)
                                   ├─ fs ro  ──> pvpgn-status vol (XML status)
                                   ├─ fs rw  ──> ./aura/data/maps, mapcfgs, saves
                                   └─ sqlite ro > ./aura/data/aura.db
```

### 5.1 pvpgn changes
- `src/pvpgn/conf/bnetd.conf`: `ipbanfile`, `i18ndir`, `channelfile`, `topicfile`, `adfile`, `customicons_file` → `/usr/local/var/pvpgn/admin/…`; `XML_status_output = true`; `telnetaddrs = ":23"`.
- Banner image location per spike (ad filenames relative to `filedir`?).
- `entrypoint.sh`: `mkdir -p` admin dir; copy image defaults when missing, never overwrite. Fixes U1.
- Compose: bind `./pvpgn/admin:/usr/local/var/pvpgn/admin`; vol `pvpgn-status`. Telnet port **not** published.

### 5.2 `admin` service
- `src/admin/`: SvelteKit `adapter-node`, node LTS pinned, `mysql2`, `better-sqlite3`, `net`.
- Env: `ADMIN_PASSWORD`, `DB_HOST/NAME/USER/PASS`, `PVPGN_HOST=pvpgn`, `PVPGN_TELNET_PORT=23`, `PVPGN_ADMIN_USER=binignet_admin`, `PVPGN_ADMIN_PASS`, `AURA_BOT=${AURA_REALM1_USERNAME}`.
- Modules:
  - `pvpgn/telnet.ts`: 1 persistent conn, login, serialized cmd queue, reply collection (timeout-delimited or prompt-delimited per spike), auto-reconnect, whisper routing (aura replies).
  - `pvpgn/status.ts`: parse XML status, cache.
  - `pvpgn/db.ts`: read-only queries.
  - `pvpgn/files.ts`: motd/news/ad.json/bnban read/write (atomic write: tmp + rename).
  - `aura/files.ts`, `aura/db.ts`: maps/cfgs, games history.
- UI: login, players (list/create/stats/icon), games (list/detail), bans, messages (motd/news/announce/whisper/alert), maps, banner.
- Errors: pvpgn/telnet down → banner "pvpgn offline", actions disabled, reads from DB still shown.

### 5.3 `caddy` service
- `caddy:2` pinned digest; ports 80, 443; `Caddyfile`: `bnetadmin.bubuyogg.com { reverse_proxy admin:3000 }`; vols `caddy-data`, `caddy-config`.

### 5.4 Auth
- Single user `admin`; password = `ADMIN_PASSWORD` (32-char random, `openssl rand -base64 24 | tr -d '/+=' | cut -c1-32`).
- Const-time compare; session cookie httpOnly, Secure, SameSite=Strict, 7d; logout.
- Rate limit 5 fails / 15 min / IP (client IP from Caddy `X-Forwarded-For`).
- CSRF: SvelteKit origin check (default on).
- Player login: any other username = pvpgn account, checked read-only against `pvpgn_BNET` (SRP salt+verifier, `passhash1` if no SRP; ports in `lib/server/pvpgn/bnet-crypto.ts`, verify with `scripts/check-bnet.ts`). Locked accounts rejected.
  - Sees only WC3 Games (host/unhost/owner) and CS/HLDM Server (map/restart/live bots; no say, player list, saved bot defaults). Rules in `lib/access.ts`, enforced in `hooks.server.ts`.
  - Session re-checked every 60s: lock/delete/password change logs out (DB down: kept). Restart/map: 30s cooldown per game. Actions logged to stdout (`[player] …`).
  - Rate limit: 5 fails / 15 min per username+IP, 20 per IP. `PLAYER_LOGIN=off` disables player logins and sessions.

### 5.5 Local dev override (gitignored)
- `pvpgn-db` → named vol (mac case bug).
- `admin` → `127.0.0.1:3000`; `caddy` disabled via profile.

## 6. Security notes / risks
| Risk | Mitigation / status |
|---|---|
| Dashboard compromise = full pvpgn admin (Q27 b) | strong random pw, rate limit, HTTPS; accepted |
| Telnet plaintext | internal docker net only, never published |
| Direct DB writes overwritten by cache | writes only via cmds |
| Reply parsing brittle | spike first; timeouts; show raw reply on parse fail |
| Map delete during lobby | check aura `!games` first |
| Upload abuse | ext + size check, sanitize filename, no path traversal |
| `ADMIN_PASSWORD` in `.env` plain | `.env` gitignored, root-only perms |

## 7. Implementation phases

### Phase 0 — spike (local, throwaway)
Record results in `src/admin/SPIKE.md`:
- telnet login + admin cmds work; reply format; aura whisper replies receivable
- XML status: filename, fields, interval
- `/set` keys for solo/team/ffa/AT level/xp/wins/losses; applies live to online user?
- `ad.json` path rules; WC3 1.26 banner size/format
- bootstrap admin flag for `binignet_admin` (`/admin +` vs `auth_admin` col)
Gate: failure → revisit affected feature.

### Phase 1 — infra
pvpgn conf + entrypoint + compose (`admin`, `caddy`, bind, status vol), `.env.example` vars, aura sudo user, SvelteKit skeleton w/ auth, core modules, README setup (pw gen, DNS grey A record, 80/443, bootstrap).

### Phase 2 — read-only
#8 online players, #6 active games, #7 game status, #4 ban list view.

### Phase 3 — live actions
#5 motd/news + announce/whisper/alert, #4 ban/unban, #1 create player.

### Phase 4 — files/assets
#3 maps, #2 banner, #1a ladder stats, #1b icons.

## 8. Verification
- Each feature locally: effect visible in WC3 client or `docker compose logs pvpgn`; no pvpgn restart.
- Bans survive `docker compose up -d --force-recreate pvpgn`.
- Login: 6 bad attempts → blocked; cookie flags; logout clears session.
- `docker compose config` clean; VPS `ss -tlnp`: public only 80, 443, 6112, 6200, 6320; telnet absent.
- VPS: `https://bnetadmin.bubuyogg.com` valid cert after DNS.

## 9. Open items
- DNS: grey A `bnetadmin` → VPS IP (user, later). Firewall 80/443 open.
- Spike outcomes may change #1a, #2, bootstrap.
- Separate backlog: U5 (`userlogs` vol), DB security (root no pw, default `DB_PASS`).
