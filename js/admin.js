import { subscribeTags, addTagRemote, deleteTagRemote, signInAdmin, signOutAdmin, onAuthChange } from "./tags-store.js";
import { subscribeOrders, updateOrderStatus, ORDER_STAGES, stageIndex } from "./orders-store.js";
import { sendOrderStatusEmail, isEmailJsConfigured } from "./email-notify.js";
import { subscribeColorwayPrices, subscribeTierPrices, updateColorwayPrice, updateTierPrice } from "./pricing-store.js";
import { subscribeOffers, addOffer, updateOffer, deleteOffer } from "./offers-store.js";
import { isFirebaseConfigured } from "./firebase-config.js";
import { compressImageToDataUrl } from "./img-utils.js";

const overlay = document.getElementById("admin-overlay");
const toggleBtn = document.getElementById("admin-toggle");
const closeBtn = document.getElementById("admin-close");

const noBackendEl = document.getElementById("admin-no-backend");
const loginEl = document.getElementById("admin-login");
const dashboardEl = document.getElementById("admin-dashboard");

toggleBtn.addEventListener("click", () => overlay.classList.add("open"));
closeBtn.addEventListener("click", () => overlay.classList.remove("open"));

function showPanel(panel) {
  [noBackendEl, loginEl, dashboardEl].forEach((el) => { el.style.display = "none"; });
  panel.style.display = "block";
}

// ---------- tags ----------
let currentTags = [];
let tagsAreLive = false;
subscribeTags((tags, isLive) => {
  currentTags = tags;
  tagsAreLive = isLive;
  renderTagList();
});

// ---------- pricing ----------
// Publicly readable (like tags) — no need to wait for auth like orders below.
let currentColorways = [];
let currentTiers = [];
subscribeColorwayPrices((colorways) => {
  currentColorways = colorways;
  renderPricingLists();
});
subscribeTierPrices((tiers) => {
  currentTiers = tiers;
  renderPricingLists();
});

// ---------- offers ----------
let currentOffers = [];
subscribeOffers((offers) => {
  currentOffers = offers;
  renderOfferList();
});

// ---------- orders ----------
// Unlike tags (publicly readable), orders require being signed in first —
// Firestore's security rules reject the read otherwise. So this only
// starts listening once onAuthChange below confirms someone's actually
// signed in, instead of trying immediately on page load (which would race
// against auth finishing and silently fail with "no orders" forever).
let currentOrders = [];
let unsubscribeOrders = null;

if (!isFirebaseConfigured()) {
  showPanel(noBackendEl);
} else {
  onAuthChange((user) => {
    if (user) {
      showPanel(dashboardEl);
      const who = document.getElementById("admin-signed-in-as");
      if (who) who.textContent = user.email;
      renderTagList();

      if (!unsubscribeOrders) {
        unsubscribeOrders = subscribeOrders((orders) => {
          currentOrders = orders;
          renderOrderList();
          updateOrdersBadge();
        });
      }
    } else {
      showPanel(loginEl);
      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
        currentOrders = [];
      }
    }
  });
}

document.getElementById("admin-login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;
  const errorEl = document.getElementById("admin-login-error");
  errorEl.style.display = "none";
  try {
    await signInAdmin(email, password);
  } catch (err) {
    errorEl.textContent = "Sign-in failed — check the email and password.";
    errorEl.style.display = "block";
  }
});

document.getElementById("admin-signout")?.addEventListener("click", () => signOutAdmin());

document.getElementById("order-photo-lightbox-close")?.addEventListener("click", () => {
  document.getElementById("order-photo-lightbox").classList.remove("open");
});
document.getElementById("order-photo-lightbox")?.addEventListener("click", (e) => {
  if (e.target.id === "order-photo-lightbox") e.currentTarget.classList.remove("open");
});

// ---------- tab switching (Tags / Orders / Pricing) inside the dashboard ----------
const tabs = {
  tags: { btn: document.getElementById("admin-tab-tags"), panel: document.getElementById("admin-panel-tags") },
  orders: { btn: document.getElementById("admin-tab-orders"), panel: document.getElementById("admin-panel-orders") },
  pricing: { btn: document.getElementById("admin-tab-pricing"), panel: document.getElementById("admin-panel-pricing") },
  offers: { btn: document.getElementById("admin-tab-offers"), panel: document.getElementById("admin-panel-offers") },
};

