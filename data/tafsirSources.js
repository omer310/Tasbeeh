// Resource IDs verified against Quran.com's public resource catalogue.
const TAFSIR_SOURCES = [
  { id: 169, name: 'Ibn Kathir (abridged)', nameAr: 'ابن كثير (مختصر)', language: 'en', slug: 'en-tafisr-ibn-kathir' },
  { id: 168, name: "Ma’arif al-Qur’an", nameAr: 'معارف القرآن', language: 'en', slug: 'en-tafsir-maarif-ul-quran' },
  { id: 91, name: 'Al-Sa’di', nameAr: 'السعدي', language: 'ar', slug: 'ar-tafseer-al-saddi' },
  { id: 14, name: 'Ibn Kathir', nameAr: 'ابن كثير', language: 'ar', slug: 'ar-tafsir-ibn-kathir' },
  { id: 16, name: 'Al-Muyassar', nameAr: 'التفسير الميسر', language: 'ar', slug: 'ar-tafsir-muyassar' },
];
const tafsirSource = id => TAFSIR_SOURCES.find(source => source.id === Number(id));
const defaultTafsirSource = language => tafsirSource(language === 'ar' ? 91 : 169);
const tafsirUrl = (source, key) => `https://quran.com/${key.split(':').join('/')}/tafsirs/${source.slug}`;
module.exports = { TAFSIR_SOURCES, tafsirSource, defaultTafsirSource, tafsirUrl };
