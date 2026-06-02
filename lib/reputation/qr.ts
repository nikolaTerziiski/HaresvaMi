import QRCode from "qrcode";

/** Render a Google-review URL as an inline SVG QR code (server-side only). */
export async function renderReviewQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1, width: 320 });
}
