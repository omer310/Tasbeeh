import categories from './hisnDuas.json';

const definitions = [
  ['prayer', 'Prayer & worship', 'الصلاة والعبادة', 'prayer'],
  ['daily', 'Daily life', 'الحياة اليومية', 'daily'],
  ['family', 'Family & kindness', 'الأهل والإحسان', 'family'],
  ['comfort', 'Comfort & protection', 'الطمأنينة والحفظ', 'comfort'],
  ['health', 'Health & loss', 'المرض والفقد', 'health'],
  ['food', 'Food & fasting', 'الطعام والصيام', 'food'],
  ['travel', 'Travel', 'السفر', 'travel'],
  ['nature', 'Nature & weather', 'الطبيعة والطقس', 'nature'],
  ['pilgrimage', 'Hajj & Umrah', 'الحج والعمرة', 'pilgrimage'],
];
function topic(id) {
  if (id === 27) return null;
  if (id >= 115 && id <= 121) return 'pilgrimage';
  if (id >= 95 && id <= 105) return 'travel';
  if (id >= 61 && id <= 67 || id === 110 || id === 111) return 'nature';
  if (id >= 68 && id <= 76) return 'food';
  if (id >= 49 && id <= 60) return 'health';
  if (id >= 34 && id <= 46 || [83, 88, 92, 94, 124, 125, 126, 128].includes(id)) return 'comfort';
  if ([47, 48, 79, 80, 81, 86, 87, 89, 90, 91, 93, 113, 114].includes(id)) return 'family';
  if ([8, 9, 32, 33, 107, 129, 130, 131].includes(id) || id >= 12 && id <= 26) return 'prayer';
  return 'daily';
}
export const DUA_TOPICS = definitions.map(([id, title, titleAr, icon]) => {
  const occasions = categories.filter(category => topic(category.hisnChapter) === id);
  let index = 0;
  return { id: `topic-${id}`, title, titleAr, icon,
    occasions: occasions.map(category => { const item = { id: category.id, title: category.title, titleAr: category.titleAr, index, count: category.subcategories.length }; index += item.count; return item; }),
    subcategories: occasions.flatMap(category => category.subcategories.map(dua => ({ ...dua, occasionTitle: category.title, occasionTitleAr: category.titleAr, occasionId: category.id }))),
  };
});
export const DAILY_ATHKAR = categories.filter(category => category.period);
export const QUICK_DUAS = ['hisn-25', 'hisn-28'].map(id => categories.find(category => category.id === id));
