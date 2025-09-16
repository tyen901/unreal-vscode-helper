function dedupe(arr, cmp) {
  if (!Array.isArray(arr)) return [];
  const seen = [];
  const eq = cmp || ((a, b) => String(a).toLowerCase() === String(b).toLowerCase());
  for (const v of arr) {
    if (!seen.some((s) => eq(s, v))) seen.push(v);
  }
  return seen;
}

module.exports = { dedupe };
