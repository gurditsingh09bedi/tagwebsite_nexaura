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

const CLIENTS = [
  {
    id: "japp-financial",
    name: "JAPP Financial",
    category: "Financial Services",
    description: "Future-Driven Financial Intelligence — a digital business card with instant call, email, website and WhatsApp contact.",
    url: "https://jappfinancial.github.io/Jass_tag/",
    logo: "logos/japp-financial.png",
    accent: "#0a1a2e",
  },
  {
    id: "nexaura-consultant",
    name: "Nexaura Consultant Ltd",
    category: "AI Consultancy",
    description: "Our own digital business card — AI consultancy, automation, custom software and cloud solutions, with a live neural-network background.",
    url: "https://nexauraconsultant.github.io/tag_nexaura/",
    logo: "logos/nexaura-consultant.jpg",
    accent: "#120a24",
  },
  {
    id: "esh-driving-school",
    name: "ESH Driving School",
    category: "Driving School",
    description: "Real driving-lesson video background, DVSA-style branding, and one-tap call, WhatsApp, directions and Facebook follow.",
    url: "#",
    photo: "client-thumbs/esh-thumb.jpg",
  },
];

const COLORWAYS = [
  { id: "onyx", name: "Onyx", tagline: "The original.", description: "Brushed matte black finish with a single cyan seam. Tap-to-share your world in under a second.", price: 11.99, accent: "#22D3EE", gradient: ["#1c1e22", "#0a0a0c"], sheen: "#3a3d42" },
  { id: "graphite", name: "Graphite", tagline: "Understated power.", description: "Deep charcoal composite with a hairline cyan edge-light. Quiet until it isn't.", price: 15.99, accent: "#38BDF8", gradient: ["#3a3d42", "#121316"], sheen: "#565a61" },
  { id: "platinum", name: "Platinum", tagline: "Polished for presence.", description: "Mirror-polished silver body. Built for founders, creators, and anyone who walks into a room first.", price: 19.99, accent: "#E8ECF1", gradient: ["#d7dbe0", "#7d828a"], sheen: "#ffffff" },
  { id: "cobalt", name: "Cobalt", tagline: "Deep blue, bold move.", description: "Rich cobalt-blue anodized finish with a bright white seam. For the ones who don't blend in.", price: 23.99, accent: "#ffffff", gradient: ["#1e3a8a", "#0b1230"], sheen: "#5b7cf0" },
  { id: "chrome", name: "Chrome", tagline: "Full reflection.", description: "A near-chrome shell that mirrors everything around it. The most photographed tag in the lineup.", price: 29.99, accent: "#E8ECF1", gradient: ["#f2f4f6", "#8a9099"], sheen: "#ffffff" },
  { id: "rose-gold", name: "Rose Gold", tagline: "Warm metal, sharp edges.", description: "Brushed rose-gold composite with a soft amber glow. Understated luxury, made to be noticed.", price: 35.99, accent: "#F5A987", gradient: ["#c07a5e", "#3a1c14"], sheen: "#f0b79b" },
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

const fmtUsd = (n) => `$${n.toFixed(2)}`;

// exposed as globals so app.js (a module) can read them without a bundler
window.TAGS = TAGS;
window.CLIENTS = CLIENTS;
window.COLORWAYS = COLORWAYS;
window.TIERS = TIERS;
window.LIVE_EVENTS = LIVE_EVENTS;
window.fmtUsd = fmtUsd;
