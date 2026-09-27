export const DEFAULT_DHIKR = {
    'سبحان الله وبحمده': { ar: 'سبحان الله وبحمده', en: 'Glory and praise be to Allah', count: 0, goal: 0 },
    'الحمد لله': { ar: 'الحمد لله', en: 'Praise be to Allah', count: 0, goal: 0 },
    'الله أكبر': { ar: 'الله أكبر', en: 'Allah is the Greatest', count: 0, goal: 0 },
    'لا إله إلا الله': { ar: 'لا إله إلا الله', en: 'There is no god but Allah', count: 0, goal: 0 },
    'أستغفر الله': { ar: 'أستغفر الله', en: 'I seek forgiveness from Allah', count: 0, goal: 0 },
    'سبحان الله': { ar: 'سبحان الله', en: 'Glory be to Allah', count: 0, goal: 0 },
    'لا حول ولا قوة إلا بالله': { ar: 'لا حول ولا قوة إلا بالله', en: 'There is no power and no strength except with Allah', count: 0, goal: 0 },
    'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد': { ar: 'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد', en: 'O Allah, send prayers upon Muhammad and upon the family of Muhammad, as You sent prayers upon Ibrahim and upon the family of Ibrahim. Indeed, You are praiseworthy and glorious. O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and upon the family of Ibrahim. Indeed, You are praiseworthy and glorious', count: 0, goal: 0 },
    'اللهم صلى على سيدنا محمد و على اله و صحبه و سلم': { ar: 'اللهم صلى على سيدنا محمد و على اله و صحبه و سلم', en: 'O Allah, send blessings upon our prohpet Muhammad, his family, his companions, and grant them peace', count: 0, goal: 0 },
    'سبحان الله وبحمده سبحان الله العظيم': { ar: 'سبحان الله وبحمده سبحان الله العظيم', en: 'Glory and praise be to Allah, glory be to Allah the Magnificent', count: 0, goal: 0 },
    'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير': { ar: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', en: 'There is no god but Allah, alone, without any partner. His is the dominion and His is the praise, and He is able to do all things', count: 0, goal: 0 },
    'اللهم إني أسألك العفو والعافية': { ar: 'اللهم إني أسألك العفو والعافية', en: 'O Allah, I ask You for pardon and well-being', count: 0, goal: 0 },
    'رب اغفر لي وتب علي إنك أنت التواب الرحيم': { ar: 'رب اغفر لي وتب علي إنك أنت التواب الرحيم', en: 'My Lord, forgive me and accept my repentance. Indeed, You are the Accepting of repentance, the Merciful', count: 0, goal: 0 },
    'اللهم أعني على ذكرك وشكرك وحسن عبادتك': { ar: 'اللهم أعني على ذكرك وشكرك وحسن عبادتك', en: 'O Allah, help me remember You, to be grateful to You, and to worship You in an excellent manner', count: 0, goal: 0 },
    'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم': { ar: 'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم', en: 'Sufficient for me is Allah; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne', count: 0, goal: 0 },
    'اللهم إني أعوذ بك من الهم والحزن': { ar: 'اللهم إني أعوذ بك من الهم والحزن', en: 'O Allah, I seek refuge in You from anxiety and sorrow', count: 0, goal: 0 },
};
export const DHIKR_ROUTINES = {
    afterPrayer: [
      { dhikr: 'سبحان الله', count: 33 },
      { dhikr: 'الحمد لله', count: 33 },
      { dhikr: 'الله أكبر', count: 33 },
      { dhikr: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', count: 1 }
    ],
    morning: [
      { dhikr: 'سبحان الله وبحمده', count: 100 },
      { dhikr: 'أستغفر الله', count: 100 },
      { dhikr: 'لا إله إلا الله', count: 100 }
    ]
  };
