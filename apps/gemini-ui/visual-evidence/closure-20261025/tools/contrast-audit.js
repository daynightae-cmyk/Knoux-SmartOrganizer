(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const parse = (c) => {
    if (!c || c === 'transparent' || c === 'none') return null;
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    } catch {
      return null;
    }
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const effectiveBg = (el) => {
    let cur = el;
    let acc = { r: 255, g: 255, b: 255, a: 1 };
    const layers = [];
    while (cur && cur !== document.documentElement) {
      const cs = getComputedStyle(cur);
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0.02) layers.unshift(c);
      if (c && c.a >= 0.999) break;
      cur = cur.parentElement;
    }
    for (const l of layers) acc = blend(l, acc);
    return acc;
  };
  const contrast = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.15 && r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const ownDark = [];
  const lowContrast = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('div,section,aside,header,footer,label,li,td,th,button,a,span,p,h1,h2,h3,h4')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const bg = parse(cs.backgroundColor);
    if (bg && bg.a > 0.55 && lum(bg) < 0.09 && r.width * r.height > 2500) {
      ownDark.push({
        cls: String(el.className || '').slice(0, 150),
        bg: cs.backgroundColor,
        area: Math.round(r.width * r.height),
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      });
    }
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (!text || text.length < 2) continue;
    if (cs.color === 'rgba(0, 0, 0, 0)' || cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') continue;
    if (cs.backgroundClip === 'text' || String(el.className).includes('bg-clip-text')) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    // Gradient-backed labels are evaluated visually; computed colour alone
    // cannot establish which stop sits behind the glyph.
    let grad = false;
    let anc = el;
    for (let i = 0; i < 4 && anc; i++, anc = anc.parentElement) {
      if (getComputedStyle(anc).backgroundImage !== 'none') {
        grad = true;
        break;
      }
    }
    if (grad) continue;
    const bgc = effectiveBg(el);
    const c = contrast(fg, bgc);
    if (c < 3 && !seen.has(el)) {
      seen.add(el);
      lowContrast.push({
        c: Math.round(c * 100) / 100,
        fg: cs.color,
        bg: `rgb(${Math.round(bgc.r)},${Math.round(bgc.g)},${Math.round(bgc.b)})`,
        size: cs.fontSize,
        cls: String(el.className || '').slice(0, 110),
        text: text.slice(0, 60),
      });
    }
  }
  return {
    theme: document.documentElement.getAttribute('data-theme'),
    darkSurfaceCount: ownDark.length,
    darkSurfaces: ownDark.slice(0, 18),
    lowContrastCount: lowContrast.length,
    lowContrast: lowContrast.slice(0, 26),
  };
})()
