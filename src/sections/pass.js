import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import { getInvitationCode, getInvitationState, onInvitationChange } from "../utils/invitation.js";
import { refreshScrollTriggers } from "../animations/scrollReveal.js";

// "Your entrance pass": shown only when the guest opened their own personal
// link and the code was confirmed. The QR is exactly the personal link the
// dashboard's QR codes and printed passes encode (same single identifier),
// so staff can scan this, a screenshot of it, or any pass the couple sent.
//
// The QR library is loaded only here, only for a valid code, so the
// invitation itself doesn't get any heavier for everyone else.

function personalLink(code) {
  return `${config.meta.siteUrl.replace(/\/+$/, "")}/?i=${code}`;
}

function spaced(code) {
  return `${code.slice(0, 4)} ${code.slice(4)}`;
}

let qrModule = null;
async function qrDataUrl(text, width) {
  qrModule = qrModule || (await import("qrcode")).default;
  return qrModule.toDataURL(text, { width, margin: 1, errorCorrectionLevel: "M" });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// A phone-shaped PNG of the pass, for guests who'd rather save an image
// than take a screenshot.
async function savePassImage({ code, name, admits }) {
  const W = 1080;
  const H = 1600;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = config.theme.background;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = config.theme.primaryDeep;
  ctx.font = "600 44px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(t().pass.title.toUpperCase(), W / 2, 120);
  ctx.fillStyle = config.theme.text;
  ctx.font = "88px Parisienne, cursive";
  ctx.fillText(`${config.couple.partner1} & ${config.couple.partner2}`, W / 2, 240);
  const qr = await loadImage(await qrDataUrl(personalLink(code), 760));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(130, 320, 820, 820);
  ctx.drawImage(qr, 160, 350, 760, 760);
  ctx.fillStyle = config.theme.text;
  ctx.font = "48px monospace";
  ctx.fillText(spaced(code), W / 2, 1220);
  ctx.font = `600 ${name.length > 28 ? 52 : 64}px 'Cormorant Garamond', Georgia, serif`;
  ctx.fillText(name, W / 2, 1340, W - 120);
  ctx.font = "44px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(admits, W / 2, 1420);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("render");
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: "wedding-pass.png" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function createPassSection() {
  const title = el("h2", { class: "section-title-serif" });
  const intro = el("p", { class: "pass-intro" });
  const qrImg = el("img", { class: "pass-qr", alt: "", width: "260", height: "260" });
  const codeLabel = el("p", { class: "pass-code-label" });
  const codeEl = el("p", { class: "pass-code notranslate", translate: "no" });
  const nameEl = el("p", { class: "pass-name notranslate", translate: "no" });
  const admitsEl = el("p", { class: "pass-admits" });
  const card = el("div", { class: "pass-card" }, [qrImg, codeLabel, codeEl, nameEl, admitsEl]);
  const steps = el("ol", { class: "pass-steps" });
  const saveBtn = el("button", { type: "button", class: "btn btn-outline pass-save" });
  const savedNote = el("p", { class: "pass-saved", role: "status" });
  const node = el("section", { class: "section pass-section", id: "pass" }, [title, intro, card, steps, saveBtn, savedNote]);
  node.hidden = true;

  let renderedFor = null;

  function current() {
    const state = getInvitationState();
    const code = getInvitationCode();
    if (state.status !== "found" || !code) return null;
    const max = Math.max(state.invitation.authorizedGuests ?? 1, 1);
    return { code, name: state.invitation.displayName, max };
  }

  function render() {
    const info = current();
    node.hidden = !info;
    if (!info) return;
    const s = t().pass;
    title.textContent = s.title;
    intro.textContent = s.intro;
    codeLabel.textContent = s.codeLabel;
    codeEl.textContent = spaced(info.code);
    nameEl.textContent = info.name;
    admitsEl.textContent = s.admits(info.max);
    steps.replaceChildren(...s.steps.map((line) => el("li", {}, line)));
    saveBtn.textContent = s.save;
    if (savedNote.textContent) savedNote.textContent = s.saved;
    qrImg.alt = s.title;
    if (renderedFor !== info.code) {
      renderedFor = info.code;
      qrDataUrl(personalLink(info.code), 520)
        .then((url) => {
          qrImg.src = url;
          refreshScrollTriggers();
        })
        .catch(() => {});
    }
  }

  saveBtn.addEventListener("click", async () => {
    const info = current();
    if (!info) return;
    saveBtn.disabled = true;
    try {
      await savePassImage({ code: info.code, name: info.name, admits: t().pass.admits(info.max) });
      savedNote.textContent = t().pass.saved;
    } catch {
      // A screenshot works just as well; nothing to report.
    } finally {
      saveBtn.disabled = false;
    }
  });

  render();
  onInvitationChange(() => {
    render();
    refreshScrollTriggers();
  });

  return { node, updateLang: render };
}
