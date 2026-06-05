// Generates a branded, printable one-page "Install Cornerstone" guide (PDF) with a
// scannable QR code. Run: node scripts/generate-install-guide.mjs
import QRCode from "qrcode";
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const URL = "https://cornerstone-v2-fresh.vercel.app";
const OUT = process.argv[2] || "/Users/darrenlaville/cornerstone-v2/Cornerstone-Install-Guide.pdf";

const qr = await QRCode.toDataURL(URL, { margin: 1, width: 360, color: { dark: "#0f1e36", light: "#ffffff" } });

const ICON = `<svg width="56" height="56" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#16a899"/><stop offset="1" stop-color="#0b6f66"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <text x="256" y="372" font-family="Helvetica,Arial,sans-serif" font-size="340" font-weight="700" fill="#fff" text-anchor="middle">C</text>
  <circle cx="372" cy="168" r="30" fill="#eaba3f"/></svg>`;

function steps(items) {
  return items.map((t, i) => `<li><span class="n">${i + 1}</span><span>${t}</span></li>`).join("");
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #0f1e36; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; padding: 16mm 15mm; }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #119488; padding-bottom: 16px; }
  .head h1 { font-size: 26px; letter-spacing: -.02em; }
  .head p { font-size: 13px; color: #56627a; margin-top: 2px; }
  .hero { display: flex; gap: 22px; align-items: center; background: #f1faf7; border: 1px solid #d8efe7; border-radius: 16px; padding: 18px 22px; margin: 20px 0 8px; }
  .hero .l { flex: 1; }
  .hero .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #0b6f66; }
  .hero .url { font-size: 21px; font-weight: 700; color: #0f1e36; margin: 6px 0 8px; word-break: break-all; }
  .hero .sub { font-size: 12.5px; color: #56627a; line-height: 1.5; }
  .hero .qr { text-align: center; }
  .hero .qr img { width: 124px; height: 124px; border: 1px solid #e6e9ef; border-radius: 12px; padding: 6px; background: #fff; }
  .hero .qr div { font-size: 10.5px; color: #8a93a6; margin-top: 5px; font-weight: 600; }
  .cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-top: 18px; }
  .card { border: 1px solid #e6e9ef; border-radius: 14px; padding: 16px 16px 14px; }
  .card h2 { font-size: 14px; display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
  .card .tag { font-size: 10px; color: #8a93a6; margin-bottom: 12px; }
  ol { list-style: none; }
  li { display: flex; gap: 9px; align-items: flex-start; font-size: 12px; line-height: 1.45; color: #313a4d; margin-bottom: 9px; }
  .n { flex: none; width: 19px; height: 19px; border-radius: 50%; background: #119488; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
  .note { margin-top: 18px; background: #0f1e36; color: #fff; border-radius: 14px; padding: 16px 20px; }
  .note h3 { font-size: 13px; margin-bottom: 8px; }
  .note ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 7px 22px; }
  .note li { color: #c6cedd; font-size: 11.5px; }
  .note b { color: #fff; }
  .foot { margin-top: 16px; text-align: center; font-size: 10.5px; color: #8a93a6; }
  .warn { color: #d9685c; }
</style></head><body><div class="page">
  <div class="head">${ICON}<div><h1>Install Cornerstone</h1><p>Care OS for Children's Homes — add it to your phone, tablet or computer in under a minute.</p></div></div>

  <div class="hero">
    <div class="l">
      <div class="label">Open this address in your browser</div>
      <div class="url">cornerstone-v2-fresh.vercel.app</div>
      <div class="sub">There's no App Store download — Cornerstone installs straight from the web, then gets its own icon and opens full-screen like a normal app.</div>
    </div>
    <div class="qr"><img src="${qr}"/><div>Scan to open</div></div>
  </div>

  <div class="cols">
    <div class="card"><h2>📱 iPhone / iPad</h2><div class="tag">Use <b>Safari</b> (not Chrome)</div><ol>${steps([
      "Open <b>Safari</b> and go to the address above",
      "Tap the <b>Share</b> button (square with an up-arrow)",
      "Tap <b>Add to Home Screen</b>",
      "Tap <b>Add</b> — the Cornerstone icon appears",
    ])}</ol></div>
    <div class="card"><h2>🤖 Android</h2><div class="tag">Use <b>Chrome</b></div><ol>${steps([
      "Open <b>Chrome</b> and go to the address above",
      "Tap the <b>Install app</b> prompt, or the <b>⋮ menu</b>",
      "Choose <b>Install app</b> / Add to Home screen",
      "Confirm <b>Install</b> — it's added to your apps",
    ])}</ol></div>
    <div class="card"><h2>💻 Computer</h2><div class="tag">Chrome or Edge</div><ol>${steps([
      "Open <b>Chrome/Edge</b> and go to the address above",
      "Click the <b>install icon</b> in the address bar",
      "Or <b>⋮ menu → Install Cornerstone…</b>",
      "It opens in its own window",
    ])}</ol></div>
  </div>

  <div class="note"><h3>Good to know</h3><ul>
    <li>✅ <b>Free</b> — no account or app store needed</li>
    <li>🔄 <b>Auto-updates</b> — always the latest version</li>
    <li>📶 <b>Works on weak signal</b> — the app still opens offline</li>
    <li><span class="warn">🔒 Safety:</span> live care data won't show offline by design</li>
  </ul></div>

  <div class="foot">Cornerstone — Oak House. If a step looks different, your browser may have moved a menu; the option is always called <b>Install</b> or <b>Add to Home Screen</b>.</div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
await browser.close();
writeFileSync(OUT, pdf);
console.log("wrote", OUT, pdf.length, "bytes");
