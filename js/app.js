import { createTagScene } from "./scene.js";
import { subscribeTags } from "./tags-store.js";
import { submitOrder, ordersBackendAvailable, getOrderById, ORDER_STAGES, stageIndex } from "./orders-store.js";
import { compressImageToDataUrl } from "./img-utils.js";
import { sendOrderStatusEmail, isEmailJsConfigured } from "./email-notify.js";
import { subscribeColorwayPrices, subscribeTierPrices } from "./pricing-store.js";
import { subscribeOffers, bestOfferFor } from "./offers-store.js";

// Every order request opens the visitor's email app addressed here —
// change this if the inbox should ever be different.
const ORDER_INBOX = "nexauraconsultant@gmail.com";

// ============================================================
// OPTIONAL BUT RECOMMENDED — lets the order form actually send the
// uploaded logo/photo to your inbox (a plain mailto: link can't carry
// attachments, so without this the photo never reaches you).
//
// 2-minute one-time setup:
//   1. Go to https://formspree.io -> sign up free with nexauraconsultant@gmail.com
//   2. "New Form" -> copy the endpoint it gives you, looks like:
//      https://formspree.io/f/xxxxabcd
//   3. Paste it below, replacing the placeholder.
//   4. Re-upload this one file (js/app.js). Done — no other setup.
//
// Until you do this, the form still works via a mailto: link (text
// details reach your inbox), it just can't include the photo.
// ============================================================
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xdenrpzl";
function isFormspreeConfigured() {
  return FORMSPREE_ENDPOINT.startsWith("https://formspree.io/");
}

let TAGS_LOCAL = window.TAGS; // replaced live if a Firestore backend is configured (see tags-store.js)
let COLORWAYS_LOCAL = window.COLORWAYS;
let TIERS_LOCAL = window.TIERS;
let OFFERS_LOCAL = window.OFFERS;
const LIVE_EVENTS_LOCAL = window.LIVE_EVENTS;
const ORDER_STAGES_LOCAL = window.ORDER_STAGES;
const fmtGbp = window.fmtGbp;

let selectedColorwayId = COLORWAYS_LOCAL[0].id;
let selectedTierId = TIERS_LOCAL[2].id;
let activeTagId = null;

// ---------- cinematic intro ----------
function runIntro() {
  const top = document.getElementById("intro-bar-top");
  const bottom = document.getElementById("intro-bar-bottom");
  const textEl = document.getElementById("intro-text");
  const overlay = document.getElementById("intro-overlay");
  const heroCopy = document.getElementById("hero-copy");

  textEl.innerHTML = `<div class="mono-label" style="font-size:12px;color:rgba(201,205,211,0.62);letter-spacing:0.5em;">A NEXAURA PRODUCTION</div>`;

  setTimeout(() => {
    top.style.height = "9vh";
    bottom.style.height = "9vh";
    textEl.style.opacity = "0";
    setTimeout(() => {
      textEl.innerHTML = `<div class="font-display text-glow" style="font-size:3.5rem;font-weight:700;color:#fff;">NEXAURA</div>`;
      textEl.style.opacity = "1";
    }, 400);
  }, 1000);

  setTimeout(() => {
    top.style.height = "0vh";
    bottom.style.height = "0vh";
    textEl.style.opacity = "0";
  }, 2800);

  setTimeout(() => {
    overlay.style.display = "none";
    heroCopy.classList.add("in");
  }, 3700);
}

// ---------- scroll reveal ----------
function initScrollReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "-60px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

// ---------- lineup ----------
function initColorwayLightbox() {
  document.getElementById("colorway-lightbox-close")?.addEventListener("click", () => {
    document.getElementById("colorway-lightbox").classList.remove("open");
  });
  document.getElementById("colorway-lightbox")?.addEventListener("click", (e) => {
    if (e.target.id === "colorway-lightbox") e.currentTarget.classList.remove("open");
  });
}

