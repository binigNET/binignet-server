Commands
---

Parameters in angled brackets **{like this}** are required and parameters in square brackets **[like this]** are optional.

Note that although the commands are listed with a **"!"** as the command trigger, the actual command triggers are controlled by the settings in your ghost.cfg file.

## In battle.net (via local chat or whisper at any time) or in any game lobby or in any game:

**?trigger** tells you what the bot's command trigger is

Note that the **"?trigger"** command always uses a **"?"** as the command trigger, regardless of any command trigger settings in your bot.

If sent via battle.net the bot will only respond to anonymous users if bnet_publiccommands = 1.

If sent via any game lobby or any game the bot will respond with a private message visible only to the requesting user.

## In battle.net (via local chat or whisper at any time):
---

**!addadmin {name}** add a new admin to the database for this realm

**!addban {name} [reason]** add a new ban to the database for this realm

**!announce {sec} {msg}** set the announce message (the bot will print **{msg}** every **{sec}** seconds in the lobby), use "off" to disable the announce message

**!autohost {m} {p} {n}** auto host up to **{m}** games, auto starting when **{p}** players have joined, with name **{n}**, use "off" to disable auto hosting

**!autohostmm {m} {p} {a} {b} {n}** auto host up to **{m}** games, auto starting when {p} players have joined, with name **{n}**, with matchmaking enabled and min score **{a}**, max score **{b}**

**!autostart {players}** auto start the game when the specified number of players have joined, use "off" to disable auto start

**!ban** alias to **!addban**

**!channel {name}** change battle.net channel

**!checkadmin {name}** check if a user is an admin on this realm

**!checkban {name}** check if a user is banned on this realm

**!close {number}** ... close slot

**!closeall** close all open slots

**!countadmins** display the total number of admins for this realm

**!countbans** display the total number of bans for this realm

**!dbstatus** show database status information

**!deladmin {name}** remove an admin from the database for this realm

**!delban {name}** remove a ban from the database for all realms

**!disable** disable creation of new games

**!downloads {0|1|2}** disable/enable/conditional map downloads

**!enable** enable creation of new games

**!end {number}** end the specified game in progress (disconnect everyone), only root admins can end games where the game owner is still playing

**!enforcesg {filename}** load a replay to be used as a template for the player layout in the next saved game

**!exit [force|nice]** shutdown ghost++, optionally add **[force]** to skip checks or **[nice]** to allow running games to finish first

**!getclan** refresh the internal copy of the clan members list

**!getfriends** refresh the internal copy of the friends list

**!getgame {number}** display information about a game in progress

**!getgames** display information about all games

**!hold {name}** ... hold a slot for someone

**!hostsg {name}** host a saved game

**!load {pattern}** load a map config file (".cfg" files), leave blank to see current map

**!loadsg {filename}** load a saved game

**!map {pattern}** load a map file (".w3m" and ".w3x" files), leave blank to see current map

**!open {number}** ... open slot

**!openall** open all closed slots

**!priv {name}** host private game

**!privby {owner} {name}** host private game by another player (gives **{owner}** access to admin commands in the game lobby and in the game)

**!pub {name}** host public game

**!pubby {owner} {name}** host public game by another player (gives **{owner}** access to admin commands in the game lobby and in the game)

**!quit [force|nice]** alias to !exit

**!reload** reload the main configuration files

**!say {text}** send **{text}** to battle.net as a chat command

!**saygame {number} {text}** send **{text}** to the specified game in progress

!**saygames {text}** send **{text}** to all games

**!sp** shuffle players

**!start [force]** start game, optionally add **[force**] to skip checks

**!stats [name]** display basic player statistics, optionally add **[name]** to display statistics for another player (can be used by non admins)

**!statsdota [name]** display DotA player statistics, optionally add **[name]** to display statistics for another player (can be used by non admins)

**!swap {n1} {n2}** swap slots

**!unban {name}** alias to **!delban**

**!unhost** unhost game in lobby, only root admins can unhost games where the game owner is in the lobby

**!version** display version information (can be used by non admins)

**!wardenstatus** show warden status information

  

## In game lobby:
---
  

**!a** alias to **!abort**

**!abort** abort countdown

**!addban {name} [reason]** add a new ban to the database (it tries to do a partial match)

