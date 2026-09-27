const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').toLowerCase();

export function mergeHadiths(english, arabic) {
  const translations = new Map(arabic.map(h => [String(h.hadithnumber), h.text]));
  return english.map(h => ({ hadithnumber: h.hadithnumber, engText: h.text || '', araText: translations.get(String(h.hadithnumber)) || '' }));
}

export function searchHadiths(hadiths, query) {
  const terms = [...new Set(normalize(query).trim().split(/\s+/).filter(Boolean))];
  if (!terms.length) return [];
  return hadiths.map(h => {
    const text = normalize(`${h.engText} ${h.araText}`);
    const score = terms.reduce((sum, term) => sum + (String(h.hadithnumber) === term ? 100 : 0) + text.split(term).length - 1, 0);
    return { h, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).map(({ h }) => h);
}
