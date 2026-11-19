/**
 * Website enquiries → Google Form "Aslot Wealth – Website Enquiries"
 * → its linked Google Sheet (Timestamp | Name | Message).
 *
 * Works on static hosting (GitHub Pages): the browser posts straight to
 * Google, no server or API key. To find these IDs again: open the form,
 * ⋮ → "Get pre-filled link" → fill every field → "Get link"; the link holds
 * /d/e/<FORM_ID>/ and one entry.<number> per question.
 *
 * If you add a question to the form, add its entry ID here and send it from
 * ContactSection. Never add a *required* question the website doesn't send —
 * Google would then reject every submission silently.
 */
const FORM_ID = '1FAIpQLSdekg0pWnlu6UpUXxCpWxnpxEUxykLE3oUPRnte3YcOuRhv8Q';

const FIELDS = {
  name: 'entry.1932756725',
  message: 'entry.749178521',
} as const;

const ACTION = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

export type Enquiry = Record<keyof typeof FIELDS, string>;

/**
 * Fire-and-forget: does not wait, so the caller can open WhatsApp in the same
 * click (popup blockers only allow window.open during the click itself).
 * `keepalive` lets the request finish even if the visitor leaves the page.
 * Google sends no readable reply to other sites ("no-cors"), so success
 * can't be confirmed here — check the Sheet.
 */
export function saveEnquiry(data: Enquiry): void {
  const body = new URLSearchParams();
  for (const key of Object.keys(FIELDS) as (keyof Enquiry)[]) {
    body.append(FIELDS[key], data[key].trim());
  }
  fetch(ACTION, { method: 'POST', mode: 'no-cors', body, keepalive: true }).catch(() => {
    // Offline or blocked: WhatsApp still opens, so the enquiry isn't lost.
  });
}
