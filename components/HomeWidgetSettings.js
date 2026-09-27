import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from './ScreenUI';
import { addHomeWidget, homeWidgetsAvailable } from '../services/HomeWidgetService';
import { EVERYDAY_DUAS } from '../utils/duaDiscovery';

const leavingHome = EVERYDAY_DUAS.find(item => item.id === 'hisn-10');
export default function HomeWidgetSettings({ visible, onClose, theme: t, language }) {
  const ar = language === 'ar', [busy, setBusy] = useState(false);
  const add = async kind => {
    setBusy(true);
    try {
      if (!await addHomeWidget(kind)) Alert.alert(ar ? 'إضافة أداة' : 'Add a widget', ar
        ? 'اضغط مطولاً على مساحة فارغة في الشاشة الرئيسية، ثم اختر الأدوات ومنارة المسلم.'
        : 'Long-press an empty area of your home screen, choose Widgets, then find Manarat al-Muslim.');
    } catch { Alert.alert(ar ? 'تعذّر فتح الأدوات' : 'Could not open widgets', ar ? 'حاول مرة أخرى.' : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const button = (kind, label) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy || !homeWidgetsAvailable }} disabled={busy || !homeWidgetsAvailable} onPress={() => void add(kind)} style={[styles.button, { opacity: busy || !homeWidgetsAvailable ? 0.5 : 1 }]}><Ionicons name="add" size={22} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{label}</Text></TouchableOpacity>;
  const previewStyle = [styles.preview, { backgroundColor: t.isDark ? '#203D30' : '#F1F6ED' }];
  const prayerInk = t.isDark ? '#F2F6EA' : '#163B2F', prayerMuted = t.isDark ? '#B9CDBF' : '#536B5C', prayerGold = t.isDark ? '#E4C57D' : '#806022';
  const previewPrayers = ar ? ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'] : ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: t.backgroundColor }}>
      <PageHeader title={ar ? 'أدوات الشاشة الرئيسية' : 'Home screen widgets'} theme={t} onBack={onClose} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ color: t.secondaryTextColor, fontSize: 16, lineHeight: 24 }}>{ar ? 'أداتان مستقلتان. أضف ما يناسب يومك.' : 'Two separate widgets. Add whichever fits your day.'}</Text>
        <View style={[styles.card, { backgroundColor: t.cardColor }]}>
          <Text style={[styles.title, { color: t.textColor }]}>{ar ? 'الصلاة القادمة' : 'Next prayer'}</Text>
          <View style={[styles.prayerPreview, { backgroundColor: t.isDark ? '#18372F' : '#EEF5E8', borderColor: t.isDark ? '#456252' : '#D2E1CF' }]}>
            <Text style={{ color: prayerMuted, fontSize: 10 }}>{ar ? 'معاينة التنسيق · أوقات توضيحية' : 'LAYOUT PREVIEW · SAMPLE TIMES'}</Text>
            <View style={[styles.prayerHeader, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
              <Text numberOfLines={1} style={{ color: prayerInk, fontSize: 12, flex: 1 }}>{ar ? '٧ ربيع الآخر' : '7 Rabi’ II'}</Text>
              <Ionicons name="sunny-outline" color={prayerGold} size={17} />
              <Text style={{ color: prayerMuted, fontSize: 11 }}>{ar ? '٦:٤١ ص' : '6:41 AM'}</Text>
            </View>
            <View style={[styles.prayerHeader, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: prayerGold, fontSize: 10 }}>{ar ? 'الصلاة القادمة' : 'NEXT PRAYER'}</Text><Text style={{ color: prayerInk, fontSize: 27, fontWeight: '700' }}>{ar ? 'العصر' : 'Asr'}</Text><Text style={{ color: prayerMuted, fontSize: 12 }}>{ar ? '٤:١٧ م' : '4:17 PM'}</Text></View>
              <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}><Text adjustsFontSizeToFit numberOfLines={1} style={{ color: prayerGold, fontSize: 25, fontWeight: '700', fontVariant: ['tabular-nums'] }}>03:07:43</Text><Text style={{ color: prayerMuted, fontSize: 11 }}>{ar ? 'متبقي' : 'remaining'}</Text></View>
            </View>
            <View style={{ flexDirection: ar ? 'row-reverse' : 'row', gap: 3 }}>
              {previewPrayers.map((name, index) => <View key={name} style={[styles.prayerCell, { borderColor: index === 2 ? prayerGold : 'transparent', backgroundColor: index === 2 ? (t.isDark ? '#345449' : '#D9E6D2') : 'transparent' }]}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: index === 2 ? prayerGold : prayerMuted, fontSize: 11 }}>{name}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: index === 2 ? prayerGold : prayerInk, fontSize: 14, fontWeight: '700' }}>{(ar ? ['٥:٢٦', '١٢:٤٩', '٤:١٧', '٦:٥٧', '٨:١٢'] : ['5:26', '12:49', '4:17', '6:57', '8:12'])[index]}</Text>
                <Text style={{ color: prayerMuted, fontSize: 9 }}>{index === 0 ? (ar ? 'ص' : 'AM') : (ar ? 'م' : 'PM')}</Text>
              </View>)}
            </View>
          </View>
          <Text style={[styles.description, { color: t.secondaryTextColor }]}>{ar ? 'مواقيت اليوم مع تمييز الصلاة القادمة، والشروق والتاريخ الهجري. صغّرها لبطاقة مختصرة، أو وسّعها لجدول الصلوات الخمس وعدّ تنازلي أوضح. تتبع موقعك وإعداداتك المحفوظة.' : 'Today’s five prayers, a highlighted next prayer, sunrise and the Hijri date. Resize down to a quick glance, stretch into a timetable, or expand for a larger countdown. Uses your saved location and calculation settings.'}</Text>
          <Text style={{ color: t.secondaryTextColor, fontSize: 13, lineHeight: 20 }}>{ar ? 'فعّل المنبّهات الدقيقة في إعدادات الأذان لعرض العد التنازلي.' : 'Allow precise alarms in Adhan settings to show the live countdown.'}</Text>
          {button('prayer', ar ? 'إضافة أداة الصلاة' : 'Add prayer widget')}
        </View>
        <View style={[styles.card, { backgroundColor: t.cardColor }]}>
          <Text style={[styles.title, { color: t.textColor }]}>{ar ? 'أدعيتي' : 'My Duas'}</Text>
          <View style={previewStyle}>
            <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{ar ? 'معاينة التنسيق' : 'LAYOUT PREVIEW'}</Text>
            <Text style={{ color: t.textColor, fontSize: 16, fontWeight: '700' }}>{ar ? leavingHome.titleAr : leavingHome.title}</Text>
            <Text style={{ color: t.textColor, fontSize: 24, lineHeight: 41, textAlign: 'right', writingDirection: 'rtl', fontFamily: 'Amiri' }}>{leavingHome.category.subcategories[1].arabic}</Text>
            <View style={styles.arrows}><Ionicons name="chevron-back" size={23} color={t.activeTabColor} /><Text style={{ color: t.secondaryTextColor }}>{ar ? 'السابق · التالي' : 'Previous · Next'}</Text><Ionicons name="chevron-forward" size={23} color={t.activeTabColor} /></View>
          </View>
          <Text style={[styles.description, { color: t.secondaryTextColor }]}>{ar ? 'اختر حتى أربع مناسبات. اقرأ النص العربي كاملًا ومرّره على الشاشة الرئيسية، وتنقّل بين الأدعية بالأسهم. زر الإعدادات يغيّر اختيارات هذه الأداة فقط.' : 'Choose up to four occasions. Read and scroll the full Arabic text on your home screen, and use the arrows to move between Duas. The settings button changes the selection for that widget.'}</Text>
          {button('dua', ar ? 'اختيار الأدعية وإضافة الأداة' : 'Choose Duas & add widget')}
        </View>
        {!homeWidgetsAvailable && <Text accessibilityRole="alert" style={{ color: t.secondaryTextColor }}>{ar ? 'الأدوات غير متاحة في هذه النسخة من التطبيق.' : 'Home screen widgets are not available in this installed version of the app.'}</Text>}
        <Text style={[styles.description, { color: t.secondaryTextColor }]}>{ar ? 'يمكنك أيضًا إضافة كل أداة من قائمة أدوات أندرويد. اضغط مطولًا على الأداة لتغيير حجمها.' : 'You can also add each widget from Android’s widget picker. Long-press a widget to resize it.'}</Text>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({ prayerPreview: { padding: 14, borderRadius: 22, borderWidth: 1, gap: 14 }, prayerHeader: { alignItems: 'center', gap: 5 }, prayerCell: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2, gap: 5, borderRadius: 12, borderWidth: 1 }, content: { padding: 20, gap: 20, paddingBottom: 36 }, card: { padding: 18, borderRadius: 24, gap: 14 }, arrows: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 21, fontWeight: '700' }, preview: { padding: 18, borderRadius: 22, gap: 6 }, description: { fontSize: 15, lineHeight: 23 }, button: { flexDirection: 'row', gap: 8, padding: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#287457' } });