function renderLineup() {
  const grid = document.getElementById("lineup-grid");
  grid.innerHTML = TAGS_LOCAL.map((tag, i) => `
    <div class="glass tag-card reveal" data-tag-id="${tag.id}" style="animation-delay:${i * 0.1}s">
      <div class="thumb" style="background:linear-gradient(135deg, ${tag.baseColor || "#16181b"}, #0a0a0c);">
        ${tag.logo
          ? `<img src="${tag.logo}" alt="${tag.name} logo" />`
          : `<div class="swatch" style="background:linear-gradient(160deg, ${tag.baseColor || "#e9ebee"}, #9aa0a8); box-shadow:0 0 24px ${tag.accent}55;"></div>`
        }
      </div>
      <span class="mono-label" style="font-size:10px;color:rgba(252,211,77,0.5);">0${i + 1}</span>
      <h3 class="font-display" style="font-size:1.25rem;font-weight:600;color:#fff;margin-top:0.25rem;">${tag.name}</h3>
      <p style="margin-top:0.25rem;font-size:0.875rem;color:rgba(201,205,211,0.62);">${tag.tagline}</p>
      <p style="margin-top:0.75rem;font-size:0.75rem;line-height:1.6;color:rgba(201,205,211,0.55);">${tag.description}</p>
      <div style="margin-top:1.25rem;font-size:0.75rem;font-weight:500;color:#E8B84B;">
        ${tag.url && tag.url !== "#" ? "View Tag →" : "View in 3D →"}
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".tag-card").forEach((card) => {
    card.addEventListener("click", () => {
      const tag = TAGS_LOCAL.find((t) => t.id === card.dataset.tagId);
      setActiveTag(tag.id);
      if (tag.url && tag.url !== "#") window.open(tag.url, "_blank", "noopener");
    });
  });
}

function setActiveTag(id) {
  activeTagId = id;
  document.querySelectorAll("#lineup-grid .tag-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.tagId === id);
  });
  if (window.__tagScene) window.__tagScene.setActive(id);
}

// ---------- colorways ----------
function colorwayArt(c, big) {
  const isMetal = c.material === "metal";
  const [from, to] = c.gradient;

  const cardBg = isMetal
    ? `repeating-linear-gradient(115deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 2px, transparent 2px, transparent 7px), linear-gradient(160deg, ${c.sheen}, ${from} 45%, ${to} 100%)`
    : `linear-gradient(165deg, ${from}, ${to})`;

  // If a real photo has been set for this variant (drop a file in a
  // folder and set `photo: "..."` in js/data.js), it's used as-is instead
  // of the generated card art below.
  if (c.photo) {
    return `<img src="${c.photo}" alt="${c.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`;
  }

  const plateSize = big ? "width:7.5rem;height:11.8rem;" : "";
  return `
    <div class="card-plate-wrap">
      <div class="card-plate ${isMetal ? "" : "card-plate-matte"}" style="background:${cardBg};${plateSize}">
        <div class="card-plate-shine ${isMetal ? "" : "card-plate-shine-soft"}"></div>
        ${isMetal ? '<div class="card-plate-shine-2"></div>' : ""}
        <div class="card-plate-rim"></div>
        <div class="card-plate-seam" style="background:${c.accent};color:${c.accent};"></div>
        <span class="card-material-tag">${isMetal ? "METAL" : "PLASTIC"}</span>
      </div>
      ${!big ? `<div class="card-reflection" style="background:${cardBg};"></div>` : ""}
    </div>
  `;
}

// Which variant is currently shown big in each material's row — starts on
// each material's first variant, changes only when a swatch in that row
// is clicked (independent of the global order-portal selection, though
// clicking a swatch updates both).
const previewedByMaterial = {};

function materialGroups() {
  const groups = {};
  COLORWAYS_LOCAL.forEach((c) => {
    if (!groups[c.material]) groups[c.material] = [];
    groups[c.material].push(c);
  });
  return groups;
}

const MATERIAL_META = {
  plastic: { label: "Plastic", blurb: "Lightweight and durable — the affordable starting range." },
  metal: { label: "Metal", blurb: "Solid metal build — heavier, more durable, more premium." },
};

