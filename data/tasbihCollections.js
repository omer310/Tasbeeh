import { DEFAULT_DHIKR, DHIKR_ROUTINES } from './dhikr';
import hisn from './hisnDuas.json';

const normalize = text => text.replace(/[\u064B-\u065F\u0670\s،,.]/g, '');
export const TASBIH_LIBRARY = { ...DEFAULT_DHIKR };
const morning = hisn.find(category => category.id === 'hisn-morning');
const selectedMorning = [18, 20, 21, 23, 24].map(index => morning.subcategories[index - 1]);
const meanings = [
  'Glory and praise be to Allah',
  'There is no god but Allah alone, without partner. Dominion and praise belong to Him, and He has power over everything.',
  'Glory and praise be to Allah: as many as His creations, as pleases Him, as the weight of His Throne and as the ink of His words.',
  'I seek Allah’s forgiveness and turn to Him in repentance.',
  'O Allah, send blessings and peace upon our Prophet Muhammad.',
];
const morningItems = selectedMorning.map((dua, index) => {
  const dhikr = Object.keys(TASBIH_LIBRARY).find(key => normalize(TASBIH_LIBRARY[key].ar) === normalize(dua.arabic)) || dua.id;
  TASBIH_LIBRARY[dhikr] ||= { ar: dua.arabic, en: meanings[index], count: 0, goal: 0 };
  return { id: `morning-${index}`, dhikr, ar: dua.arabic, en: meanings[index], target: dua.repetitions };
});
export const DEFAULT_COLLECTIONS = [
  { id: 'afterPrayer', title: 'After Prayer', titleAr: 'بعد الصلاة', preset: true, description: 'Tasbih after prayer', items: DHIKR_ROUTINES.afterPrayer.map((item, index) => ({ id: `prayer-${index}`, dhikr: item.dhikr, ar: TASBIH_LIBRARY[item.dhikr].ar, en: TASBIH_LIBRARY[item.dhikr].en, target: item.count })) },
  { id: 'morning', title: 'Morning Dhikr', titleAr: 'أذكار الصباح', preset: true, description: 'Five short remembrances from Hisn al-Muslim', items: morningItems },
];
