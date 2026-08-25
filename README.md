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
   `css/`, `js/`, `logos/`, `favicon.svg`).
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

Edit the array, save, re-upload just `js/data.js`, refresh the page. No
build, nothing else to touch.

## Receiving order requests (with photo/logo attachments)

The Order form sends requests to **nexauraconsultant@gmail.com** via
Formspree (already set up — endpoint is in `js/app.js`). Text details
(name, email, finish, tier, total, message) reach the inbox reliably.

**Attached logos/photos currently do NOT come through** — Formspree's
**free plan rejects any submission that includes a file** with the error
`"File Uploads Not Permitted"`. The site already handles this gracefully:
if someone attaches a photo, it's left out of what's sent (with a note in
the email saying one was attached) rather than the whole submission
failing. The Order form shows a small banner explaining this.

**To actually receive attached photos, upgrade the Formspree plan**
(their paid tiers support file uploads) — once upgraded, re-enable sending
the file in `js/app.js`: find the `submit` handler's comment about
`"File Uploads Not Permitted"` and swap the `note` line back to
`data.append("logo", logoFile)`.

If you'd rather not pay for Formspree just for this, the `mailto:`
fallback (used automatically if `FORMSPREE_ENDPOINT` is ever unset) has
the same limitation for a different reason — plain email links can't carry
files at all either way.

Formspree also keeps every submission in its own dashboard (formspree.io,
"Submissions" tab) — so once it's set up, you get both: an email per order
**and** one place online where every order ever submitted is listed. No
extra work needed for that part beyond the Formspree setup above.

## Live tag management (add tags from the browser — no code editing)

By default, tags live in `js/data.js` and adding one means editing that
file and re-uploading it. To instead add/remove tags from a live "Manage
tags" panel on the site (the ⚙ button, bottom-right) — with changes
appearing for every visitor immediately, no re-upload — connect a free
Firebase backend (10 minutes, one time):

1. Go to https://console.firebase.google.com, sign in with
   `nexauraconsultant@gmail.com`, click **"Create a project"** (any name,
   Google Analytics can be skipped).
2. In the left sidebar: **Build → Firestore Database → Create database**
   → start in **production mode** → pick any location → Enable.
3. Still in Firestore: click the **Rules** tab, replace everything there
   with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /tags/{tagId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
   Click **Publish**. (This means: anyone can view tags — needed for the
   site to work — but only a signed-in admin can add or remove one.)
4. Left sidebar: **Build → Authentication → Get started → Sign-in method**
   → enable **Email/Password**.
5. Still in Authentication: **Users** tab → **Add user** → enter
   `nexauraconsultant@gmail.com` and set a password. This is what you'll
   type into the site's admin panel to sign in.
6. Click the ⚙ gear icon (top-left, next to "Project Overview") →
   **Project settings** → scroll to **"Your apps"** → click the `</>`
   (web) icon → give it any nickname → **Register app**. It'll show a
   `firebaseConfig = { ... }` object.
7. Open `js/firebase-config.js` in this project and paste those values in,
   replacing the `PASTE_...` placeholders.
8. Re-upload `js/firebase-config.js` (and `js/tags-store.js`, `js/admin.js`
   if you haven't already uploaded this whole delivery). Refresh the site.

From then on, the ⚙ panel lets you sign in and add tags (name, tagline,
description, URL, colors, logo upload) straight from the browser — they
appear on the rotating 3D cards and the Lineup grid for every visitor
within a second or two, no re-upload, no rebuild.

If this isn't set up, the site just keeps using `js/data.js` as before —
nothing breaks either way, and the ⚙ panel tells you it's not connected
instead of showing a login form.

## What's simplified vs. the React version

- Visual reflections on the 3D cards are slightly simpler (fewer synthetic
  light sources) since the fancy procedural-environment lighting used a
  React-Three-Fiber-only helper. Still metallic, still glowing, still
  orbits and reacts to hover/click the same way.

Everything else — the aurora background, the 6 colorways with live order
total, the pricing tiers, the cinematic intro, the real JAPP/Nexaura logos
on the rotating cards — is the same as the last version, just running
without a build step.