function renderColorways() {
  const wrap = document.getElementById("colorways-grid");
  const groups = materialGroups();

  wrap.innerHTML = Object.entries(groups).map(([materialId, variants]) => {
    if (!previewedByMaterial[materialId]) previewedByMaterial[materialId] = variants[0].id;
    const meta = MATERIAL_META[materialId] || { label: materialId, blurb: "" };
    return `
      <div class="glass material-row reveal" data-material="${materialId}">
        <div class="material-row-photo" data-material-photo="${materialId}" role="button" tabindex="0" title="Click to view larger"></div>
        <div class="material-row-info">
          <div class="material-badge material-badge-${materialId}" style="margin-bottom:0.5rem;">${meta.label}</div>
          <p style="font-size:0.75rem;color:rgba(201,205,211,0.55);margin-bottom:1rem;">${meta.blurb}</p>
          <div class="material-row-current" data-material-current="${materialId}"></div>
          <div class="swatch-row" data-material-swatches="${materialId}">
            ${variants.map((c) => `
              <button type="button" class="swatch-pick ${c.id === previewedByMaterial[materialId] ? "selected" : ""}" data-colorway-id="${c.id}" data-material="${materialId}">
                <span class="swatch-pick-dot" style="background:linear-gradient(160deg, ${c.gradient[0]}, ${c.gradient[1]});"></span>
                <span class="swatch-pick-name">${c.name}</span>
                <span class="swatch-pick-price">${fmtGbp(c.price)}</span>
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }).join("");

  Object.keys(groups).forEach((materialId) => updateMaterialRow(materialId));

  wrap.querySelectorAll("[data-colorway-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const materialId = btn.dataset.material;
      previewedByMaterial[materialId] = btn.dataset.colorwayId;
      updateMaterialRow(materialId);
      pickColorway(btn.dataset.colorwayId);
    });
  });

  wrap.querySelectorAll("[data-material-photo]").forEach((el) => {
    const open = () => openColorwayLightbox(previewedByMaterial[el.dataset.materialPhoto]);
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") open(); });
  });
}

function updateMaterialRow(materialId) {
  const variant = COLORWAYS_LOCAL.find((c) => c.id === previewedByMaterial[materialId]);
  if (!variant) return;
  const photoEl = document.querySelector(`[data-material-photo="${materialId}"]`);
  if (photoEl) photoEl.innerHTML = colorwayArt(variant, true);

  const currentEl = document.querySelector(`[data-material-current="${materialId}"]`);
  if (currentEl) {
    currentEl.innerHTML = `
      <h3 class="font-display" style="font-size:1.25rem;font-weight:600;color:#fff;">${variant.name}</h3>
      <p style="margin-top:0.2rem;font-size:0.85rem;color:rgba(201,205,211,0.62);">${variant.tagline}</p>
      <p style="margin-top:0.5rem;font-size:0.75rem;line-height:1.6;color:rgba(201,205,211,0.5);">${variant.description}</p>
      <div class="price-badge" style="margin-top:0.75rem;display:inline-block;font-size:0.85rem;">${fmtGbp(variant.price)}</div>
    `;
  }

  document.querySelectorAll(`[data-material-swatches="${materialId}"] [data-colorway-id]`).forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.colorwayId === variant.id);
  });
}

function openColorwayLightbox(id) {
  const variant = COLORWAYS_LOCAL.find((c) => c.id === id);
  if (!variant) return;
  // Real photo gets natural sizing (contain, capped to viewport) here — the
  // width:100%/height:100% version from colorwayArt() is meant for the
  // fixed-size material-row thumbnail, not this popup, which was the bug
  // (that box had no defined height here, so the image rendered at 0 size).
  const content = variant.photo
    ? `<img src="${variant.photo}" alt="${variant.name}" />`
    : colorwayArt(variant, true);
  document.getElementById("colorway-lightbox-content").innerHTML = content;
  document.getElementById("colorway-lightbox-caption").textContent = `${variant.name} — ${fmtGbp(variant.price)}`;
  document.getElementById("colorway-lightbox").classList.add("open");
}

function syncColorwaySelectionUI() {
  document.querySelectorAll("#order-colorway-swatches [data-colorway-id]").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.colorwayId === selectedColorwayId);
  });
}

function pickColorway(id) {
  selectedColorwayId = id;
  syncColorwaySelectionUI();
  updateOrderTotal();
}

