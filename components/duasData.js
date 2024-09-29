export const initialDuaCategories = [
  { 
    id: '1', 
    title: 'Ablution', 
    subcategories: [
      { 
        id: '1-1', 
        title: 'Before Ablution',
        arabic: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah',
        translation: 'In the name of Allah',
        reference: 'Abu Dawud (Book 1, Hadith 101), Ibn Majah (Book 1, Hadith 399)',
      },
      {
        id: '1-2',
        title: 'After Ablution',
        arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
        transliteration: "Ash-hadu an laa ilaaha ill-Allah wahdahu laa shareeka lahu, wa ash-hadu anna Muhammadan 'abduhu wa rasooluhu",
        translation: 'I bear witness that there is no deity worthy of worship except Allah alone, who has no partner, and I bear witness that Muhammad is His servant and His Messenger',
        reference: 'Sahih Muslim (Book 2, Hadith 234)',
      },
      {
        id: '1-3',
        title: 'While Washing Each Part',
        arabic: 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَوَسِّعْ لِي فِي دَارِي، وَبَارِكْ لِي فِي رِزْقِي',
        transliteration: "Allahummaghfir lee dhanbee, wa wassi' lee fee daaree, wa baarik lee fee rizqee",
        translation: 'O Allah, forgive my sin, make my home spacious, and bless my provision',
        reference: 'Ibn Majah (Book 1, Hadith 301)',
      },
    ] 
  },
  { 
    id: '2', 
    title: 'Clothes', 
    subcategories: [
      { 
        id: '2-1', 
        title: 'When Wearing New Clothes',
        arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ كَسَوْتَنِيهِ، أَسْأَلُكَ مِنْ خَيْرِهِ وَخَيْرِ مَا صُنِعَ لَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّهِ وَشَرِّ مَا صُنِعَ لَهُ',
        transliteration: "Allahumma lakal-hamdu anta kasawtaneehi, as'aluka min khayrihi wa khayri ma suni'a lahu, wa a'oodhu bika min sharrihi wa sharri ma suni'a lahu",
        translation: 'O Allah, praise be to You. You have clothed me with it. I ask You for its goodness and the goodness of what it was made for, and I seek Your protection from its evil and the evil of what it was made for',
        reference: 'Abu Dawud (Book 32, Hadith 4020), At-Tirmidhi (Book 43, Hadith 2968)',
      },
      {
        id: '2-2',
        title: 'When Undressing',
        arabic: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah',
        translation: 'In the name of Allah',
        reference: 'At-Tirmidhi (Book 43, Hadith 2967)',
      },
      {
        id: '2-3',
        title: 'When Seeing Someone Wearing New Clothes',
        arabic: 'تُبْلِي وَيُخْلِفُ اللَّهُ تَعَالَى',
        transliteration: "Tublee wa yukhliful-laahu ta'aala",
        translation: 'May you wear it out and Allah replace it (with another)',
        reference: 'Abu Dawud (Book 32, Hadith 4020)',
      },
    ] 
  },
  {
    id: '3',
    title: 'Home',
    subcategories: [
      {
        id: '3-1',
        title: 'When Entering Home',
        arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
        transliteration: "Bismillahi walajna, wa bismillahi kharajna, wa 'ala Rabbina tawakkalna",
        translation: 'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we place our trust',
        reference: 'Abu Dawud (Book 43, Hadith 5096)',
      },
      {
        id: '3-2',
        title: 'When Leaving Home',
        arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        transliteration: "Bismillah, tawakkaltu 'ala Allah, wa la hawla wa la quwwata illa billah",
        translation: 'In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah',
        reference: 'Abu Dawud (Book 43, Hadith 5095), At-Tirmidhi (Book 49, Hadith 3426)',
      },
      {
        id: '3-3',
        title: 'When Entering an Empty House',
        arabic: 'السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ',
        transliteration: "As-salaamu 'alaynaa wa 'alaa 'ibaadillaahis-saaliheen",
        translation: 'Peace be upon us and upon the righteous slaves of Allah',
        reference: 'Sahih Muslim (Book 48, Hadith 2018)',
      },
    ]
  },
  {
    id: '4',
    title: 'Food & Drink',
    subcategories: [
      {
        id: '4-1',
        title: 'Before Eating',
        arabic: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah',
        translation: 'In the name of Allah',
        reference: 'Abu Dawud (Book 27, Hadith 3767), At-Tirmidhi (Book 23, Hadith 1858)',
      },
      {
        id: '4-2',
        title: 'After Eating',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا، وَرَزَقَنِيهِ، مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
        transliteration: "Alhamdu lillahil-lathee at'amanee hatha wa razaqaneehi min ghayri hawlin minnee wa la quwwatin",
        translation: 'All praise is for Allah who has given me this food and provided it for me without any might or power on my part',
        reference: 'Abu Dawud (Book 27, Hadith 3850), At-Tirmidhi (Book 44, Hadith 3458), Ibn Majah (Book 29, Hadith 3285)',
      },
      {
        id: '4-3',
        title: 'When Forgetting to Say Bismillah',
        arabic: 'بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ',
        transliteration: "Bismillahi awwalahu wa aakhirahu",
        translation: 'In the name of Allah at its beginning and at its end',
        reference: 'Abu Dawud (Book 27, Hadith 3767), At-Tirmidhi (Book 23, Hadith 1858)',
      },
      {
        id: '4-4',
        title: 'When Drinking Milk',
        arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَزِدْنَا مِنْهُ',
        transliteration: "Allahumma baarik lanaa feehi wa zidnaa minhu",
        translation: 'O Allah, bless it for us and give us more of it',
        reference: 'At-Tirmidhi (Book 23, Hadith 1892)',
      },
    ]
  },
  {
    id: '5',
    title: 'Travel',
    subcategories: [
      {
        id: '5-1',
        title: 'When Boarding a Vehicle',
        arabic: 'بِسْمِ اللَّهِ، الْحَمْدُ لِلَّهِ، ﴿سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ * وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ﴾',
        transliteration: "Bismillah, Alhamdu lillah, Subhaanal-lathee sakhkhara lanaa haathaa wa maa kunnaa lahu muqrineen. Wa innaa ilaa Rabbinaa lamunqaliboon",
        translation: 'In the name of Allah, all praise is for Allah. Glory to Him Who has subjected this to us, and we were not able to do it. And surely, to our Lord we will return',
        reference: 'Abu Dawud (Book 15, Hadith 2602), At-Tirmidhi (Book 44, Hadith 3446)',
      },
      {
        id: '5-2',
        title: 'Returning from Travel',
        arabic: 'آيِبُونَ، تَائِبُونَ، عَابِدُونَ، لِرَبِّنَا حَامِدُونَ',
        transliteration: "Aayiboona, taa'iboona, 'aabidoona, li Rabbinaa haamidoon",
        translation: 'We return, repent, worship and praise our Lord',
        reference: 'Sahih Muslim (Book 15, Hadith 1342)',
      },
      {
        id: '5-3',
        title: 'When Stopping at a Place',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: "A'oothu bikalimaatil-laahit-taammaati min sharri maa khalaq",
        translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created',
        reference: 'Sahih Muslim (Book 48, Hadith 2078)',
      },
    ]
  },
  {
    id: '6',
    title: 'Morning & Evening',
    subcategories: [
      {
        id: '6-1',
        title: 'Morning Remembrance',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "Asbahna wa asbahal-mulku lillah walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadeer",
        translation: 'We have reached the morning and kingship belongs to Allah, praise is to Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent',
        reference: 'Abu Dawud (Book 43, Hadith 5068)',
      },
      {
        id: '6-2',
        title: 'Evening Remembrance',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "Amsayna wa amsal-mulku lillah walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadeer",
        translation: 'We have reached the evening and kingship belongs to Allah, praise is to Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent',
        reference: 'Abu Dawud (Book 43, Hadith 5071)',
      },
      {
        id: '6-3',
        title: 'Protection from Harm',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: "Bismillahil-lathee la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i wa huwas-samee'ul-'aleem",
        translation: 'In the name of Allah with Whose name nothing can harm on earth or in heaven, and He is the All-Hearing, the All-Knowing',
        reference: 'Abu Dawud (Book 43, Hadith 5088), At-Tirmidhi (Book 48, Hadith 3388)',
      },
    ]
  },
  {
    id: '7',
    title: 'Sleep',
    subcategories: [
      {
        id: '7-1',
        title: 'Before Sleeping',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: "Bismika Allahumma amootu wa ahya",
        translation: 'In Your name O Allah, I die and I live',
        reference: 'Sahih Al-Bukhari (Book 80, Hadith 16)',
      },
      {
        id: '7-2',
        title: 'Upon Waking Up',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
        transliteration: "Alhamdu lillahil-lathee ahyana ba'da ma amatana wa ilayhin-nushoor",
        translation: 'All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection',
        reference: 'Sahih Al-Bukhari (Book 80, Hadith 17)',
      },
      {
        id: '7-3',
        title: 'When Having a Bad Dream',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَشَرِّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ',
        transliteration: "A'oothu bikalimaatil-laahit-taammaati min ghadabihi wa 'iqaabihi, wa sharri 'ibaadihi, wa min hamazaatish-shayaateeni wa an yahduroon",
        translation: 'I seek refuge in the perfect words of Allah from His anger and His punishment, from the evil of His slaves and from the taunts of devils and from their presence',
        reference: 'Abu Dawud (Book 43, Hadith 5067)',
      },
    ]
  },
  {
    id: '8',
    title: 'Miscellaneous',
    subcategories: [
      {
        id: '8-1',
        title: 'When Entering the Mosque',
        arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
        transliteration: "Allahumma iftah lee abwaaba rahmatika",
        translation: 'O Allah, open the gates of Your mercy for me',
        reference: 'Sahih Muslim (Book 6, Hadith 703)',
      },
      {
        id: '8-2',
        title: 'When Leaving the Mosque',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
        transliteration: "Allahumma innee as'aluka min fadlika",
        translation: 'O Allah, I ask You for Your bounty',
        reference: 'Sahih Muslim (Book 6, Hadith 705)',
      },
      {
        id: '8-3',
        title: 'When in Distress',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
        transliteration: "Laa ilaaha illal-laahul-'Atheemul-Haleem, Laa ilaaha illal-laahu Rabbul-'Arshil-'Atheem, Laa ilaaha illal-laahu Rabbus-samaawaati wa Rabbul-ardi wa Rabbul-'Arshil-Kareem",
        translation: 'There is no god but Allah the Mighty, the Forbearing. There is no god but Allah, Lord of the Mighty Throne. There is no god but Allah, Lord of the heavens and Lord of the earth and Lord of the Noble Throne',
        reference: 'Sahih Al-Bukhari (Book 80, Hadith 66), Sahih Muslim (Book 48, Hadith 2092)',
      },
    ]
  },
];