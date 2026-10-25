(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const parse = (c) => {
    if (!c || c === 'transparent') return null;
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    } catch { return null; }
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const seen = new Set();
  const out = [];
  for (const el of document.querySelectorAll('div,section,aside,header,footer,label,li,td,th,button,a,span')) {
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 700 || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el);
    const bg = parse(cs.backgroundColor);
    if (!bg || bg.a < 0.5 || lum(bg) > 0.07) continue;
    const key = String(el.className || '').slice(0, 200);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      cls: key,
      bg: cs.backgroundColor,
      area: Math.round(r.width * r.height),
      text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 45),
    });
    if (out.length > 40) break;
  }
  return out;
})()