// ---------- pricing tiers ----------
function renderPricing() {
  const grid = document.getElementById("pricing-grid");
  grid.innerHTML = TIERS_LOCAL.map((t) => `
    <div class="glass tier-card reveal" data-tier-id="${t.id}">
      <button type="button" class="tier-select-btn" data-tier-select="${t.id}">
        <div class="mono-label" style="font-size:10px;color:rgba(252,211,77,0.5);margin-bottom:0.5rem;">${t.name}</div>
        <div class="tier-price">${fmtGbp(t.price)}<span class="unit">/ tag</span></div>
        <p style="font-size:0.75rem;color:rgba(201,205,211,0.62);margin-bottom:1.25rem;">${t.tagline}</p>
        <ul class="tier-features">${t.features.map((f) => `<li>${f}</li>`).join("")}</ul>
        <div class="tier-cta plain">Choose ${t.name}</div>
      </button>

      <button type="button" class="tier-demo-open-btn" data-demo-tier="${t.id}">
        ▶ Click to see the demo
      </button>
    </div>
  `).join("");

  grid.querySelectorAll("[data-tier-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pickTier(btn.dataset.tierSelect);
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  grid.querySelectorAll("[data-demo-tier]").forEach((btn) => {
    btn.addEventListener("click", () => openTierDemo(btn.dataset.demoTier));
  });
  syncTierSelectionUI();
}

function openTierDemo(tierId) {
  const tier = TIERS_LOCAL.find((t) => t.id === tierId);
  if (!tier) return;
  document.getElementById("tier-demo-modal-title").textContent = `${tier.name} — see it in action`;
  document.getElementById("tier-demo-modal-stage").innerHTML = `
    <div class="tier-demo-phone">
      <span class="tier-demo-tap-pulse"></span>
      <span style="font-size:1.4rem;">📱</span>
      <span class="tier-demo-caption">Their phone</span>
    </div>
    <div class="tier-demo-arrow">›››</div>
    <div class="tier-demo-phone">
      <div class="tier-demo-info">
        ${tier.features.slice(0, 2).map((f) => `<div>✓ ${f}</div>`).join("")}
      </div>
      <span class="tier-demo-caption">Appears instantly</span>
    </div>
  `;
  document.getElementById("tier-demo-modal").classList.add("open");
}

function initTierDemoModal() {
  document.getElementById("tier-demo-modal-close")?.addEventListener("click", () => {
    document.getElementById("tier-demo-modal").classList.remove("open");
  });
  document.getElementById("tier-demo-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "tier-demo-modal") e.currentTarget.classList.remove("open");
  });
}

function syncTierSelectionUI() {
  document.querySelectorAll("#pricing-grid [data-tier-id]").forEach((btn) => {
    const tier = TIERS_LOCAL.find((t) => t.id === btn.dataset.tierId);
    const isSel = btn.dataset.tierId === selectedTierId;
    const featured = isSel || tier.highlight;
    btn.classList.toggle("featured", featured);
    const cta = btn.querySelector(".tier-cta");
    if (featured) {
      if (!btn.querySelector(".tier-badge")) {
        const b = document.createElement("div");
        b.className = "tier-badge";
        b.textContent = isSel ? "Selected" : "Most Popular";
        btn.prepend(b);
      } else {
        btn.querySelector(".tier-badge").textContent = isSel ? "Selected" : "Most Popular";
      }
      cta.className = "tier-cta featured";
      cta.textContent = isSel ? "Selected" : `Choose ${tier.name}`;
    } else {
      const existing = btn.querySelector(".tier-badge");
      if (existing) existing.remove();
      cta.className = "tier-cta plain";
      cta.textContent = `Choose ${tier.name}`;
    }
  });
  document.querySelectorAll("#order-tier-buttons [data-tier-id]").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.tierId === selectedTierId);
  });
}

function pickTier(id) {
  selectedTierId = id;
  syncTierSelectionUI();
  updateOrderTotal();
}

