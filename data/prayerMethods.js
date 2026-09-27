// IDs verified against https://api.aladhan.com/v1/methods (2026-09-19).
const PRAYER_METHODS = [
  [2, 'Islamic Society of North America', 'الجمعية الإسلامية لأمريكا الشمالية'],
  [3, 'Muslim World League', 'رابطة العالم الإسلامي'],
  [5, 'Egyptian General Authority of Survey', 'الهيئة المصرية العامة للمساحة'],
  [4, 'Umm Al-Qura, Makkah', 'أم القرى، مكة المكرمة'],
  [1, 'University of Islamic Sciences, Karachi', 'جامعة العلوم الإسلامية، كراتشي'],
  [8, 'Gulf Region', 'منطقة الخليج'], [9, 'Kuwait', 'الكويت'], [10, 'Qatar', 'قطر'],
  [11, 'Singapore (MUIS)', 'سنغافورة'], [12, 'Union Organization Islamic de France', 'اتحاد المنظمات الإسلامية في فرنسا'],
  [13, 'Turkey (Diyanet, experimental)', 'تركيا (ديانت، تجريبي)'], [14, 'Spiritual Administration of Muslims of Russia', 'الإدارة الروحية لمسلمي روسيا'],
  [15, 'Moonsighting Committee Worldwide', 'لجنة رؤية الهلال العالمية'], [16, 'Dubai (experimental)', 'دبي (تجريبي)'],
  [17, 'Malaysia (JAKIM)', 'ماليزيا'], [18, 'Tunisia', 'تونس'], [19, 'Algeria', 'الجزائر'],
  [20, 'Indonesia (Kemenag)', 'إندونيسيا'], [21, 'Morocco', 'المغرب'], [22, 'Islamic Community of Lisbon', 'الجالية الإسلامية في لشبونة'],
  [23, 'Ministry of Awqaf, Jordan', 'وزارة الأوقاف الأردنية'], [7, 'Institute of Geophysics, Tehran', 'معهد الجيوفيزياء، طهران'],
  [0, 'Shia Ithna-Ashari, Qum', 'الشيعة الاثنا عشرية، قم'], [99, 'Custom Fajr and Isha angles', 'زوايا مخصصة للفجر والعشاء'],
].map(([id, name, ar]) => ({ id, name, ar }));
module.exports = { PRAYER_METHODS };
