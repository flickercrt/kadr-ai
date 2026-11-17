import { offer } from "@/config/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Full-screen Arabic maintenance document. The message is escaped. */
export function maintenanceHtml(message: string) {
  const trimmed = message.trim().slice(0, 400);
  const lead = trimmed
    ? escapeHtml(trimmed).replace(/\n/g, "<br>")
    : "نعود قريباً. يمكنك مراسلتنا على واتساب إلى أن تكتمل الصيانة.";
  const href = `https://wa.me/${offer.whatsapp}`;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>الموقع قيد الصيانة · كادر AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&amp;display=swap">
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px 20px;
      background: #0E1116;
      color: #F5F7FA;
      font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif;
    }
    main {
      width: min(560px, 100%);
      text-align: center;
    }
    .mark {
      width: 54px;
      height: 42px;
      margin: 0 auto;
    }
    .kicker {
      margin: 22px 0 0;
      color: #FF6B4A;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    h1 {
      margin: 10px 0 0;
      font-size: clamp(32px, 6vw, 48px);
      line-height: 1.25;
      font-weight: 700;
    }
    .lead {
      margin: 16px auto 0;
      max-width: 42ch;
      color: #8B949E;
      font-size: 18px;
      line-height: 1.8;
    }
    a.wa {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 28px;
      padding: 12px 18px;
      border-radius: 12px;
      background: #00D4B4;
      color: #0E1116;
      font-weight: 700;
      text-decoration: none;
    }
    a.wa span { direction: ltr; unicode-bidi: isolate; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <svg class="mark" viewBox="0 0 64 48" aria-hidden="true">
      <rect x="2" y="2" width="60" height="44" rx="6" fill="none" stroke="#00D4B4" stroke-width="3"/>
      <path d="M2 16h12M50 16h12M2 32h12M50 32h12" stroke="#FF6B4A" stroke-width="3"/>
    </svg>
    <p class="kicker">كادر AI</p>
    <h1>الموقع قيد الصيانة</h1>
    <p class="lead">${lead}</p>
    <a class="wa" href="${href}">واتساب <span>${offer.whatsappDisplay}</span></a>
  </main>
</body>
</html>`;
}