// ---------- order portal ----------
// Split so price updates (from the admin panel, live) can refresh just the
// swatches/tier-buttons/total without re-adding the dropzone/file-input/
// form-submit listeners a second time — renderOrderPortal() below calls
// this once and then does that one-time listener setup; the price
// subscription later only calls renderOrderPricingControls().
function renderOrderPricingControls() {
  const swatches = document.getElementById("order-colorway-swatches");
  swatches.innerHTML = COLORWAYS_LOCAL.map((c) => `
    <button type="button" class="swatch-btn" data-colorway-id="${c.id}" title="${c.name} — ${fmtGbp(c.price)}">
      <span class="swatch-dot" style="background:linear-gradient(160deg, ${c.gradient[0]}, ${c.gradient[1]}); box-shadow:0 0 10px ${c.accent}55;"></span>
      <span class="swatch-name">${c.name}</span>
    </button>
  `).join("");
  swatches.querySelectorAll("[data-colorway-id]").forEach((btn) => {
    btn.addEventListener("click", () => pickColorway(btn.dataset.colorwayId));
  });

  const tierButtons = document.getElementById("order-tier-buttons");
  tierButtons.innerHTML = TIERS_LOCAL.map((t) => `
    <button type="button" class="tier-btn-sm" data-tier-id="${t.id}">
      <div class="name">${t.name}</div>
      <div class="price">${fmtGbp(t.price)}</div>
    </button>
  `).join("");
  tierButtons.querySelectorAll("[data-tier-id]").forEach((btn) => {
    btn.addEventListener("click", () => pickTier(btn.dataset.tierId));
  });

  syncColorwaySelectionUI();
  syncTierSelectionUI();
  updateOrderTotal();
}

function renderOrderPortal() {
  renderOrderPricingControls();

  const dropzone = document.getElementById("order-dropzone");
  const fileInput = document.getElementById("order-logo-input");
  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Please pick an image under 5MB.");
      fileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      dropzone.querySelector(".dz-preview").innerHTML = `<img src="${reader.result}" alt="" />`;
      dropzone.querySelector(".hint").textContent = file.name;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("order-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = document.getElementById("order-form");
    const success = document.getElementById("order-success");
    const submitBtn = document.getElementById("order-submit-btn");
    const colorway = COLORWAYS_LOCAL.find((c) => c.id === selectedColorwayId);
    const tier = TIERS_LOCAL.find((t) => t.id === selectedTierId);
    const qty = Math.max(1, Number(document.getElementById("order-qty").value) || 1);
    const subtotal = (colorway.price + tier.price) * qty;
    const offer = bestOfferFor(OFFERS_LOCAL, qty);
    const total = offer ? subtotal - subtotal * (offer.percent / 100) : subtotal;
    const name = document.getElementById("order-name").value;
    const email = document.getElementById("order-email").value;
    const message = document.getElementById("order-message").value;
    const logoFile = fileInput.files[0] || null;

    // Save the order (with the photo, compressed, and a unique order ID)
    // to the shared backend first, if one's configured — this is the
    // durable, admin-visible record with the actual image and a
    // trackable ID, independent of whether the Formspree email step below
    // succeeds. Best-effort: a failure here doesn't block the rest of the
    // submit flow, it just means no order ID / tracking / photo storage.
    let orderSavedWithPhoto = false;
    let orderId = null;
    const finishLabel = `${colorway.name} (${fmtGbp(colorway.price)})`;
    const tierLabel = `${tier.name} (${fmtGbp(tier.price)})`;
    const totalLabel = fmtGbp(total);
    if (ordersBackendAvailable()) {
      try {
        const logoDataUrl = logoFile ? await compressImageToDataUrl(logoFile) : null;
        orderId = await submitOrder({
          name,
          email,
          finish: finishLabel,
          tier: tierLabel,
          quantity: qty,
          total: totalLabel,
          message: message || null,
          logo: logoDataUrl,
        });
        orderSavedWithPhoto = !!logoDataUrl;
      } catch (err) {
        console.error("Couldn't save order to the backend:", err);
        orderId = null;
      }
    }
    const needsManualLogoEmail = !!logoFile && !orderSavedWithPhoto;

    // Send the customer their own confirmation email right away — full
    // receipt, order ID, and a link to check status later. Independent of
    // the Formspree step below (that one notifies the business owner, not
    // the customer). Best-effort: never blocks the rest of the submit flow.
    if (orderId && email && isEmailJsConfigured()) {
      const trackingLink = `${window.location.origin}${window.location.pathname}#track-order`;
      sendOrderStatusEmail({
        toEmail: email,
        customerName: name,
        orderId,
        statusLabel: ORDER_STAGES[0].label,
        statusNote: ORDER_STAGES[0].customerNote,
        finish: finishLabel,
        tier: tierLabel,
        quantity: qty,
        total: totalLabel,
        trackingLink,
      }).then((result) => {
        if (!result.sent) console.warn("Order confirmation email to customer didn't go out:", result.reason);
      });
    }

    if (isFormspreeConfigured()) {
      // Sends the whole thing — including the attached logo/photo — to
      // Formspree, which forwards it straight to ORDER_INBOX by email.
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      try {
        const data = new FormData();
        data.append("name", name);
        data.append("email", email);
        data.append("finish", `${colorway.name} (${fmtGbp(colorway.price)})`);
        data.append("tier", `${tier.name} (${fmtGbp(tier.price)})`);
        data.append("quantity", qty);
        data.append("total", fmtGbp(total));
        if (message) data.append("message", message);
        if (needsManualLogoEmail) {
          data.append("note", `They attached a logo/photo (${logoFile.name}) in the form that couldn't be included here — ask them to send it directly.`);
        } else if (orderSavedWithPhoto) {
          data.append("note", "Their attached logo/photo is saved with this order in the Orders dashboard.");
        }

        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data,
        });

        if (res.ok) {
          showOrderSuccess(form, success, colorway, tier, total, true, needsManualLogoEmail, orderSavedWithPhoto, orderId);
        } else {
          submitBtn.disabled = false;
          updateOrderTotal();
          alert("Something went wrong sending your request — please try again, or email us directly.");
        }
      } catch (err) {
        submitBtn.disabled = false;
        updateOrderTotal();
        alert("Couldn't reach the form service — check your connection and try again.");
      }
      return;
    }

    // Formspree not set up yet — fall back to a mailto: link. This still
    // reaches the inbox, but can't carry the attached logo/photo (mailto
    // links don't support attachments).
    const subject = `Nexaura Tag order — ${name || "New request"}`;
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Finish: ${colorway.name} (${fmtGbp(colorway.price)})`,
      `Tier: ${tier.name} (${fmtGbp(tier.price)})`,
      `Quantity: ${qty}`,
      `Total: ${fmtGbp(total)}`,
      message ? `Message: ${message}` : "",
      logoFile ? "\n(They also attached a logo/photo in the form — ask them to reply with it.)" : "",
    ].filter(Boolean);
    const mailtoLink = `mailto:${ORDER_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailtoLink;
    showOrderSuccess(form, success, colorway, tier, total, false, needsManualLogoEmail, orderSavedWithPhoto, orderId);
  });

  document.getElementById("order-qty").addEventListener("input", updateOrderTotal);
}

