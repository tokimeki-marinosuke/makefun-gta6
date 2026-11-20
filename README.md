# makefun-gta6

[![make.fun bounty: Make GTA 6](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![make.fun rank](https://make.fun/badge/gta6-01/tokimeki-marinosuke/makefun-gta6/rank.svg)](https://make.fun/bounty/gta6-01)
[![make.fun reward](https://make.fun/badge/gta6-01/tokimeki-marinosuke/makefun-gta6/reward.svg)](https://make.fun/bounty/gta6-01)

An original open-world crime game that runs in a desktop browser, built as an
entry for the make.fun bounty "Make GTA 6" (gta6-01):
https://make.fun/bounty/gta6-01

The game is **ASTER TIDE**: a top-down open-world crime game in a cute 2D
astronomy-themed city — five districts, traffic and pedestrians, car theft, a
wanted system with police chases, three astronomy-club missions, a HUD with a
minimap, a title screen, a local save, and fully synthesized sound.

- `main.ts` — entry program (Node 22). Writes `game/`, `screenshots/` and
  `dossier.json` to the output directory.
- `game/` — the playable static game (open `game/index.html` in Chrome).
- `screenshots/` — renders of the game itself, produced from deterministic
  scenes described in `shots.json`.
- `vendor/makefun-game.ts` — vendored make.fun kit helper, kept unchanged.

Everything in this repository is original work. No third-party game assets,
names, or IP are used.

License: MIT (see `LICENSE`).
