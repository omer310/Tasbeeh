const categories = require('../data/hisnDuas.json');

const normalizeDuaSearch = text => String(text || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').trim();

// Short navigation labels only. The invocations, variants and references stay
// in the existing Hisn catalogue; shortcuts never create a second copy.
const EVERYDAY_DUAS = [
  [10, 'Leaving home', 'الخروج من المنزل', 'home-out'],
  [13, 'Entering the mosque', 'دخول المسجد', 'mosque-in'],
  [11, 'Entering home', 'دخول المنزل', 'home-in'],
  [14, 'Leaving the mosque', 'الخروج من المسجد', 'mosque-out'],
  [25, 'After prayer', 'بعد الصلاة', 'afterPrayer'],
  [28, 'Before sleep', 'قبل النوم', 'sleep'],
  [1, 'Waking up', 'الاستيقاظ', 'morning'],
  [69, 'Before eating', 'قبل الطعام', 'food'],
  [70, 'After eating', 'بعد الطعام', 'meal'],
  [6, 'Entering the restroom', 'دخول الخلاء', 'restroom-in'],
  [7, 'Leaving the restroom', 'الخروج من الخلاء', 'restroom-out'],
  [9, 'After wudu', 'بعد الوضوء', 'wudu'],
].map(([chapter, title, titleAr, icon]) => ({ id: `hisn-${chapter}`, title, titleAr, icon, category: categories.find(category => category.id === `hisn-${chapter}`) }));

function occasionsForTopic(topic, query = '') {
  const needle = normalizeDuaSearch(query);
  return (topic?.occasions || []).map(occasion => categories.find(category => category.id === occasion.id))
    .filter(category => category && (!needle || normalizeDuaSearch([category.title, category.titleAr,
      ...category.subcategories.flatMap(dua => [dua.title, dua.arabic, dua.translation, dua.transliteration]),
    ].join(' ')).includes(needle)));
}
function duaCategoryDestination(category, duaId, query = '') {
  if (!category?.subcategories?.length) return null;
  const needle = normalizeDuaSearch(query);
  const dua = category.subcategories.find(item => item.id === duaId)
    || (needle && category.subcategories.find(item => normalizeDuaSearch([item.title, item.arabic, item.translation, item.transliteration].join(' ')).includes(needle)))
    || category.subcategories[0];
  return { category, dua };
}
module.exports = { EVERYDAY_DUAS, normalizeDuaSearch, occasionsForTopic, duaCategoryDestination };