function showOrderSuccess(form, success, colorway, tier, total, sentDirectly, hadLogoNotSent, orderSavedWithPhoto, orderId) {
  form.style.display = "none";

  const orderIdBlock = orderId
    ? `
      <div style="margin:1rem auto 0;max-width:16rem;border-radius:0.75rem;border:1px solid rgba(232,184,75,0.35);background:rgba(232,184,75,0.08);padding:0.9rem;">
        <div class="mono-label" style="font-size:9px;color:rgba(201,205,211,0.5);margin-bottom:0.3rem;">Your order ID — save this</div>
        <div class="font-display" style="font-size:1.4rem;font-weight:700;color:#E8B84B;letter-spacing:0.05em;">${orderId}</div>
        <div style="margin-top:0.5rem;font-size:0.7rem;color:rgba(201,205,211,0.5);">Use it below to check your order status anytime.${isEmailJsConfigured() ? " A confirmation email is on its way to you too." : ""}</div>
      </div>
    `
    : "";

  const emailLogoButton = hadLogoNotSent
    ? `
      <a href="mailto:${ORDER_INBOX}?subject=${encodeURIComponent("My logo/photo for the Nexaura Tag order")}&body=${encodeURIComponent("Hi Nexaura,\n\nAttaching the logo/photo for my order — please find it attached.\n")}"
         class="btn-gold" style="display:inline-block;margin-top:1.25rem;text-decoration:none;">
        📎 Email your logo/photo now
      </a>
      <p style="margin-top:0.6rem;font-size:0.7rem;color:rgba(201,205,211,0.4);">
        Opens your email app, addressed and ready — just attach the file yourself and hit send.
      </p>
    `
    : "";

  success.innerHTML = sentDirectly
    ? `
      <div style="font-size:1.75rem;margin-bottom:0.75rem;">✦</div>
      <p style="font-size:1.125rem;color:#fff;">You're on the list.</p>
      <p style="margin-top:0.25rem;font-size:0.875rem;color:rgba(201,205,211,0.62);">
        ${colorway.name} · ${tier.name} · ${fmtGbp(total)} total — sent straight to Nexaura.
        ${hadLogoNotSent ? " Your attached photo couldn't be included automatically — send it directly below." : ""}
        ${orderSavedWithPhoto ? " Your attached photo is saved with this order." : ""}
      </p>
      ${orderIdBlock}
      ${emailLogoButton}
    `
    : `
      <div style="font-size:1.75rem;margin-bottom:0.75rem;">✦</div>
      <p style="font-size:1.125rem;color:#fff;">Almost there.</p>
      <p style="margin-top:0.25rem;font-size:0.875rem;color:rgba(201,205,211,0.62);">
        Your email app should have opened with the request filled in — hit send there to reach Nexaura.
        ${colorway.name} · ${tier.name} · ${fmtGbp(total)} total.
        ${orderSavedWithPhoto ? " Your attached photo is saved with this order." : ""}
      </p>
      ${orderIdBlock}
      ${emailLogoButton}
    `;
  success.style.display = "block";
}