function updateOrdersBadge() {
  const badge = document.getElementById("admin-orders-badge");
  if (badge) badge.textContent = currentOrders.length ? String(currentOrders.length) : "";
}

Object.entries(tabs).forEach(([key, { btn }]) => {
  btn?.addEventListener("click", () => {
    Object.entries(tabs).forEach(([otherKey, { btn: otherBtn, panel: otherPanel }]) => {
      const active = otherKey === key;
      otherBtn.classList.toggle("admin-tab-active", active);
      otherPanel.style.display = active ? "block" : "none";
    });
  });
});

// ---------- render: tags ----------
function renderTagList() {
  const list = document.getElementById("admin-tag-list");
  if (!list) return;
  if (!currentTags.length) {
    list.innerHTML = `<div style="font-size:0.75rem;color:rgba(201,205,211,0.4);">No tags yet.</div>`;
    return;
  }
  list.innerHTML = currentTags.map((t) => `
    <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);border-radius:0.5rem;padding:0.5rem 0.75rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;">
        ${t.logo ? `<img src="${t.logo}" alt="" style="height:1.25rem;width:1.25rem;object-fit:contain;" />` : ""}
        <span style="font-size:0.8rem;color:#fff;">${t.name}</span>
      </div>
      ${tagsAreLive && t.id ? `<button data-id="${t.id}" class="admin-remove-btn" style="background:none;border:none;color:#f87171;font-size:0.75rem;">Remove</button>` : ""}
    </div>
  `).join("");
  list.querySelectorAll(".admin-remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this tag? This can't be undone.")) return;
      try {
        await deleteTagRemote(btn.dataset.id);
      } catch (err) {
        alert(err.message || "Couldn't remove that tag.");
      }
    });
  });
}

// ---------- render: pricing ----------
// ---------- render: offers ----------
function renderOfferList() {
  const list = document.getElementById("admin-offer-list");
  if (!list) return;
  if (!currentOffers.length) {
    list.innerHTML = `<div style="font-size:0.75rem;color:rgba(201,205,211,0.4);">No offers yet.</div>`;
    return;
  }
  list.innerHTML = currentOffers.map((o) => `
    <div style="display:flex;align-items:center;gap:0.6rem;background:rgba(255,255,255,0.04);border-radius:0.5rem;padding:0.6rem 0.75rem;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.8rem;color:#fff;">${o.title}</div>
        <div style="font-size:0.7rem;color:rgba(201,205,211,0.45);">${o.percent}% off · min qty ${o.minQuantity || 1}</div>
      </div>
      <button type="button" class="offer-toggle-btn ${o.active !== false ? "on" : ""}" data-id="${o.id}">${o.active !== false ? "Active" : "Off"}</button>
      <button type="button" class="admin-remove-btn" data-id="${o.id}" style="background:none;border:none;color:#f87171;font-size:0.75rem;">Remove</button>
    </div>
  `).join("");

  list.querySelectorAll(".offer-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const offer = currentOffers.find((o) => o.id === btn.dataset.id);
      try {
        await updateOffer(btn.dataset.id, { active: !(offer.active !== false) });
      } catch (err) {
        alert(err.message || "Couldn't update that offer.");
      }
    });
  });
  list.querySelectorAll(".admin-remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this offer?")) return;
      try {
        await deleteOffer(btn.dataset.id);
      } catch (err) {
        alert(err.message || "Couldn't remove that offer.");
      }
    });
  });
}

document.getElementById("admin-add-offer-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("admin-add-offer-error");
  errorEl.style.display = "none";
  const btn = document.getElementById("admin-add-offer-btn");
  btn.disabled = true;
  btn.textContent = "Adding...";
  try {
    await addOffer({
      title: document.getElementById("admin-offer-title").value,
      percent: Number(document.getElementById("admin-offer-percent").value),
      minQuantity: Number(document.getElementById("admin-offer-minqty").value) || 1,
      active: true,
    });
    document.getElementById("admin-add-offer-form").reset();
    document.getElementById("admin-offer-minqty").value = 1;
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong adding that offer.";
    errorEl.style.display = "block";
  }
  btn.disabled = false;
  btn.textContent = "Add offer";
});

