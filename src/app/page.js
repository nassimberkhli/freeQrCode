"use client";

import { useState, useRef } from "react";
import Script from "next/script";

export default function Home() {
  const [qrGenerated, setQrGenerated] = useState(false);
  const [pngUrl, setPngUrl] = useState(null);
  const [svgUrl, setSvgUrl] = useState(null);
  const urlRef = useRef(null);
  const sizeRef = useRef(null);
  const ecRef = useRef(null);
  const previewRef = useRef(null);

  function normalizeURL(val) {
    const v = (val || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return "https://" + v;
  }
  function isValidURL(u) {
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
  }

  function setDownloads(pngURL, svgText) {
    if (pngURL) {
      setPngUrl(pngURL);
    } else {
      setPngUrl(null);
    }
    if (svgText) {
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      setSvgUrl(url);
    } else {
      setSvgUrl(null);
    }
  }

  function renderQR() {
    const url = normalizeURL(urlRef.current.value);
    if (!isValidURL(url)) {
      previewRef.current.innerHTML = '<span class="hint">Enter a valid URL</span>';
      setDownloads(null, null);
      setQrGenerated(false);
      return;
    }
    const size = parseInt(sizeRef.current.value, 10);
    const ecLevel = ecRef.current.value;

    // qrcode est fourni par le script CDN
    const qr = window.qrcode(0, ecLevel);
    qr.addData(url);
    qr.make();

    const count = qr.getModuleCount();
    const marginModules = Math.max(2, Math.round(count * 0.08));
    const modules = count + marginModules * 2;
    const scale = Math.max(1, Math.floor(size / modules));
    const pxSize = modules * scale;

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = pxSize;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, pxSize, pxSize);
    ctx.fillStyle = "#000";
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + marginModules) * scale;
          const y = (r + marginModules) * scale;
          ctx.fillRect(x, y, scale, scale);
        }
      }
    }

    previewRef.current.innerHTML = "";
    canvas.classList.add("fade-in");
    previewRef.current.appendChild(canvas);

    const pngURL = canvas.toDataURL("image/png");
    let path = "";
    for (let r = 0; r < count; r++) {
      for (let c2 = 0; c2 < count; c2++) {
        if (qr.isDark(r, c2)) {
          const x = (c2 + marginModules) * scale;
          const y = (r + marginModules) * scale;
          path += `M${x} ${y}h${scale}v${scale}h-${scale}z`;
        }
      }
    }
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pxSize} ${pxSize}" width="${pxSize}" height="${pxSize}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <path d="${path}" fill="#000000"/>
    </svg>`;
    setDownloads(pngURL, svgText);
    setQrGenerated(true);
  }

  function clearQR() {
    urlRef.current.value = "";
    previewRef.current.innerHTML =
      '<span class="hint">Your QR code will appear here</span>';
    setDownloads(null, null);
    setQrGenerated(false);
  }

  return (
    <>
      {/* Charge la lib QR depuis le CDN */}
      <Script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js" />

      <div className="blob"></div>
      <div className="blob2"></div>
      <div className="wrap">
        <header>
          <div className="brand">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h6v2H6v2H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"
                fill="url(#g)"
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="24" y2="24">
                  <stop stopColor="#76e1ff" />
                  <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <span>QR Codes</span>
            <span className="badge">free • unlimited • no DB</span>
          </div>
        </header>

        <section className="hero">
          <h1 className="title">Free QR Code Generator ✨</h1>
          <p className="lead">
            Paste your URL, click generate, download the QR. No account, no
            database, unlimited scans.
          </p>
        </section>

        <section className="grid">
          <div className="card">
            <label htmlFor="url">Your URL</label>
            <input
              id="url"
              ref={urlRef}
              type="url"
              placeholder="https://example.com"
              autoComplete="off"
              spellCheck="false"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  renderQR();
                }
              }}
            />
            <div className="row" style={{ marginTop: "12px" }}>
              <div>
                <label htmlFor="size">Size (px)</label>
                <select id="size" ref={sizeRef} defaultValue="384">
                  <option>256</option>
                  <option>384</option>
                  <option>512</option>
                  <option>640</option>
                </select>
              </div>
              <div>
                <label htmlFor="ec">Error correction</label>
                <select id="ec" ref={ecRef} defaultValue="M">
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </select>
              </div>
            </div>
            <div className="row" style={{ marginTop: "12px" }}>
              <button className="btn primary" onClick={renderQR}>
                Generate
              </button>
              <button className="btn" onClick={clearQR}>
                Clear
              </button>
            </div>
            <p className="hint" style={{ marginTop: "12px" }}>
              Static QR codes never expire. They last as long as your URL works.
            </p>
          </div>

          <div className="card">
            <div className="preview" ref={previewRef}>
              <span className="hint">Your QR code will appear here</span>
            </div>
            <div className="toolbar">
              <a
                className="btn accent"
                href={pngUrl || undefined}
                download="qrcode.png"
                aria-disabled={!qrGenerated}
              >
                Download PNG
              </a>
              <a
                className="btn accent"
                href={svgUrl || undefined}
                download="qrcode.svg"
                aria-disabled={!qrGenerated}
              >
                Download SVG
              </a>
            </div>
          </div>
        </section>

        <p className="footer">Made with ❤️ · No data collected</p>
      </div>
    </>
  );
}