function renderOfferBanner() {
  const banner = document.getElementById("offer-banner");
  if (!banner) return;
  const general = OFFERS_LOCAL.find((o) => o.active !== false && (o.minQuantity || 1) <= 1);
  const bulk = OFFERS_LOCAL
    .filter((o) => o.active !== false && (o.minQuantity || 1) > 1)
    .sort((a, b) => b.percent - a.percent)[0];

  if (!general && !bulk) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "flex";
  banner.style.gap = "0.6rem";
  banner.style.flexWrap = "wrap";
  banner.innerHTML = `
    ${general ? `<span class="offer-pill">🏷 ${general.title} — ${general.percent}% off</span>` : ""}
    ${bulk ? `<span class="offer-pill offer-pill-bulk">📦 Order ${bulk.minQuantity}+ for your business — ${bulk.percent}% off</span>` : ""}
  `;
}

function updateOrderTotal() {
  const colorway = COLORWAYS_LOCAL.find((c) => c.id === selectedColorwayId);
  const tier = TIERS_LOCAL.find((t) => t.id === selectedTierId);
  const qty = Math.max(1, Number(document.getElementById("order-qty")?.value) || 1);
  const unitTotal = colorway.price + tier.price;
  const subtotal = unitTotal * qty;

  const offer = bestOfferFor(OFFERS_LOCAL, qty);
  const discountAmount = offer ? subtotal * (offer.percent / 100) : 0;
  const total = subtotal - discountAmount;

  const desc = document.getElementById("order-total-desc");
  const amount = document.getElementById("order-total-amount");
  const offerLine = document.getElementById("order-offer-line");
  if (desc) desc.textContent = `${colorway.name} (${fmtGbp(colorway.price)}) + ${tier.name} (${fmtGbp(tier.price)})${qty > 1 ? ` × ${qty}` : ""}`;
  if (amount) {
    amount.innerHTML = offer
      ? `<span style="text-decoration:line-through;opacity:0.4;font-size:0.75em;margin-right:0.4rem;">${fmtGbp(subtotal)}</span>${fmtGbp(total)}`
      : fmtGbp(total);
  }
  if (offerLine) {
    offerLine.textContent = offer ? `🏷 ${offer.title} — ${offer.percent}% off applied` : "";
    offerLine.style.display = offer ? "block" : "none";
  }
  const submitBtn = document.getElementById("order-submit-btn");
  if (submitBtn) submitBtn.textContent = `Submit Request — ${fmtGbp(total)}`;
}

// ---------- live activity ----------
function initLiveActivity() {
  const el = document.getElementById("live-activity");
  function cycle() {
    const ev = LIVE_EVENTS_LOCAL[Math.floor(Math.random() * LIVE_EVENTS_LOCAL.length)];
    el.innerHTML = `
      <div class="glass-strong live-card shadow-neon">
        <span style="font-size:1.125rem;">${ev.icon}</span>
        <div>
          <div class="mono-label" style="font-size:9px;color:rgba(252,211,77,0.6);">Live activity</div>
          <div style="font-size:0.75rem;color:rgba(232,236,241,0.9);">${ev.text}</div>
        </div>
      </div>
    `;
    const card = el.querySelector(".live-card");
    requestAnimationFrame(() => card.classList.add("show"));
    setTimeout(() => {
      card.classList.remove("show");
      setTimeout(cycle, 1800);
    }, 4200);
  }
  setTimeout(cycle, 2200);
}