function renderPricingLists() {
  const colorwayList = document.getElementById("admin-colorway-prices");
  if (colorwayList) {
    colorwayList.innerHTML = currentColorways.map((c) => `
      <div style="display:flex;align-items:center;gap:0.6rem;background:rgba(255,255,255,0.04);border-radius:0.5rem;padding:0.5rem 0.75rem;">
        <span style="flex:1;font-size:0.8rem;color:#fff;">${c.name}</span>
        <span style="font-size:0.75rem;color:rgba(201,205,211,0.4);">£</span>
        <input type="number" step="0.01" min="0" value="${c.price}" class="input price-input" data-kind="colorway" data-id="${c.id}" style="width:5.5rem;padding:0.4rem 0.6rem;" />
        <button type="button" class="price-save-btn" data-kind="colorway" data-id="${c.id}">Save</button>
      </div>
    `).join("");
  }

  const tierList = document.getElementById("admin-tier-prices");
  if (tierList) {
    tierList.innerHTML = currentTiers.map((t) => `
      <div style="display:flex;align-items:center;gap:0.6rem;background:rgba(255,255,255,0.04);border-radius:0.5rem;padding:0.5rem 0.75rem;">
        <span style="flex:1;font-size:0.8rem;color:#fff;">${t.name}</span>
        <span style="font-size:0.75rem;color:rgba(201,205,211,0.4);">£</span>
        <input type="number" step="0.01" min="0" value="${t.price}" class="input price-input" data-kind="tier" data-id="${t.id}" style="width:5.5rem;padding:0.4rem 0.6rem;" />
        <button type="button" class="price-save-btn" data-kind="tier" data-id="${t.id}">Save</button>
      </div>
    `).join("");
  }

  document.querySelectorAll(".price-save-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest("div");
      const input = row.querySelector(".price-input");
      const price = Number(input.value);
      if (!(price >= 0)) {
        alert("Enter a valid price.");
        return;
      }
      btn.disabled = true;
      btn.textContent = "...";
      try {
        if (btn.dataset.kind === "colorway") await updateColorwayPrice(btn.dataset.id, price);
        else await updateTierPrice(btn.dataset.id, price);
        btn.textContent = "Saved";
        setTimeout(() => { btn.textContent = "Save"; btn.disabled = false; }, 1200);
      } catch (err) {
        alert(err.message || "Couldn't save that price.");
        btn.textContent = "Save";
        btn.disabled = false;
      }
    });
  });
}

