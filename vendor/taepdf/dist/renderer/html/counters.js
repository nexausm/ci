// renderer/html/counters.ts
function parseCounterList(v, def) {
  if (!v || v === "none") return [];
  const out = [];
  const toks = v.trim().split(/\s+/);
  for (let i = 0; i < toks.length; i++) {
    const name = toks[i];
    if (!/^[A-Za-z_-]/.test(name)) continue;
    let val = def;
    if (i + 1 < toks.length && /^-?\d+$/.test(toks[i + 1]))
      val = parseInt(toks[++i], 10);
    out.push([name, val]);
  }
  return out;
}
function applyCounters(counters, s) {
  const pushed = [];
  const push = (name, val) => {
    const st = counters.get(name) ?? [];
    st.push(val);
    counters.set(name, st);
    pushed.push(name);
  };
  for (const [name, val] of parseCounterList(s.counterReset, 0))
    push(name, val);
  for (const [name, val] of parseCounterList(s.counterSet, 0)) {
    const st = counters.get(name);
    if (st?.length) st[st.length - 1] = val;
    else push(name, val);
  }
  for (const [name, val] of parseCounterList(s.counterIncrement, 1)) {
    const st = counters.get(name);
    if (st?.length) st[st.length - 1] += val;
    else push(name, val);
  }
  return pushed;
}
function popCounters(counters, pushed) {
  for (const name of pushed) counters.get(name)?.pop();
}
function romanNumeral(n) {
  const table = [
    [1e3, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  for (const [v, sym] of table)
    while (n >= v) {
      out += sym;
      n -= v;
    }
  return out;
}
function alphaLabel(n) {
  let out = "";
  while (n > 0) {
    n--;
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}
function counterText(n, style) {
  switch (style) {
    case "lower-alpha":
    case "lower-latin":
      return alphaLabel(n);
    case "upper-alpha":
    case "upper-latin":
      return alphaLabel(n).toUpperCase();
    case "lower-roman":
      return romanNumeral(n).toLowerCase();
    case "upper-roman":
      return romanNumeral(n);
    case "decimal-leading-zero":
      return `${n < 10 && n >= 0 ? "0" : ""}${n}`;
    default:
      return String(n);
  }
}
function resolveContentList(content, counters) {
  const s = content.trim();
  let out = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === " ") {
      i++;
      continue;
    }
    const q = s[i];
    if (q === '"' || q === "'") {
      let j = i + 1,
        lit = "";
      while (j < s.length && s[j] !== q) {
        if (s[j] === "\\" && j + 1 < s.length) {
          lit += s[j + 1];
          j += 2;
        } else {
          lit += s[j];
          j++;
        }
      }
      if (j >= s.length) return null;
      out += lit;
      i = j + 1;
      continue;
    }
    const fnM = s.slice(i).match(/^(counters?)\(/);
    if (!fnM) return null;
    const close = s.indexOf(")", i);
    if (close < 0) return null;
    const parts = s
      .slice(i + fnM[0].length, close)
      .split(",")
      .map((p) => p.trim());
    const name = parts[0];
    if (!name) return null;
    const stack = counters.get(name);
    if (fnM[1] === "counters") {
      const sepM =
        (parts[1] ?? "").match(/^"((?:[^"\\]|\\.)*)"$/) ??
        (parts[1] ?? "").match(/^'((?:[^'\\]|\\.)*)'$/);
      if (!sepM) return null;
      const sep = sepM[1].replace(/\\(.)/g, "$1");
      out += (stack?.length ? stack : [0])
        .map((v) => counterText(v, parts[2]))
        .join(sep);
    } else {
      out += counterText(stack?.length ? stack[stack.length - 1] : 0, parts[1]);
    }
    i = close + 1;
  }
  return out;
}
export {
  alphaLabel,
  applyCounters,
  counterText,
  popCounters,
  resolveContentList,
  romanNumeral,
};
