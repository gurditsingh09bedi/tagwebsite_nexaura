import { createTagScene } from "./scene.js";

// Every order request opens the visitor's email app addressed here —
// change this if the inbox should ever be different.
const ORDER_INBOX = "nexauraconsultant@gmail.com";

const TAGS_LOCAL = window.TAGS;
const COLORWAYS_LOCAL = window.COLORWAYS;
const TIERS_LOCAL = window.TIERS;
const LIVE_EVENTS_LOCAL = window.LIVE_EVENTS;
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
  return `
    <div class="thumb" style="background:linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]});">
      <div class="sheen" style="background:radial-gradient(circle at 30% 20%, ${c.sheen}, transparent 55%);"></div>
      <div class="swatch" style="background:linear-gradient(160deg, ${c.sheen}, ${c.gradient[1]}); box-shadow:0 0 28px ${c.accent}66;">
        <div style="position:absolute;inset-block:0.5rem;left:0.35rem;width:0.25rem;border-radius:9999px;opacity:0.8;background:${c.accent};"></div>
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
      <h3 class="font-display" style="font-size:1.25rem;font-weight:600;color:#fff;">${c.name}</h3>
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

  document.getElementById("order-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = document.getElementById("order-form");
    const success = document.getElementById("order-success");
    const colorway = COLORWAYS_LOCAL.find((c) => c.id === selectedColorwayId);
    const tier = TIERS_LOCAL.find((t) => t.id === selectedTierId);
    const qty = Math.max(1, Number(document.getElementById("order-qty").value) || 1);
    const total = (colorway.price + tier.price) * qty;
    const name = document.getElementById("order-name").value;
    const email = document.getElementById("order-email").value;
    const message = document.getElementById("order-message").value;
    const hasLogo = fileInput.files.length > 0;

    // Sends the request straight to your inbox via a mailto: link — no
    // backend or third-party form service needed. Opens the visitor's own
    // email app with everything pre-filled; they just hit send.
    const subject = `Nexaura Tag order — ${name || "New request"}`;
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Finish: ${colorway.name} (${fmtUsd(colorway.price)})`,
      `Tier: ${tier.name} (${fmtUsd(tier.price)})`,
      `Quantity: ${qty}`,
      `Total: ${fmtUsd(total)}`,
      message ? `Message: ${message}` : "",
      hasLogo ? "\n(They attached a logo/photo in the form — ask them to reply with it, mailto links can't carry attachments.)" : "",
    ].filter(Boolean);
    const mailtoLink = `mailto:${ORDER_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailtoLink;

    form.style.display = "none";
    success.innerHTML = `
      <div style="font-size:1.75rem;margin-bottom:0.75rem;">✦</div>
      <p style="font-size:1.125rem;color:#fff;">Almost there.</p>
      <p style="margin-top:0.25rem;font-size:0.875rem;color:rgba(201,205,211,0.62);">
        Your email app should have opened with the request filled in — hit send there to reach Nexaura.
        ${colorway.name} · ${tier.name} · ${fmtUsd(total)} total.
      </p>
    `;
    success.style.display = "block";
  });

  document.getElementById("order-qty").addEventListener("input", updateOrderTotal);
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

// ---------- admin (simplified — no build/backend risk) ----------
function initAdmin() {
  document.getElementById("admin-toggle").addEventListener("click", () => {
    document.getElementById("admin-overlay").classList.add("open");
  });
  document.getElementById("admin-close").addEventListener("click", () => {
    document.getElementById("admin-overlay").classList.remove("open");
  });
}

// ---------- init ----------
window.addEventListener("tag-selected", (e) => setActiveTag(e.detail.id));

document.getElementById("footer-year").textContent = new Date().getFullYear();

runIntro();
renderLineup();
renderColorways();
renderPricing();
renderOrderPortal();
initLiveActivity();
initAdmin();
initScrollReveal();

window.__tagScene = createTagScene(document.getElementById("hero-canvas-wrap"), TAGS_LOCAL);
