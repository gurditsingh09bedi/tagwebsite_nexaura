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
  { id: "onyx", name: "Onyx", material: "plastic", tagline: "The original.", description: "Lightweight matte black plastic with a single cyan seam — the affordable starting point.", price: 21.00, accent: "#22D3EE", gradient: ["#1c1e22", "#0a0a0c"], sheen: "#3a3d42", photo: "https://d8j0ntlcm91z4.cloudfront.net/user_3IeTxclyM519NpjOSRitBmE65fY/hf_20260830_212555_10aafd00-370e-4f8a-a7ff-85d9bd913318.png" },
  { id: "pearl-white", name: "Pearl White", material: "plastic", tagline: "Clean, bright, unmistakable.", description: "A bright pearl-white plastic finish with a cool silver edge-light — the lightest, most eye-catching plastic option.", price: 23.99, accent: "#8a8d92", gradient: ["#e8e8ec", "#b8bac2"], sheen: "#ffffff", photo: "https://d8j0ntlcm91z4.cloudfront.net/user_3IeTxclyM519NpjOSRitBmE65fY/hf_20260830_213452_d3f37beb-89ef-4560-a92e-3e2b8dc59f7a.png" },
  { id: "imported-pattern", name: "Imported Pattern", material: "plastic", tagline: "A textured statement.", description: "An imported textured pattern finish on the same durable plastic build — for a card that stands out on sight.", price: 25.99, accent: "#E8B84B", gradient: ["#2a1f3d", "#160f24"], sheen: "#6d5a9e", photo: "https://d8j0ntlcm91z4.cloudfront.net/user_3IeTxclyM519NpjOSRitBmE65fY/hf_20260830_212528_ae7b1353-1fba-4118-809c-420d90ed2dea.png" },

  { id: "metal-black", name: "Metal Black", material: "metal", tagline: "Solid. Weighty. Serious.", description: "Solid anodized black metal — heavier and more durable than any plastic finish, with a bright silver seam.", price: 25.00, accent: "#E8ECF1", gradient: ["#1a1a1c", "#050506"], sheen: "#3d3d40", photo: "https://d8j0ntlcm91z4.cloudfront.net/user_3IeTxclyM519NpjOSRitBmE65fY/hf_20260830_212528_f982d5f7-bfbd-4c7f-8744-617a8d642490.png" },
  { id: "chrome-silver", name: "Chrome Silver", material: "metal", tagline: "Full reflection.", description: "A mirror-polished chrome metal finish that catches the light from every angle — the same durable build, in silver.", price: 29.99, accent: "#E8ECF1", gradient: ["#f2f4f6", "#8a9099"], sheen: "#ffffff", photo: "https://d8j0ntlcm91z4.cloudfront.net/user_3IeTxclyM519NpjOSRitBmE65fY/hf_20260830_212528_c2c8a2ac-1bb2-4335-a7a5-4d2f478e7e8e.png" },
  { id: "gold-plated-premium", name: "Gold Plated Premium", material: "metal", tagline: "Understated luxury.", description: "Solid gold-plated metal with a warm, brushed shine — the top-tier option, made to be noticed.", price: 33.99, accent: "#F5D57A", gradient: ["#D4AF37", "#8B6914"], sheen: "#F5D57A", photo: "https://d8j0ntlcm91z4.cloudfront.net/user_3IeTxclyM519NpjOSRitBmE65fY/hf_20260830_213422_623aabfd-ee9c-47a6-a577-547d99e568c6.png" },
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