// ---------- render: orders ----------
function renderOrderList() {
  const list = document.getElementById("admin-order-list");
  if (!list) return;
  if (!currentOrders.length) {
    list.innerHTML = `<div style="font-size:0.75rem;color:rgba(201,205,211,0.4);">No orders yet.</div>`;
    return;
  }
  list.innerHTML = currentOrders.map((o, i) => {
    const when = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : "";
    const filenameSafe = (o.name || "order").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const current = stageIndex(o.status);
    const stageButtons = ORDER_STAGES.map((stage, si) => `
      <button type="button" class="status-stage-btn ${si === current ? "current" : ""}" data-order-id="${o.orderId || o.id}" data-stage="${stage.id}">
        ${stage.label}
      </button>
    `).join("");
    return `
      <div class="order-card" style="background:rgba(255,255,255,0.04);border-radius:0.75rem;padding:1rem;">
        <div style="display:flex;justify-content:space-between;gap:0.5rem;margin-bottom:0.6rem;">
          <span style="font-size:0.95rem;font-weight:600;color:#fff;">${o.name || "(no name)"}</span>
          <span style="font-size:0.7rem;color:rgba(201,205,211,0.4);white-space:nowrap;">${when}</span>
        </div>

        <div class="order-field"><span class="order-field-label">Order ID</span><span class="order-field-value" style="color:#E8B84B;font-weight:600;">${o.orderId || o.id}</span></div>
        <div class="order-field"><span class="order-field-label">Email</span><span class="order-field-value">${o.email || "—"}</span></div>
        <div class="order-field"><span class="order-field-label">Finish</span><span class="order-field-value">${o.finish || "—"}</span></div>
        <div class="order-field"><span class="order-field-label">Tier</span><span class="order-field-value">${o.tier || "—"}</span></div>
        <div class="order-field"><span class="order-field-label">Quantity</span><span class="order-field-value">${o.quantity || 1}</span></div>
        <div class="order-field"><span class="order-field-label">Total</span><span class="order-field-value" style="color:#E8B84B;font-weight:600;">${o.total || "—"}</span></div>
        ${o.message ? `<div class="order-field"><span class="order-field-label">Message</span><span class="order-field-value">"${o.message}"</span></div>` : ""}

        <div style="margin-top:0.75rem;">
          <span class="order-field-label" style="display:block;margin-bottom:0.4rem;">Logo / photo</span>
          ${o.logo
            ? `
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <img src="${o.logo}" alt="" class="order-photo-thumb" data-full="${o.logo}" style="cursor:zoom-in;" />
                <a href="${o.logo}" download="${filenameSafe}-logo.png" class="order-download-link">⬇ Download</a>
              </div>
            `
            : `<span style="font-size:0.75rem;color:rgba(201,205,211,0.35);">Not attached</span>`
          }
        </div>

        <div style="margin-top:0.9rem;">
          <span class="order-field-label" style="display:block;margin-bottom:0.3rem;">Status — click to update</span>
          <div class="status-stage-row">${stageButtons}</div>
        </div>

        <a href="mailto:${o.email || ""}?subject=${encodeURIComponent(`Your Nexaura Tag order ${o.orderId || o.id} — status update`)}&body=${encodeURIComponent(`Hi ${o.name || ""},\n\nQuick update on your order ${o.orderId || o.id}: it's now at "${ORDER_STAGES[current]?.label}".\n\nYou can check status anytime at the Track Order section of our site using your order ID.\n\n— Nexaura`)}"
           class="order-download-link" style="display:inline-block;margin-top:0.75rem;text-decoration:none;">
          ✉ Email customer manually (backup)
        </a>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".order-photo-thumb").forEach((img) => {
    img.addEventListener("click", () => {
      document.getElementById("order-photo-lightbox-img").src = img.dataset.full;
      document.getElementById("order-photo-lightbox").classList.add("open");
    });
  });

  list.querySelectorAll(".status-stage-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const orderId = btn.dataset.orderId;
      const stageId = btn.dataset.stage;
      const order = currentOrders.find((o) => (o.orderId || o.id) === orderId);
      const stage = ORDER_STAGES.find((s) => s.id === stageId);
      try {
        await updateOrderStatus(orderId, stageId);
      } catch (err) {
        alert(err.message || "Couldn't update status.");
        return;
      }
      if (order?.email && isEmailJsConfigured()) {
        const trackingLink = `${window.location.origin}${window.location.pathname}#track-order`;
        const result = await sendOrderStatusEmail({
          toEmail: order.email,
          customerName: order.name,
          orderId,
          statusLabel: stage?.label,
          statusNote: stage?.customerNote,
          finish: order.finish,
          tier: order.tier,
          quantity: order.quantity,
          total: order.total,
          trackingLink,
        });
        if (!result.sent) console.warn("Auto-email to customer didn't go out:", result.reason);
      }
    });
  });
}

// ---------- add-tag logo upload ----------
const dropzone = document.getElementById("admin-dropzone");
const fileInput = document.getElementById("admin-logo-input");
let pendingLogoDataUrl = "";

dropzone?.addEventListener("click", () => fileInput.click());
fileInput?.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert("Please pick an image under 5MB.");
    fileInput.value = "";
    return;
  }
  try {
    pendingLogoDataUrl = await compressImageToDataUrl(file);
    dropzone.querySelector(".dz-preview").innerHTML = `<img src="${pendingLogoDataUrl}" alt="" />`;
    dropzone.querySelector(".hint").textContent = file.name;
  } catch (err) {
    alert(err.message || "Couldn't read that image.");
  }
});

document.getElementById("admin-add-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("admin-add-error");
  errorEl.style.display = "none";
  const btn = document.getElementById("admin-add-btn");
  btn.disabled = true;
  btn.textContent = "Adding...";
  try {
    await addTagRemote({
      name: document.getElementById("admin-name").value,
      tagline: document.getElementById("admin-tagline").value,
      description: document.getElementById("admin-description").value,
      url: document.getElementById("admin-url").value || "#",
      accent: document.getElementById("admin-accent").value || "#E8B84B",
      baseColor: document.getElementById("admin-basecolor").value || "#16181b",
      metalness: 0.85,
      roughness: 0.3,
      logo: pendingLogoDataUrl || null,
    });
    document.getElementById("admin-add-form").reset();
    dropzone.querySelector(".dz-preview").innerHTML = `<div class="placeholder">📎</div>`;
    dropzone.querySelector(".hint").textContent = "Click to attach a logo (optional)";
    pendingLogoDataUrl = "";
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong adding the tag.";
    errorEl.style.display = "block";
  }
  btn.disabled = false;
  btn.textContent = "Add tag";
});