**!announce {sec} {msg}** set the announce message (the bot will print **{msg}** every **{sec}** seconds), leave blank or "off" to disable the announce message

**!autostart {players}** auto start the game when the specified number of players have joined, leave blank or "off" to disable auto start

**!autosave {on/off}** enable or disable autosaving

**!ban** alias to **!addban**

**!check {name}** check a user's status (leave blank to check your own status)

**!checkban {name}** check if a user is banned on any realm

**!checkme** check your own status (can be used by non admins, sends a private message visible only to the user)

**!clearhcl** clear the HCL command string

**!close {number}** ... close slot

**!closeall** close all open slots

**!comp {slot} {skill}** create a computer in slot **{slot}** of skill **{skill}** (skill is 0 for easy, 1 for normal, 2 for insane)

!**compcolour {s} {c}** change a computer's colour in slot **{s}** to **{c}** (c goes from 1 to 12)

**!comphandicap {s} {h}** change a computer's handicap in slot **{s}** to **{h}** (h is 50, 60, 70, 80, 90, or 100)

**!comprace {s} {r}** change a computer's race in slot **{s}** to **{r}** (r is "human", "orc", "night elf", "undead", or "random")

**!compteam {s} {t}** change a computer's team in slot **{s}** to **{t}** (t goes from 1 to # of teams)

**!dl {name}** alias to **!download**

**!download {name}** allow a user to start downloading the map (only used with conditional map downloads, it tries to do a partial match)

**!fakeplayer** create or delete a fake player to occupy a slot during the game (the player will not do anything except stay AFK)

**!from** display the country each player is from

**!hcl {string}** set the HCL command string

**!hold {name}** ... hold a slot for someone

**!kick {name}** kick a player (it tries to do a partial match)

**!latency {number}** set game latency (20-500), leave blank to see current latency

**!lock** lock the game so only the game owner can run commands

**!messages {on/off}** enable or disable local admin messages for this game (battle.net messages relayed to local admins in game)

**!mute {name}** mute a player (it tries to do a partial match)

**!open {number}** ... open slot

**!openall** open all closed slots

**!owner [name]** set game owner to yourself, optionally add **[name]** to set game owner to someone else

**!ping [number]** ping players, optionally add **[number]** to kick players with ping above **[number]**

**!priv {name}** rehost as private game

**!pub {name}** rehost as public game

**!refresh {on/off}** enable or disable refresh messages

**!say {text}** send **{text}** to all connected battle.net realms as a chat command (this command is HIDDEN from other players)

**!sendlan {ip} [port]** send a fake LAN message to IP address **{ip}** and port **[port]**, default port is 6112 if not specified

**!sp** shuffle players

**!start [force]** start game, optionally add **[force]** to skip checks

**!stats [name]** display basic player statistics, optionally add **[name]** to display statistics for another player (can be used by non admins)

**!statsdota [name]** display DotA player statistics, optionally add **[name]** to display statistics for another player (can be used by non admins)

**!swap {n1} {n2}** swap slots

**!synclimit {number}** set sync limit for the lag screen (10-10000), leave blank to see current sync limit

**!unhost** unhost game

**!unlock** unlock the game

**!unmute {name}** unmute a player (it tries to do a partial match)

**!version** display version information (can be used by non admins, sends a private message visible only to the user)

**!virtualhost {name}** change the virtual host name

**!votecancel** cancel a votekick

**!votekick {name}** start a votekick (it tries to do a partial match, can be used by non admins)

**!w {name} {message}** send a whisper on every connected battle.net realm from the bot's account to the player called **{name}** (this command is HIDDEN from other players)

**!yes** register a vote in the votekick (can be used by non admins)

  

## In game:
---
  

**!addban {name} [reason]** add a new ban to the database (it tries to do a partial match)

**!autosave {on/off}** enable or disable autosaving

**!ban** alias to !addban

**!banlast {reason}** ban the last leaver

**!check {name}** check a user's status (leave blank to check your own status)

**!checkban {name}** check if a user is banned on any realm

**!checkme** check your own status (can be used by non admins, sends a private message visible only to the user)

**!drop** drop all lagging players

**!end** end the game (disconnect everyone)

**!fppause** force the FakePlayer (if it exists) to pause the game

**!fpresume** force the FakePlayer (if it exists) to resume the game

**!from** display the country each player is from

