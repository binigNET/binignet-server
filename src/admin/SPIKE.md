# Phase 0 spike — findings

Local, 2026-09-29, OrbStack amd64 emulated, pvpgn 1.99.7.2.1, aura 13.6.4-bn.1. Client-side checks pending (marked **client TBD**).

## Telnet (`telnetaddrs = ":23"`)
- Flow: banner → `Username: ` → `Password: ` → welcome text → joins channel `Chat`. No telnet signup (`new` not supported).
- Login needs `auth_botlogin = true` (else `Account has no bot access.`).
- Replies are free text, CRLF. Many **success** msgs are prefixed `ERROR:` (e.g. `ERROR: Key set successfully...`) → never classify by prefix; match message text.
- Values in replies are backslash-escaped: `\"`, `\\`.
- Async lines interleave: `<from USER> msg` (whispers), `Broadcast: ...`, channel joins/leaves.
- **Flood quota**: `quota_lines = 5` / `quota_time = 5` → `ERROR: Your message quota has been exceeded!`. Send ≤1 cmd / 1.2s.
- Game-only cmds (reply `This command can only be used from the game.`): `/icon`.

## Commands (verified)
| Cmd | Reply |
|---|---|
| `/users` | `There are currently N users online, in G games, and in C channels.` |
| `/games all` | fixed-width table: `name p status type count ctag addr` |
| `/gameinfo <name>` | `ERROR: That game does not exist.` for aura lobby (likely clienttag mismatch from CHAT) → don't use |
| `/who <chan>` | `Users in channel X: a, b` |
| `/finger <u>` | multi-line; `Operator: No, Admin: Yes, Locked: Yes, Muted: No` |
| `/addacct <u> <p>` | **deactivated by default** (`#8 /addacct` in `command_groups.conf`). Once enabled: `Account N created.` — **echoes password** → never log replies raw |
| `/set <u> <key> [val]` | `Key set successfully for "u" (key = "val")` / `Current value of key is "v"` / `Value currently not set` |
| `/admin +<u>` | `u has been promoted to a Server Admin` |
| `/lock <u> <h> <reason>` / `/unlock <u>` | `Account u is now locked for ...` / `That user's account is now unlocked.` |
| `/ipban a <ip>` / `/ipban l` | writes `ipbanfile`; list `0: 10.9.9.9 (perm)` |
| `/announce <m>` | `Broadcast: Announcement from binignet_admin: m` |
| `/rehash <mode>` | `Rehash of "mode" is complete!` (`i18n`, `banners`, `commandgroups` tested) |
| `/stats <u> W3XP` | `Solo games: [Icon] XP xp (W - L)` + team, ffa |

## Accounts / bootstrap
- bnetd caches accounts; shutdown flushes cache → DB writes while running are lost. DB edit only works: stop pvpgn → UPDATE → start.
- Prod bootstrap (no restart), from existing admin in client:
  `/addacct binignet_admin <pw>` · `/set binignet_admin BNET\auth\botlogin true` · `/admin +binignet_admin` · `/set binignet_admin BNET\auth\command_groups 255`
- Requires `/addacct` enabled → bake `src/pvpgn/conf/command_groups.conf` w/ `8 /addacct`.
- DB cols (`pvpgn_BNET`): `auth_admin`, `auth_botlogin`, `auth_command_groups`, `auth_lock`, `auth_locktime`, `auth_lockreason`, `auth_mute*`.

## Ladder stats
- Per-user keys `Record\W3XP\{solo,team,ffa}_{level,xp,wins,losses}` (= `pvpgn_Record.W3XP_*` cols). Apply live, `/stats` reflects immediately.
- **AT**: team-based table `pvpgn_arrangedteam` (`teamid size member1..4 wins losses xp level rank`), not per-user; no `/set` key. **Open decision.**
- Icon: `Record\W3XP\userselected_icon` settable via `/set` (e.g. `KBKW`); `iconstash` too. Codes in `icons.conf` `[icons]`: KBKB KBKD KBKE KBKM KBKP KBKW WCYB. Visual effect **client TBD**.

## Status XML (`XML_status_output = true`)
- File `statusdir/server.xml`, rewritten every `output_update_secs` (default 60).
- `<Users><Number/><user><name/><clienttag/><version/><country/>[<gameid/>]</user>…` · `<Games><Number/><game><id/><name/><clienttag/></game>…` · `<Channels>` · `<Uptime>`.
- No player counts/owner/map per game → combine w/ aura `!games`.

## aura (whisper from sudo user)
- `!games` → `<from binignet_aura> Lobby#1: [DotA v6.85m4 LoD] "spike game" - owner - 0/12 : 0min` (no sudo needed).
- `!status` → `Status: [PVPGN - online]`.
- Sudo cmds (`!checkgame`, likely `!deletemap`): `!su <cmd>` → token written to `aura/data/aura.log` (`Confirm ... "!sudo <token> <cmd>"`) → `/w bot !sudo <token> <cmd>`. Works; avoid unless needed.
- `!host <map>, <name>` via whisper works.

## Files
- MOTD: edit `i18n/bnmotd.txt` + `/rehash i18n` → `/motd` shows new text. In-client **client TBD**.
- Banner: `ad.json` filename must be plain name inside `filedir` (`Paths are not supported`). → `filedir` must be on admin dir. Size/format in client **client TBD** (test: 400×100 png).

## Other
- Mac: `./pvpgn/database` bind → case-insensitive tables bug; override w/ named vol fixes it.
- Temp acct registration trick: one-shot aura container w/ `auto_register` creates any acct.
