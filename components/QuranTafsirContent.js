import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TAFSIR_SOURCES, tafsirSource, defaultTafsirSource, tafsirUrl } from '../data/tafsirSources';
import { tafsirReferences, distinctTafsirPassages } from '../utils/quranTafsir';
import { loadTafsir, readTafsirSource, saveTafsirSource } from '../services/TafsirService';

export default function QuranTafsirContent({ verseKey, reader, onBack, theme: t, language }) {
  const ar = language === 'ar';
  const [chosen, setChosen] = useState(null), [choosing, setChoosing] = useState(false);
  const [result, setResult] = useState(null), [attempt, setAttempt] = useState(0), [notice, setNotice] = useState('');
  const source = tafsirSource(chosen) || defaultTafsirSource(language);
  const references = useMemo(() => { try { return tafsirReferences(verseKey, reader); } catch { return []; } }, [verseKey, reader]);
  const identity = `${source.id}/${references.join(',')}/${attempt}`;
  const current = result?.identity === identity ? result : null;
  useEffect(() => {
    let active = true;
    readTafsirSource(language).then(value => { if (active) setChosen(previous => previous ?? value.id); });
    return () => { active = false; };
  }, [language]);
  useEffect(() => {
    if (chosen === null || !references.length) return;
    let active = true;
    Promise.all(references.map(key => loadTafsir(source.id, key)))
      .then(passages => { if (active) setResult({ identity, passages: distinctTafsirPassages(passages) }); })
      .catch(() => { if (active) setResult({ identity, error: true }); });
    return () => { active = false; };
  }, [identity, source.id, references, chosen]);
  const choose = id => {
    setChosen(id); setChoosing(false); setNotice('');
    saveTafsirSource(id).catch(() => {
      setNotice(ar ? 'تعذر حفظ الاختيار للمرة القادمة.' : 'Could not save this choice for next time.');
    });
  };
  const openSource = key => Linking.openURL(tafsirUrl(source, key)).catch(() => setNotice(ar ? 'تعذر فتح رابط المصدر.' : 'Could not open the source link.'));
  return <>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Ionicons name={ar ? 'arrow-forward' : 'arrow-back'} size={20} color={t.activeTabColor} /><Text style={{ color: t.activeTabColor }}>{ar ? 'خيارات الآية' : 'Ayah options'}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: choosing }} accessibilityLabel={ar ? 'اختيار كتاب التفسير' : 'Choose Tafsir source'} onPress={() => setChoosing(value => !value)} style={[styles.selector, { backgroundColor: t.inputBackground }]}>
      <View style={{ flex: 1, gap: 5 }}><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{ar ? 'كتاب التفسير' : 'TAFSIR SOURCE'}</Text><Text style={{ color: t.textColor, fontSize: 17, fontWeight: '600' }}>{ar ? source.nameAr : source.name} · {source.language === 'ar' ? 'العربية' : 'English'}</Text></View><Ionicons name={choosing ? 'chevron-up' : 'chevron-down'} color={t.activeTabColor} size={20} />
    </Pressable>
    {choosing && <View style={{ gap: 4 }}>{TAFSIR_SOURCES.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: item.id === source.id }} onPress={() => choose(item.id)} style={[styles.option, { borderColor: t.separatorColor }]}><Text style={{ color: t.textColor, flex: 1 }}>{ar ? item.nameAr : item.name} · {item.language === 'ar' ? 'العربية' : 'English'}</Text><Ionicons name={item.id === source.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={t.activeTabColor} /></Pressable>)}</View>}
    {!!notice && <Text accessibilityRole="alert" style={{ color: t.errorColor }}>{notice}</Text>}
    <Text style={{ color: t.secondaryTextColor, fontSize: 12, lineHeight: 19 }}>{ar ? 'المصدر: Quran.com · التفاسير المقروءة مؤخراً متاحة دون اتصال.' : 'Source: Quran.com · Recently read explanations are available offline.'}</Text>
    {(reader === 'duri' || reader === 'noreen') && <Text style={{ color: t.secondaryTextColor, fontSize: 13, lineHeight: 21 }}>{ar ? 'تفسير المقطع المقابل بترقيم حفص: ' : 'Explanation of the matching passage in Hafs numbering: '}{references.join('، ')}</Text>}
    {!references.length ? <Text accessibilityRole="alert" style={{ color: t.errorColor }}>{ar ? 'تعذر تحديد مرجع التفسير لهذه الآية.' : 'Could not identify the Tafsir reference for this ayah.'}</Text>
      : current?.error ? <View style={styles.message}><Text accessibilityRole="alert" style={{ color: t.textColor }}>{ar ? 'تعذر تحميل التفسير. تحقق من الاتصال وحاول مجدداً.' : 'Could not load Tafsir. Check your connection and try again.'}</Text><Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={styles.back}><Text style={{ color: t.activeTabColor }}>{ar ? 'إعادة المحاولة' : 'Try again'}</Text></Pressable><Pressable accessibilityRole="link" onPress={() => openSource(references[0])} style={styles.back}><Text style={{ color: t.activeTabColor }}>{ar ? 'القراءة على Quran.com' : 'Read on Quran.com'}</Text></Pressable></View>
      : !current ? <View style={styles.message}><ActivityIndicator color={t.activeTabColor} /><Text style={{ color: t.secondaryTextColor }}>{ar ? 'جارٍ تحميل التفسير…' : 'Loading Tafsir…'}</Text></View>
      : current.passages.map(passage => <View key={passage.key} style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={{ color: t.activeTabColor, fontSize: 14, fontWeight: '600' }}>{ar ? 'الآيات' : 'Ayahs'} {passage.references.length > 1 ? `${passage.references[0]}–${passage.references.at(-1)}` : passage.references[0]}</Text>
        <Text style={[styles.body, { color: t.textColor, textAlign: source.language === 'ar' ? 'right' : 'left', writingDirection: source.language === 'ar' ? 'rtl' : 'ltr', fontSize: source.language === 'ar' ? 21 : 17, lineHeight: source.language === 'ar' ? 36 : 28 }]}>{passage.text}</Text>
        <Pressable accessibilityRole="link" onPress={() => openSource(passage.key)} style={styles.back}><Text style={{ color: t.activeTabColor }}>{ar ? 'عرض المصدر على Quran.com' : 'View source on Quran.com'}</Text><Ionicons name="open-outline" size={17} color={t.activeTabColor} /></Pressable>
      </View>)}
  </>;
}
const styles = StyleSheet.create({
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selector: { minHeight: 68, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  option: { minHeight: 52, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  body: { paddingBottom: 6 }, message: { paddingVertical: 24, gap: 16 },
});
