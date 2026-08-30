// ============================================================
// All editable site content lives here. To add/change a tag,
// colorway, price, or client, just edit the arrays below and
// re-upload this one file — no build step, nothing else to touch.
// ============================================================

const TAGS = [
  {
    id: "japp-financial",
    name: "JAPP Financial",
    tagline: "Future-Driven Financial Intelligence",
    description: "A digital business card for a financial services client — instant call, email, website and WhatsApp contact.",
    accent: "#22D3EE",
    baseColor: "#0a1a2e",
    metalness: 0.85,
    roughness: 0.3,
    url: "https://jappfinancial.github.io/Jass_tag/",
    logo: "logos/japp-financial.png",
  },
  {
    id: "nexaura-consultant",
    name: "Nexaura Consultant",
    tagline: "Build Smarter. Scale Faster.",
    description: "Our own digital business card — AI consultancy, automation, custom software and cloud solutions.",
    accent: "#8B5CF6",
    baseColor: "#120a24",
    metalness: 0.85,
    roughness: 0.3,
    url: "https://nexauraconsultant.github.io/tag_nexaura/",
    logo: "logos/nexaura-consultant.jpg",
  },
  {
    id: "esh-driving-school",
    name: "ESH Driving School",
    tagline: "Drive With Confidence. Pass With Skill.",
    description: "Real driving-lesson video background, DVSA-style branding, one-tap call, WhatsApp, directions and Facebook follow.",
    accent: "#FFC107",
    baseColor: "#1a1206",
    metalness: 0.8,
    roughness: 0.35,
    url: "#",
  },
];

// Card materials — 2 groups (Plastic / Metal), each with 3 color/finish
// variants. Each variant's own `price` is what's charged (not an add-on) —
// admin can edit any of these 6 prices from the ⚙ Pricing tab.
const COLORWAYS = [
  { id: "onyx", name: "Onyx", material: "plastic", tagline: "The original.", description: "Lightweight matte black plastic with a single cyan seam — the affordable starting point.", price: 21.00, accent: "#22D3EE", gradient: ["#1c1e22", "#0a0a0c"], sheen: "#3a3d42", photo: null },
  { id: "jet-black", name: "Jet Black", material: "plastic", tagline: "Deeper, darker, sharper.", description: "A richer black plastic finish with a cool white edge-light — a bolder step up from Onyx.", price: 23.99, accent: "#E8ECF1", gradient: ["#0d0e10", "#000000"], sheen: "#2a2c30", photo: null },
  { id: "imported-pattern", name: "Imported Pattern", material: "plastic", tagline: "A textured statement.", description: "An imported textured pattern finish on the same durable plastic build — for a card that stands out on sight.", price: 25.99, accent: "#E8B84B", gradient: ["#2a1f3d", "#160f24"], sheen: "#6d5a9e", photo: null },

  { id: "metal-black", name: "Metal Black", material: "metal", tagline: "Solid. Weighty. Serious.", description: "Solid anodized black metal — heavier and more durable than any plastic finish, with a bright silver seam.", price: 25.00, accent: "#E8ECF1", gradient: ["#1a1a1c", "#050506"], sheen: "#3d3d40", photo: null },
  { id: "black-gold", name: "Black & Gold Plated", material: "metal", tagline: "Understated luxury.", description: "Solid black metal with a gold-plated edge and seam — the same durable build, dressed up.", price: 29.99, accent: "#E8B84B", gradient: ["#1a1a1c", "#050506"], sheen: "#E8B84B", photo: null },
  { id: "premium-glossy", name: "Premium Glossy", material: "metal", tagline: "Full reflection.", description: "A mirror-polished, high-gloss metal finish that catches the light from every angle — the top-tier option.", price: 33.99, accent: "#E8ECF1", gradient: ["#f2f4f6", "#8a9099"], sheen: "#ffffff", photo: null },
];

const TIERS = [
  { id: "basic", name: "Basic", price: 9.99, tagline: "Just the essentials.", features: ["Phone number", "Email address", "Office address", "One social media link"] },
  { id: "standard", name: "Standard", price: 19.99, tagline: "Everything in Basic, plus:", features: ["Two social media links", "Google reviews link"] },
  { id: "premium", name: "Premium", price: 29.99, tagline: "Everything in Standard, plus:", features: ["Website link", "Dynamic / animated background"], highlight: true },
  { id: "custom", name: "Custom", price: 49.99, tagline: "Fully custom — everything, your way:", features: ["Background video of your business", "All your social media links", "Phone number, email & address", "Google reviews link", "Save-contact prompt", "Follow-on-social prompts", "Fully custom card design, printed to your choice"] },
];

const LIVE_EVENTS = [
  { icon: "📡", text: "Someone in Dubai just scanned a Tag" },
  { icon: "📦", text: "New order — 12 units to London" },
  { icon: "📡", text: "Someone in Singapore just scanned a Tag" },
  { icon: "🔗", text: "A Tag was linked in New York" },
  { icon: "📦", text: "New order — 4 units to Toronto" },
  { icon: "📡", text: "Someone in Berlin just scanned a Tag" },
  { icon: "🌍", text: "Nexaura Tags are now active in 14 cities" },
  { icon: "📦", text: "New order — 30 units to Sydney" },
];

const fmtGbp = (n) => `£${n.toFixed(2)}`;

// exposed as globals so app.js (a module) can read them without a bundler
// Order tracking stages, in order. Admin moves an order through these one
// step at a time; the customer sees the same list (with the current one
// highlighted) when they look up their order by ID.
const ORDER_STAGES = [
  { id: "received", label: "Order Received", customerNote: "We've got your order and are getting it ready." },
  { id: "payment_confirmed", label: "Payment Confirmed", customerNote: "Your payment is confirmed." },
  { id: "in_production", label: "Card in Production", customerNote: "Your tag is being made." },
  { id: "quality_check", label: "Quality Check", customerNote: "Your tag is going through a final check." },
  { id: "shipped", label: "Shipped", customerNote: "Your tag is on its way." },
  { id: "delivered", label: "Delivered", customerNote: "Your tag has been delivered." },
];

window.TAGS = TAGS;
window.COLORWAYS = COLORWAYS;
window.TIERS = TIERS;
window.LIVE_EVENTS = LIVE_EVENTS;
window.ORDER_STAGES = ORDER_STAGES;
window.fmtGbp = fmtGbp;
