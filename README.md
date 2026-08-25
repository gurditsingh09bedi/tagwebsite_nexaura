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

## Receiving orders (with photos) and adding tags

Both of these live in the same place: the ⚙ **Manage** panel on the live
site (bottom-right), once you've done the one-time Firebase setup below.
Sign in there and you'll see two tabs:

- **Orders** — every order ever submitted, newest first: name, email,
  chosen finish/tier, total, message, and **the actual attached photo**
  (if they attached one) shown right there. This is the reliable, always-
  works way to see photos — it doesn't depend on email or Formspree at
  all, so it's unaffected by the attachment limitation below.
- **Tags** — add/remove the tags shown on the rotating 3D cards and the
  Lineup grid (same as before).

**Email notifications still happen too, separately** — the Order form
also sends a text summary (name, email, finish, tier, total) to
**nexauraconsultant@gmail.com** via Formspree, so you get a heads-up email
per order even before opening the Orders panel. **Attached photos don't
come through this email** — Formspree's free plan rejects any submission
that includes a file — but that's fine, since the Orders panel already has
the photo reliably. If someone attaches a photo, the confirmation screen
also gives them a one-tap "email it directly" option as a backup.

**If Formspree emails aren't arriving:** log into formspree.io and check
the **Spam** tab on your form (not just Inbox) — Formspree sometimes
flags legitimate AJAX submissions as spam, which silently stops the email
notification. Mark any real orders found there as "Not spam" to release
them, and check the form's Settings tab for a spam-filter toggle to turn
down for future submissions. This doesn't affect the Orders panel above —
that's a separate, always-reliable path regardless of what Formspree does.

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
       match /orders/{orderId} {
         allow create: if true;
         allow read, update, delete: if request.auth != null;
       }
     }
   }
   ```
   Click **Publish**. (This means: anyone can view tags and submit an order
   — both needed for the site to work — but only a signed-in admin can add
   or remove a tag, and only a signed-in admin can ever read the list of
   submitted orders back.)
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
