// ============================================================
// OPTIONAL — lets the site email the CUSTOMER automatically whenever their
// order's status changes (Formspree only notifies the business owner, not
// the customer, so this is a separate, free service for that specific job).
//
// 5-minute one-time setup:
//   1. Go to https://www.emailjs.com -> sign up free.
//   2. "Email Services" -> "Add New Service" -> connect the
//      nexauraconsultant@gmail.com Gmail account. Copy the Service ID.
//   3. "Email Templates" -> "Create New Template". Use these variables in
//      the template body: {{to_email}}, {{customer_name}}, {{order_id}},
//      {{status_label}}, {{status_note}}. Example body:
//        "Hi {{customer_name}}, your order {{order_id}} is now:
//         {{status_label}} — {{status_note}}"
//      Set the template's "To email" field to {{to_email}}. Copy the
//      Template ID.
//   4. Account -> "General" -> copy your Public Key.
//   5. Paste all three below, replacing the placeholders.
//   6. Re-upload this one file. Done.
//
// Free plan covers 200 emails/month — plenty for order-status updates.
// Until this is set up, status changes still save fine in the Orders
// panel, the customer just won't get an email about it.
// ============================================================

const EMAILJS_PUBLIC_KEY = "PASTE_YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "PASTE_YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "PASTE_YOUR_EMAILJS_TEMPLATE_ID";

export function isEmailJsConfigured() {
  return (
    EMAILJS_PUBLIC_KEY !== "PASTE_YOUR_EMAILJS_PUBLIC_KEY" &&
    EMAILJS_SERVICE_ID !== "PASTE_YOUR_EMAILJS_SERVICE_ID" &&
    EMAILJS_TEMPLATE_ID !== "PASTE_YOUR_EMAILJS_TEMPLATE_ID"
  );
}

let initialized = false;
function ensureInit() {
  if (initialized || !window.emailjs) return;
  window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  initialized = true;
}

// Best-effort — never throws. Returns { sent: boolean, reason?: string }
// so the caller (admin.js) can show a small "email not configured" hint
// without the status update itself ever failing because of this.
export async function notifyCustomerStatusUpdate({ toEmail, customerName, orderId, statusLabel, statusNote }) {
  if (!isEmailJsConfigured()) return { sent: false, reason: "not_configured" };
  if (!window.emailjs) return { sent: false, reason: "sdk_not_loaded" };
  ensureInit();
  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: toEmail,
      customer_name: customerName || "there",
      order_id: orderId,
      status_label: statusLabel,
      status_note: statusNote,
    });
    return { sent: true };
  } catch (err) {
    console.error("EmailJS send failed:", err);
    return { sent: false, reason: "send_failed" };
  }
}
