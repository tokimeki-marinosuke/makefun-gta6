# makefun-gta6

An original open-world crime game that runs in a desktop browser, built as an
entry for the make.fun bounty "Make GTA 6" (gta6-01).

- `main.ts` — entry program (Node 22). Writes `game/`, `screenshots/` and
  `dossier.json` to the output directory.
- `game/` — the playable static game (open `game/index.html` in Chrome).
- `screenshots/` — renders of the game itself, produced from deterministic
  scenes described in `shots.json`.
- `vendor/makefun-game.ts` — vendored make.fun kit helper, kept unchanged.

Everything in this repository is original work. No third-party game assets,
names, or IP are used.

Status: in development. This repository is private while the game is being
built.

License: MIT (see `LICENSE`).
