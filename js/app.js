import { createTagScene } from "./scene.js";
import { subscribeTags } from "./tags-store.js";
import { submitOrder, ordersBackendAvailable, getOrderById, ORDER_STAGES, stageIndex } from "./orders-store.js";
import { compressImageToDataUrl } from "./img-utils.js";
import { sendOrderStatusEmail, isEmailJsConfigured } from "./email-notify.js";

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
const COLORWAYS_LOCAL = window.COLORWAYS;
const TIERS_LOCAL = window.TIERS;
const LIVE_EVENTS_LOCAL = window.LIVE_EVENTS;
const ORDER_STAGES_LOCAL = window.ORDER_STAGES;
const fmtUsd = window.fmtUsd;

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
function colorwayArt(c) {
  const isMetal = c.material === "metal";
  const [from, to] = c.gradient;

  const cardBg = isMetal
    ? `repeating-linear-gradient(115deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 2px, transparent 2px, transparent 7px), linear-gradient(160deg, ${c.sheen}, ${from} 45%, ${to} 100%)`
    : `linear-gradient(165deg, ${from}, ${to})`;

  return `
    <div class="thumb thumb-card" style="background:linear-gradient(135deg, ${from}22, ${to});">
      <div class="card-plate-wrap">
        <div class="card-plate ${isMetal ? "" : "card-plate-matte"}" style="background:${cardBg};">
          <div class="card-plate-shine ${isMetal ? "" : "card-plate-shine-soft"}"></div>
          ${isMetal ? '<div class="card-plate-shine-2"></div>' : ""}
          <div class="card-plate-rim"></div>
          <div class="card-plate-seam" style="background:${c.accent};color:${c.accent};"></div>
          <span class="card-material-tag">${isMetal ? "METAL" : "PLASTIC"}</span>
        </div>
        <div class="card-reflection" style="background:${cardBg};"></div>
      </div>
    </div>
  `;
}

function renderColorways() {
  const grid = document.getElementById("colorways-grid");
  grid.innerHTML = COLORWAYS_LOCAL.map((c, i) => `
    <button type="button" class="glass tag-card reveal" data-colorway-id="${c.id}" style="text-align:left;width:100%;">
      ${colorwayArt(c)}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1.5rem;margin-bottom:0.25rem;">
        <span class="mono-label" style="font-size:10px;color:rgba(252,211,77,0.5);">0${i + 1}</span>
        <span class="price-badge">${fmtUsd(c.price)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <h3 class="font-display" style="font-size:1.25rem;font-weight:600;color:#fff;">${c.name}</h3>
        <span class="material-badge material-badge-${c.material}">${c.material === "metal" ? "Metal" : "Plastic"}</span>
      </div>
      <p style="margin-top:0.25rem;font-size:0.875rem;color:rgba(201,205,211,0.62);">${c.tagline}</p>
      <p style="margin-top:0.75rem;font-size:0.75rem;line-height:1.6;color:rgba(201,205,211,0.55);">${c.description}</p>
      <div class="colorway-cta mono-label" style="margin-top:1.25rem;font-size:0.7rem;font-weight:500;color:#E8B84B;">Choose this finish →</div>
    </button>
  `).join("");

  grid.querySelectorAll("[data-colorway-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pickColorway(btn.dataset.colorwayId);
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  syncColorwaySelectionUI();
}

function syncColorwaySelectionUI() {
  document.querySelectorAll("#colorways-grid [data-colorway-id]").forEach((btn) => {
    const isSel = btn.dataset.colorwayId === selectedColorwayId;
    btn.classList.toggle("selected", isSel);
    btn.querySelector(".colorway-cta").textContent = isSel ? "Selected →" : "Choose this finish →";
  });
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
    <button type="button" class="glass tier-card reveal" data-tier-id="${t.id}" style="text-align:left;width:100%;">
      <div class="mono-label" style="font-size:10px;color:rgba(252,211,77,0.5);margin-bottom:0.5rem;">${t.name}</div>
      <div class="tier-price">${fmtUsd(t.price)}<span class="unit">/ tag</span></div>
      <p style="font-size:0.75rem;color:rgba(201,205,211,0.62);margin-bottom:1.25rem;">${t.tagline}</p>
      <ul class="tier-features">${t.features.map((f) => `<li>${f}</li>`).join("")}</ul>
      <div class="tier-cta plain">Choose ${t.name}</div>
    </button>
  `).join("");

  grid.querySelectorAll("[data-tier-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pickTier(btn.dataset.tierId);
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  syncTierSelectionUI();
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
function renderOrderPortal() {
  const swatches = document.getElementById("order-colorway-swatches");
  swatches.innerHTML = COLORWAYS_LOCAL.map((c) => `
    <button type="button" class="swatch-btn" data-colorway-id="${c.id}" title="${c.name} — ${fmtUsd(c.price)}">
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
      <div class="price">${fmtUsd(t.price)}</div>
    </button>
  `).join("");
  tierButtons.querySelectorAll("[data-tier-id]").forEach((btn) => {
    btn.addEventListener("click", () => pickTier(btn.dataset.tierId));
  });

  syncColorwaySelectionUI();
  syncTierSelectionUI();
  updateOrderTotal();

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
    const total = (colorway.price + tier.price) * qty;
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
    const finishLabel = `${colorway.name} (${fmtUsd(colorway.price)})`;
    const tierLabel = `${tier.name} (${fmtUsd(tier.price)})`;
    const totalLabel = fmtUsd(total);
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
        data.append("finish", `${colorway.name} (${fmtUsd(colorway.price)})`);
        data.append("tier", `${tier.name} (${fmtUsd(tier.price)})`);
        data.append("quantity", qty);
        data.append("total", fmtUsd(total));
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
      `Finish: ${colorway.name} (${fmtUsd(colorway.price)})`,
      `Tier: ${tier.name} (${fmtUsd(tier.price)})`,
      `Quantity: ${qty}`,
      `Total: ${fmtUsd(total)}`,
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
        ${colorway.name} · ${tier.name} · ${fmtUsd(total)} total — sent straight to Nexaura.
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
        ${colorway.name} · ${tier.name} · ${fmtUsd(total)} total.
        ${orderSavedWithPhoto ? " Your attached photo is saved with this order." : ""}
      </p>
      ${orderIdBlock}
      ${emailLogoButton}
    `;
  success.style.display = "block";
}

function updateOrderTotal() {
  const colorway = COLORWAYS_LOCAL.find((c) => c.id === selectedColorwayId);
  const tier = TIERS_LOCAL.find((t) => t.id === selectedTierId);
  const qty = Math.max(1, Number(document.getElementById("order-qty")?.value) || 1);
  const unitTotal = colorway.price + tier.price;
  const total = unitTotal * qty;
  const desc = document.getElementById("order-total-desc");
  const amount = document.getElementById("order-total-amount");
  if (desc) desc.textContent = `${colorway.name} (${fmtUsd(colorway.price)}) + ${tier.name} (${fmtUsd(tier.price)})${qty > 1 ? ` × ${qty}` : ""}`;
  if (amount) amount.textContent = fmtUsd(total);
  const submitBtn = document.getElementById("order-submit-btn");
  if (submitBtn) submitBtn.textContent = `Submit Request — ${fmtUsd(total)}`;
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
