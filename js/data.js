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

const COLORWAYS = [
  { id: "onyx", name: "Onyx", tagline: "The original.", description: "Lightweight matte black plastic with a single cyan seam — the affordable starting point. Tap-to-share your world in under a second.", price: 11.99, accent: "#22D3EE", gradient: ["#1c1e22", "#0a0a0c"], sheen: "#3a3d42", material: "plastic" },
  { id: "graphite", name: "Graphite", tagline: "Understated power.", description: "Lightweight charcoal plastic, same durable build as Onyx, with a hairline cyan edge-light and a more understated tone.", price: 15.99, accent: "#38BDF8", gradient: ["#3a3d42", "#121316"], sheen: "#565a61", material: "plastic" },
  { id: "platinum", name: "Platinum", tagline: "Polished for presence.", description: "Light silver-grey plastic — the brightest of the three plastic finishes, for founders and creators who want to stand out without going full metal.", price: 19.99, accent: "#E8ECF1", gradient: ["#d7dbe0", "#7d828a"], sheen: "#ffffff", material: "plastic" },
  { id: "cobalt", name: "Cobalt", tagline: "Deep blue, bold move.", description: "Solid anodized metal — heavier and more durable than the plastic finishes, in a rich cobalt-blue coat with a bright white seam.", price: 23.99, accent: "#ffffff", gradient: ["#1e3a8a", "#0b1230"], sheen: "#5b7cf0", material: "metal" },
  { id: "chrome", name: "Chrome", tagline: "Full reflection.", description: "Solid mirror-polished metal, same durable build as Cobalt — the most reflective, most photographed finish in the lineup.", price: 29.99, accent: "#E8ECF1", gradient: ["#f2f4f6", "#8a9099"], sheen: "#ffffff", material: "metal" },
  { id: "rose-gold", name: "Rose Gold", tagline: "Warm metal, sharp edges.", description: "Solid brushed metal in a warm rose-gold finish — the premium top-tier option, full metal build with the most refined look.", price: 35.99, accent: "#F5A987", gradient: ["#c07a5e", "#3a1c14"], sheen: "#f0b79b", material: "metal" },
];

const TIERS = [
  { id: "basic", name: "Basic", price: 9.99, tagline: "Just the essentials.", features: ["Phone number", "Email address", "Physical address"] },
  { id: "standard", name: "Standard", price: 19.99, tagline: "Everything in Basic, plus:", features: ["3 extra contact buttons", "Instagram link", "Facebook link"] },
  { id: "premium", name: "Premium", price: 29.99, tagline: "Everything in Standard, plus:", features: ["Website link", "Dynamic / animated background"], highlight: true },
  { id: "custom", name: "Custom", price: 49.99, tagline: "Everything in Premium, plus:", features: ["Your own logo", "Fully custom card design"] },
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
