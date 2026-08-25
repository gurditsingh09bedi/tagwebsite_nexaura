# NEXAURA — plain HTML/CSS/JS version (no build step)

This is a full rewrite with **zero build tools**. No npm, no Vite, no
React, no GitHub Actions, no `.yml` files. Just HTML, CSS, and JavaScript
files that a browser runs directly. Three.js (for the 3D rotating cards)
loads straight from a CDN.

## How to deploy (2 minutes, one time)

1. **Delete everything** currently in your repo (all of it — old
   `.github/`, `src/`, `public/`, everything). This avoids any leftover
   file from the old React version conflicting with this one.
2. Upload every file in this folder to your repo root (`index.html`,
   `css/`, `js/`, `logos/`, `client-thumbs/`, `favicon.svg`).
3. Repo → **Settings → Pages → Build and deployment → Source** → set to
   **"Deploy from a branch"**, branch `main`, folder `/ (root)`. (Not
   "GitHub Actions" this time — there's nothing to build, so plain branch
   deploy is correct and simpler.)
4. Wait ~1 minute, then visit your site.

That's it. No Actions to babysit, no build to fail, no `dist/` folder, no
cache busting from a build step. Every time you edit and re-upload a file,
GitHub Pages just serves the new version directly.

## How to edit things

Everything editable lives in **`js/data.js`** — one file, plain arrays:

- `TAGS` — the tags on the rotating 3D cards + Lineup grid. Add an object
  with `name`, `tagline`, `description`, `accent`, `baseColor`, `url`, and
  optionally `logo: "logos/yourfile.png"` (drop the image in `logos/`
  first).
- `COLORWAYS` — the 6 finishes and their prices.
- `TIERS` — the 4 service tiers and their prices.
- `CLIENTS` — the "Our Clients" showcase cards.

Edit the array, save, re-upload just `js/data.js`, refresh the page. No
build, nothing else to touch.

## What's simplified vs. the React version

- **No admin panel with GitHub login/token** — that added a whole backend
  sync layer, which was extra complexity this version intentionally
  avoids. To add a tag now, edit `js/data.js` directly (or ask me to do it
  and hand you the one updated file).
- **Order form doesn't send anywhere yet** — same as before, it shows a
  success message but needs a Formspree endpoint (or your own backend)
  wired into the `submit` handler in `js/app.js` to actually receive
  submissions.
- Visual reflections on the 3D cards are slightly simpler (fewer synthetic
  light sources) since the fancy procedural-environment lighting used a
  React-Three-Fiber-only helper. Still metallic, still glowing, still
  orbits and reacts to hover/click the same way.

Everything else — the aurora background, the 6 colorways with live order
total, the pricing tiers, the client showcase, the cinematic intro, the
real JAPP/Nexaura logos on the rotating cards — is the same as the last
version, just running without a build step.