// ---------- track order ----------
function renderStageTracker(order) {
  const current = stageIndex(order.status);
  const steps = ORDER_STAGES.map((stage, i) => {
    const done = i < current;
    const active = i === current;
    return `
      <div class="track-step ${done ? "done" : ""} ${active ? "active" : ""}">
        <div class="track-step-dot">${done ? "✓" : i + 1}</div>
        <div class="track-step-label">${stage.label}</div>
      </div>
    `;
  }).join("");

  const currentStage = ORDER_STAGES[current];
  return `
    <div class="glass-strong" style="padding:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;">
        <div>
          <div class="mono-label" style="font-size:9px;color:rgba(201,205,211,0.45);">Order ${order.orderId || order.id}</div>
          <div style="font-size:1rem;font-weight:600;color:#fff;margin-top:0.2rem;">${order.finish || ""} · ${order.tier || ""}</div>
        </div>
        <span class="price-badge">${order.total || ""}</span>
      </div>
      <div class="track-stepper">${steps}</div>
      <p style="margin-top:1.25rem;font-size:0.8rem;color:rgba(201,205,211,0.6);">${currentStage?.customerNote || ""}</p>
    </div>
  `;
}

function initTrackOrder() {
  const form = document.getElementById("track-order-form");
  const input = document.getElementById("track-order-input");
  const errorEl = document.getElementById("track-order-error");
  const resultEl = document.getElementById("track-order-result");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.style.display = "none";
    resultEl.style.display = "none";
    const id = input.value.trim();
    if (!id) return;

    if (!ordersBackendAvailable()) {
      errorEl.textContent = "Order tracking isn't set up on this site yet.";
      errorEl.style.display = "block";
      return;
    }

    const btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Looking up...";
    try {
      const order = await getOrderById(id);
      if (!order) {
        errorEl.textContent = "No order found with that ID — double-check and try again.";
        errorEl.style.display = "block";
      } else {
        resultEl.innerHTML = renderStageTracker(order);
        resultEl.style.display = "block";
      }
    } catch (err) {
      errorEl.textContent = "Couldn't look that up right now — try again in a moment.";
      errorEl.style.display = "block";
    }
    btn.disabled = false;
    btn.textContent = "Track";
  });
}

// admin panel open/close/login/CRUD logic lives entirely in js/admin.js now,
// loaded as its own module from index.html — it owns the toggle/close
// buttons so there's exactly one listener on each.

// ---------- init ----------
window.addEventListener("tag-selected", (e) => setActiveTag(e.detail.id));

document.getElementById("footer-year").textContent = new Date().getFullYear();

runIntro();
renderColorways();
renderPricing();
renderOrderPortal();
initLiveActivity();
initScrollReveal();
initTrackOrder();
initColorwayLightbox();
initTierDemoModal();

// Tags (and the rotating 3D cards + Lineup grid built from them) come from
// Firestore if a backend is configured, otherwise from the local js/data.js
// list — either way this fires once immediately, then again any time a
// tag is added/removed from the live backend, rebuilding the 3D scene and
// grid so new tags show up without anyone needing to refresh.
subscribeTags((tags) => {
  TAGS_LOCAL = tags;
  renderLineup();
  initScrollReveal(); // newly-rendered Lineup cards need their own observer pass

  if (window.__tagScene) window.__tagScene.destroy();
  const container = document.getElementById("hero-canvas-wrap");
  container.innerHTML = "";
  window.__tagScene = createTagScene(container, TAGS_LOCAL);
  if (activeTagId) window.__tagScene.setActive(activeTagId);
});

// Colorway/tier prices — same fallback-then-live pattern as tags: render
// once immediately from js/data.js, then again whenever the admin panel
// changes a price, for every visitor with the page open, no refresh needed.
subscribeColorwayPrices((colorways) => {
  COLORWAYS_LOCAL = colorways;
  renderColorways();
  renderOrderPricingControls();
  initScrollReveal();
});

subscribeTierPrices((tiers) => {
  TIERS_LOCAL = tiers;
  renderPricing();
  renderOrderPricingControls();
  initScrollReveal();
});

subscribeOffers((offers) => {
  OFFERS_LOCAL = offers;
  renderOfferBanner();
  updateOrderTotal();
});
