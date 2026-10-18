# pvpgn flatten — review

Retro + review of the `pvpgn` flatten (`cdf81ba`, `44df4e7`, `b6f7d07`, `70ef1bd`). Target: plain `docker compose` on x86_64 linux VPS. Scope: `pvpgn` svc only.
Status legend: **verified** = checked locally 2026-09-29 (OrbStack, amd64 emulated, see [Verification log](#verification-log)); **inferred** = code/config reading only.

## Summary
- Goal: deploy w/o host config files mounted into `pvpgn`.
- Done: config baked into `src/pvpgn` image, entrypoint renders `DB_*` + aura addr translation, runtime state in named vol `pvpgn-var`.
- Verdict: goal met for `pvpgn`. Main gaps: startup errors invisible in `docker compose logs` (F17), unvalidated `DB_*` chars (F9), unpinned sibling images (F7), stale aura IP after aura recreate (F6), stale static files in vol (F8).

## Before / after
| | Before | After |
|---|---|---|
| Image | `ender25/pvpgn-server:bnetd-mysql` (tag) | `src/pvpgn` thin layer on same base, pinned by digest |
| Config | bind `./pvpgn/etc/pvpgn` | baked `src/pvpgn/conf/` over image defaults |
| Runtime data | bind `./pvpgn/var/pvpgn` | named vol `pvpgn-var` |
| Entrypoint | inline `sh -c` in compose, `>` overwrote translation file | `src/pvpgn/entrypoint.sh`: render from templates each start, fail-fast |
| DB creds | hardcoded in host `bnetd.conf` | `DB_*` env shared by `pvpgn` + `pvpgn-db`, `@DB_*@` placeholders |
| Startup order | `depends_on` list | `pvpgn-db` healthy (tcp `mysqladmin ping`), `aura` started |

Baked `bnetd.conf` == old host one except `storage_path` placeholders (`git diff 44df4e7^:pvpgn/etc/pvpgn/bnetd.conf HEAD:src/pvpgn/conf/bnetd.conf`).

## What went well
- Base pinned by digest → reproducible build. **verified** (builds)
- sed escaping of `\ | &` in `DB_*`. **verified** (`a&b|c\d` renders as-is)
- Fail-fast: no `PUBLIC_IP` → exit 1; aura unresolvable → exit after ~30s. **verified**
- Templates re-rendered each start → idempotent on restart, default translation file kept (old `>` wiped it). **verified** (2 runs → 1 translation line)
- Entrypoint deps (`address_translation.conf`, `getent`, `sed`, `awk`) present in base. **verified**
- Healthcheck over tcp (`-h 127.0.0.1`) skips mysql init temp server (socket-only). **inferred**

## Findings
| # | Sev | Status | Where | Issue | Action |
|---|---|---|---|---|---|
| F17 | Med | verified | `src/pvpgn/conf/bnetd.conf:82` | bnetd logs to `bnetd.log` in vol; stdout only shows "Server is now running." then exit 255. Real error (e.g. DB unreachable) invisible to `docker compose logs pvpgn` | log to stdout |
| F9 | Med | verified | `src/pvpgn/entrypoint.sh:20-27` | `;` in `DB_*` injects `storage_path` keys (`DB_PASS='p;host=evil'` → `host=evil`); `"` breaks quoting | reject `;` `"` in entrypoint |
| F7 | Med | inferred | `docker-compose.yml:35`, `:108` | `ender25/pvpgn-server:mysql-db`, `phpmyadmin/phpmyadmin` unpinned → silent drift on pull | pin digest |
| F6 | Med | inferred | `src/pvpgn/entrypoint.sh:31-47` | aura IP resolved once at start; `docker compose up -d aura` alone → new IP, stale translation, players can't join | static IP for aura |
| F8 | Med | verified | `docker-compose.yml:28` | named vol seeded from image only on 1st create; later image changes under `/usr/local/var/pvpgn/files` (icons, mpq, bnserver.ini) never reach existing vol | vol only on runtime dirs |
| F18 | Low | verified | `src/pvpgn/conf/bnetd.conf:145` | `loglevels` incl `debug,trace` → noisy (worse once F17 sends to stdout) | `fatal,error,warn,info` |
| F13 | Low | verified | `docker-compose.yml:25-26` | 4000 published; `wolv1addrs` commented in base → unused. 6200 (`w3routeaddr`) active, keep | drop 4000 |
| F12 | Low | verified | `docker-compose.yml:1`, `:122-124` | `version:` obsolete (compose warns); `proxy` net unused (stats commented) | drop both |
| F10 | Low | inferred | `src/pvpgn/Dockerfile:2`, `src/pvpgn-server/bnetd/Dockerfile` | comment says base built from `src/pvpgn-server/bnetd`, but that clones unpinned `develop`; can't reproduce pinned base (PvPGN 1.99.7.2.1, Ubuntu 20.04, 2021) | reword comment; pin `git_branch` if kept |
| F11 | Low | inferred | `src/db-sever/`, `src/web-server/` | not referenced by compose; typo `db-sever` | delete or note as source of `ender25` images |
| F15 | Low | inferred | `src/pvpgn/conf/bnetd.conf:446-453` | reports to public trackers w/ `unknown` metadata | set or blank |
| F16 | Low | inferred | `docker-compose.yml:4` | no pvpgn healthcheck → `docker ps` shows up even when bnetd crash-loops | tcp 6112 check |
| F14 | Low | inferred | `docker-compose.yml:9` | `platform: linux/amd64` → emulated on arm hosts | none for VPS; note in README |

### Snippets

**F17 + F18** — `src/pvpgn/conf/bnetd.conf` (verified: errors appear in container stdout)
```diff
-logfile     = "/usr/local/var/pvpgn/bnetd.log"
+logfile     = "/dev/stdout"
-loglevels = fatal,error,warn,info,debug,trace
+loglevels = fatal,error,warn,info
```

**F9** — `src/pvpgn/entrypoint.sh`, before render
```sh
for v in "$DB_HOST" "$DB_NAME" "$DB_USER" "$DB_PASS" "$DB_PREFIX"; do
  case "$v" in *\;*|*\"*) echo "ERROR: DB_* must not contain ; or \"" >&2; exit 1 ;; esac
done
```

**F7** — `docker-compose.yml`. Pin to digest VPS already runs (`docker inspect --format '{{index .RepoDigests 0}}' <image>`). Current registry digests (2026-09-29):
```yaml
image: ender25/pvpgn-server:mysql-db@sha256:60057a7a630f7f8b60c03982910b9fd484779f11d909bc15539b29f78a2d05e7
image: phpmyadmin/phpmyadmin:latest@sha256:42a200db07b4e70fbf32c594ad4521cf16399b8e54bbb5adceae98e7566dfbeb
```

**F6** — `docker-compose.yml` (DNS lookup in entrypoint unchanged; always returns same IP)
```yaml
  aura:
    networks:
      internal:
        ipv4_address: 172.28.0.10
networks:
  internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/24
```
Then drop README "run `docker compose restart pvpgn`" note.

**F8** — `docker-compose.yml`, replace single vol w/ runtime-only vols (`files/` stays from image)
```yaml
    volumes:
      - pvpgn-ladders:/usr/local/var/pvpgn/ladders
      - pvpgn-mail:/usr/local/var/pvpgn/bnmail
      - pvpgn-reports:/usr/local/var/pvpgn/reports
volumes:
  pvpgn-ladders:
  pvpgn-mail:
  pvpgn-reports:
```
Accounts in MySQL → `users/`, `clans/`, `teams/` unused. Add `chanlogs`/`userlogs`/`status` only if enabled. Migrate: copy dirs out of old `pvpgn-var` first.

**F13 / F12** — `docker-compose.yml`
```diff
-version: "3.7"
...
-      - 4000:4000
-      - 4000:4000/udp
...
-  proxy:
-    name: proxy
-    driver: bridge
```

**F16** — `docker-compose.yml`, `pvpgn`
```yaml
    healthcheck:
      test: ["CMD-SHELL", "bash -c '</dev/tcp/127.0.0.1/6112'"]
      interval: 10s
      timeout: 3s
      retries: 5
```

**F10** — `src/pvpgn/Dockerfile:2`
```diff
-# Base built from src/pvpgn-server/bnetd/Dockerfile (amd64 only).
+# Base = prebuilt ender25 image (PvPGN 1.99.7.2.1, Ubuntu 20.04, amd64 only).
+# src/pvpgn-server/bnetd/Dockerfile is a reference recipe (tracks develop), not the pinned build.
```

**F15** — `src/pvpgn/conf/bnetd.conf`
```diff
-trackaddrs = "track.pvpgn.pro,track.pvpgn.org,bnet.mivabe.nl,track.eurobattle.net"
+trackaddrs = ""
```

## Docs drift (README.md)
- `:38-45` `pvpgn/.env` "must exist" + `docker network create proxy`: only needed by commented-out stats svc.
- `:52` `sudo chown -R 1000:1000 aura/data`: redundant, `aura-init` does it.
- `:123-124` stats seeders use `pvpgn_databse` → now `pvpgn-db`. Commented stats svc (`docker-compose.yml:61`) mounts `./pvpgn/var/pvpgn/ladders` → now inside `pvpgn-var`.
- `:131` `docker compose logs pvpgn` shows no bnetd errors until F17 fixed.
- No backup/restore section (`mysqldump` from `pvpgn-db`, `pvpgn-var` vol).
- `:19` clone URL points upstream `acollazo25`.

## Verification log
Local, 2026-09-29, OrbStack, `--platform linux/amd64`, image `binignet/pvpgn:review` built from `src/pvpgn`.
| # | Check | Result |
|---|---|---|
| 1 | `docker compose --env-file .env.example config` | OK; warns `version` obsolete |
| 2 | base: `ls /usr/local/etc/pvpgn`, `which getent sed awk` | all present; Ubuntu 20.04.3, runs root; base default `storage_path` = file mode (overridden) |
| 3 | `docker build --platform linux/amd64 src/pvpgn` | OK; templates = `bnetd.conf`, `address_translation.conf` |
| 4a | render `DB_PASS='a&b\|c\d'`, `aura`→10.0.0.9 | `pass=a&b\|c\d`; `10.0.0.9:6320 1.2.3.4:6320 NONE ANY` |
| 4b | render `DB_PASS='p;host=evil'` | `...;pass=p;host=evil;...` → F9 |
| 4c | no `PUBLIC_IP` / aura unresolvable / run twice | exit 1 / exit after 32s / 1 translation line |
| 5 | fresh named vol, then derived image adding `files/NEW_IN_IMAGE` | seeded 14 dirs; new file not in existing vol → F8 |
| 6 | bnetd start, DB unreachable | stdout "Server is now running.", exit 255; error only in `bnetd.log` → F17 |
| 7 | same, `logfile = "/dev/stdout"` | `sql_mysql_init: error connecting to database` on stdout |

## VPS checklist (not run)
```sh
docker compose up -d --build
docker compose ps                                  # pvpgn-db healthy, pvpgn/aura up
docker compose logs pvpgn | grep -i "error\|Address translation"
docker exec pvpgn_server tail -1 /usr/local/etc/pvpgn/address_translation.conf   # <aura-ip>:6320 <PUBLIC_IP>:6320 NONE ANY
docker compose logs aura | grep "logged in as"
docker compose up -d --force-recreate aura && docker exec pvpgn_server getent hosts aura   # F6: compare IP vs translation
# client: add gateway <PUBLIC_IP>, login, /w binignet_aura !host ..., join from outside network
```

## Out of scope / noted
- DB security: `MYSQL_ALLOW_EMPTY_PASSWORD: 1` (root, no pw), default `DB_PASS=secret`, phpmyadmin on `127.0.0.1:8085`. Localhost-bound; deferred.
- `pvpgn-db` data on bind `./pvpgn/database`.
- `aura` binds `./aura/data`, `./aura/config.ini`.

## Action backlog
- [x] **F17+F18** log to stdout, trim levels — `src/pvpgn/conf/bnetd.conf`. Accept: stop db, `compose logs pvpgn` shows `error connecting to database`.
- [x] **F9** reject `;` `"` in `DB_*` — `src/pvpgn/entrypoint.sh`. Accept: `DB_PASS='a;b'` → exit 1 w/ message.
- [x] **F7** pin `mysql-db`, `phpmyadmin` digests — `docker-compose.yml`. Accept: `compose config` shows `@sha256:` for all non-built images.
- [x] **F6** static aura IP — `docker-compose.yml`, README. Accept: recreate aura alone → `getent hosts aura` == translation IP, no pvpgn restart.
- [x] **F8** runtime-only vols — `docker-compose.yml`. Accept: rebuilt image w/ changed `files/` visible in running container; ladders survive recreate.
- [x] **README drift** — `README.md`. Accept: every command in README matches compose svc/container names.
- [x] **F13+F12** drop port 4000, `version:`, `proxy` net — `docker-compose.yml`. Accept: `compose config` no warnings.
- [x] **F16** pvpgn healthcheck — `docker-compose.yml`. Accept: `compose ps` healthy; stop db → pvpgn unhealthy/restarting.
- [x] **F10+F11** fix base comment, drop/annotate orphan dockerfiles — `src/`. Accept: no dockerfile unreferenced w/o note.
- [x] **F15** trackers/metadata — `src/pvpgn/conf/bnetd.conf`. Accept: intended values set.
- [x] **F14** README note on arm hosts.
