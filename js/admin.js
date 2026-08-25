import { subscribeTags, addTagRemote, deleteTagRemote, signInAdmin, signOutAdmin, onAuthChange } from "./tags-store.js";
import { isFirebaseConfigured } from "./firebase-config.js";

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

let currentTags = [];
let tagsAreLive = false;
subscribeTags((tags, isLive) => {
  currentTags = tags;
  tagsAreLive = isLive;
  renderTagList();
});

if (!isFirebaseConfigured()) {
  showPanel(noBackendEl);
} else {
  onAuthChange((user) => {
    if (user) {
      showPanel(dashboardEl);
      const who = document.getElementById("admin-signed-in-as");
      if (who) who.textContent = user.email;
      renderTagList();
    } else {
      showPanel(loginEl);
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

// logo upload -> resized/compressed data URL, same approach as the order form
const dropzone = document.getElementById("admin-dropzone");
const fileInput = document.getElementById("admin-logo-input");
let pendingLogoDataUrl = "";

dropzone?.addEventListener("click", () => fileInput.click());
fileInput?.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert("Please pick an image under 5MB.");
    fileInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 480;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      pendingLogoDataUrl = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85);
      dropzone.querySelector(".dz-preview").innerHTML = `<img src="${pendingLogoDataUrl}" alt="" />`;
      dropzone.querySelector(".hint").textContent = file.name;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
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
