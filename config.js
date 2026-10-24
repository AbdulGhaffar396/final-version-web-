/* ===== EuroWork Hub — edit this file only ===== */
window.SITE_CONFIG = {
  brand: "EuroWork Hub",
  email: "",            // e.g. "info@yourdomain.com"
  phoneDisplay: "",     // e.g. "+381 00 000 0000"
  // Social / messaging links — paste full URLs later. Empty = button hidden or goes to Contact page.
  social: {
    whatsapp: "",   // e.g. "https://wa.me/381600000000"
    telegram: "",   // e.g. "https://t.me/yourusername"
    viber:    "",   // e.g. "viber://chat?number=%2B381600000000"
    messenger:"",   // e.g. "https://m.me/yourpagename"
    facebook: "",
    instagram: ""
  },
  // Home page slider. type: "image" or "video". Replace src with your own photos/videos
  // (put files in /public/images or /public/videos). Videos: mp4, muted, looped automatically.
  // Side contact widget (the floating tab on the right edge)
  widget: { title: "Chat with us", subtitle: "We usually reply within a few hours.", openOnLoadDelay: 0 },
  slides: [
    { type: "image", src: "images/team.webp", align: "bottom", title: "Find Job Opportunities Across Europe", text: "We connect international job seekers with employment in selected European countries.", cta: ["View Countries", "#/countries"] },
    { type: "image", src: "images/construction.webp", align: "left", title: "Construction & Skilled Trades", text: "Explore currently available positions for builders, electricians, welders and more.", cta: ["See Job Categories", "#/countries"] },
    { type: "image", src: "images/hospitality.webp", align: "left", title: "Hospitality & Tourism Careers", text: "Hotels, restaurants and resorts regularly look for reliable staff.", cta: ["Contact Us", "#/contact"] },
    { type: "image", src: "images/logistics.webp", align: "right", title: "Warehouse, Logistics & Drivers", text: "Roles in warehousing, manufacturing and transport across the region.", cta: ["Ask About Openings", "#/contact"] },
    { type: "image", src: "images/visa.webp", align: "bottom", title: "Work Permit & Visa Guidance", text: "Understand the next steps. Visa approval is not guaranteed.", cta: ["Request Visa Assistance", "#/visa"] }
    // Video example:
    // { type: "video", src: "videos/intro.mp4", poster: "images/team.webp", title: "...", text: "...", cta: ["...", "#/contact"] }
  ]
};