**!kick {name}** kick a player (it tries to do a partial match)

**!latency {number}** set game latency (20-500), leave blank to see current latency

**!lock** lock the game so only the game owner can run commands

**!messages {on/off}** enable or disable local admin messages for this game (battle.net messages relayed to local admins in game)

**!mute {name}** mute a player (it tries to do a partial match)

**!muteall** mute global chat (allied and private chat still works)

**!owner [name]** set game owner to yourself, optionally add **[name]** to set game owner to someone else

**!ping** ping players

**!say {text}** send **{text}** to all connected battle.net realms as a chat command (this command is HIDDEN from other players)

**!stats [name]** display basic player statistics, optionally add **[name]** to display statistics for another player (can be used by non admins)

**!statsdota [name]** display DotA player statistics, optionally add **[name]** to display statistics for another player (can be used by non admins)

**!synclimit {number}** set sync limit for the lag screen (10-10000), leave blank to see current sync limit

**!unlock** unlock the game

**!unmute {name}** unmute a player (it tries to do a partial match)

**!unmuteall** unmute global chat

**!version** display version information (can be used by non admins, sends a private message visible only to the user)

**!votecancel** cancel a votekick

**!votekick {name}** start a votekick (it tries to do a partial match, can be used by non admins)

**!w {name} {message}** send a whisper on every connected battle.net realm from the bot's account to the player called **{name}** (this command is HIDDEN from other players)

**!yes** register a vote in the votekick (can be used by non admins)

  

## In admin game lobby:
---



**!addadmin {name} [realm]** add a new admin to the database for the specified realm (if only one realm is defined in ghost.cfg it uses that realm instead)

**!autohost {m} {p} {n}** auto host up to **{m}** games, auto starting when **{p}** players have joined, with name **{n}**, use "off" to disable auto hosting

**!autohostmm {m} {p} {a} {b} {n}** auto host up to **{m}** games, auto starting when **{p}** players have joined, with name **{n}**, with matchmaking enabled and min score **{a}**, max score **{b}**

**!checkadmin {name} [realm]** check if a user is an admin for the specified realm (if only one realm is defined in ghost.cfg it uses that realm instead)

**!checkban {name} [realm]** check if a user is banned on the specified realm (if only one realm is defined in ghost.cfg it uses that realm instead)

**!countadmins [realm]** display the total number of admins for the specified realm (if only one realm is defined in ghost.cfg it uses that realm instead)

**!countbans [realm]** display the total number of bans on the specified realm (if only one realm is defined in ghost.cfg it uses that realm instead)

**!deladmin {name} [realm]** remove an admin from the database for the specified realm (if only one realm is defined in ghost.cfg it uses that realm instead)

**!delban {name}** remove a ban from the database for all realms

**!disable** disable creation of new games

**!downloads {0|1|2}** disable/enable/conditional map downloads

**!enable** enable creation of new games

**!end {number}** end a game in progress (disconnect everyone)

**!enforcesg {filename}** load a replay to be used as a template for the player layout in the next saved game

**!exit [force|nice]** shutdown ghost++, optionally add **[force]** to skip checks or **[nice]** to allow running games to finish first

**!getgame {number}** display information on a game in progress

**!getgames** display information on all games

**!hostsg {name}** host a saved game

**!load {pattern}** load a map config file (".cfg" files), leave blank to see current map

**!loadsg {filename}** load a saved game

**!map {pattern}** load a map file (".w3m" and ".w3x" files), leave blank to see current map

**!password {p}** login (the password is set in ghost.cfg with admingame_password)

**!priv {name}** host private game

!**privby {owner} {name}** host private game by another player (gives **{owner}** access to admin commands in the game lobby and in the game)

**!pub {name}** host public game

**!pubby {owner} {name}** host public game by another player (gives **{owner}** access to admin commands in the game lobby and in the game)

**!quit [force|nice]** alias to !exit

**!reload** reload the main configuration files

**!say {text}** send **{text}** to all connected battle.net realms as a chat command

**!saygame {number} {text}** send **{text}** to the specified game in progress

**!saygames {text}** send **{text}** to all games

**!unban {name}** alias to **!delban**

**!unhost** unhost game in lobby (not the admin game)

**!w {name} {message}** send a whisper on every connected battle.net realm from the bot's account to the player called **{name}**