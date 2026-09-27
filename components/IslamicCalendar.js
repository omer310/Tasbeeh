import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calendarKey, calendarMonth, loadCalendarMonth } from '../services/CalendarService';
import useLocalDay from '../hooks/useLocalDay';
import { eventsForDay, upcomingEvents, countdownLabel } from '../utils/calendarEvents';
import { PageHeader, IconButton } from './ScreenUI';
import { calendarWeekday, shiftCalendarMonth } from '../utils/calendarDates';

export default function IslamicCalendar({ themeColors: t, language = 'en' }) {
  const today = useLocalDay();
  const [calendarRevision, setCalendarRevision] = useState(0);
  const [month, setMonth] = useState(() => new Date());
  const key = calendarKey(month);
  const [loaded, setLoaded] = useState(() => ({ key, days: calendarMonth(month) }));
  const data = loaded.key === key ? loaded.days : calendarMonth(month);
  const [slide] = useState(() => new Animated.Value(0));
  const [selected, setSelected] = useState(new Date().getDate());
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const ar = language === 'ar', locale = ar ? 'ar' : 'en';
  const number = n => Number(n).toLocaleString(locale, { useGrouping: false });
  useEffect(() => {
    let active = true;
    setError('');
    const [year, monthNumber] = key.split('-').map(Number);
    const date = new Date(year, monthNumber - 1, 1);
    loadCalendarMonth(date).then(days => {
      if (active) setLoaded({ key, days });
      for (const offset of [-1, 1]) loadCalendarMonth(shiftCalendarMonth(date, offset)).then(() => { if (active) setCalendarRevision(value => value + 1); }).catch(() => {});
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [key, retry]);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    // Yield between months so the offline Hijri conversion does not block the
    // first calendar frame or a tap while the upcoming year is prepared.
    let offset = 0, timer;
    const days = [];
    const collect = () => {
      days.push(...calendarMonth(shiftCalendarMonth(today, offset++)));
      if (offset < 14) timer = setTimeout(collect, 0);
      else setEvents(upcomingEvents(days, today));
    };
    timer = setTimeout(collect, 0);
    return () => clearTimeout(timer);
  }, [today, loaded, calendarRevision]);
  const chosen = data.find(day => Number(day.gregorian.day) === selected);
  const cells = data.length ? [...Array(calendarWeekday(data[0].gregorian.date)).fill(null), ...data] : [];
  while (cells.length < 42) cells.push(null);
  const navigate = offset => { slide.setValue(offset * 16); setMonth(value => shiftCalendarMonth(value, offset)); setSelected(1); Animated.spring(slide, { toValue: 0, damping: 24, stiffness: 250, useNativeDriver: true }).start(); };
  const chosenEvents = eventsForDay(chosen?.hijri);
  return <View style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <PageHeader title={ar ? 'التقويم' : 'Calendar'} subtitle={ar ? 'الأيام التي تجمعنا' : 'Days to remember'} theme={t}><IconButton name="today-outline" label="Go to today" theme={t} onPress={() => { setMonth(new Date()); setSelected(new Date().getDate()); }} /></PageHeader>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.dateCard, { backgroundColor: t.isDark ? '#243A2F' : '#EDF4EB' }]}><Ionicons name="moon-outline" color={t.activeTabColor} size={25} /><View style={{ flex: 1, gap: 5 }}><Text style={{ color: t.textColor, fontSize: 21, fontWeight: '600' }}>{chosen ? `${number(chosen.hijri.day)} ${chosen.hijri.month[ar ? 'ar' : 'en']} ${number(chosen.hijri.year)} ${ar ? 'هـ' : 'AH'}` : month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 13 }}>{new Date(month.getFullYear(), month.getMonth(), selected).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text></View></View>
      {!!chosenEvents.length && <View style={[styles.occasion, { backgroundColor: t.inputBackground }]}><Ionicons name="sparkles-outline" size={18} color={t.activeTabColor} /><Text style={{ color: t.textColor, flex: 1 }}>{chosenEvents.map(event => ar ? event.ar : event.en).join(' · ')}</Text></View>}
      <View style={[styles.calendar, { backgroundColor: t.cardColor, borderColor: t.separatorColor }]}>
        <View style={styles.month}><IconButton name="chevron-back" label="Previous month" theme={t} onPress={() => navigate(-1)} /><Text style={{ color: t.textColor, fontWeight: '600', fontSize: 17 }}>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text><IconButton name="chevron-forward" label="Next month" theme={t} onPress={() => navigate(1)} /></View>
        <View style={styles.week}>{(ar ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map((day, i) => <Text key={i} style={{ flex: 1, color: i === 5 ? t.activeTabColor : t.secondaryTextColor, textAlign: 'center', fontSize: ar ? 16 : 12, lineHeight: 22, paddingVertical: 10 }}>{day}</Text>)}</View>
        <Animated.View style={{ transform: [{ translateX: slide }] }}>{Array.from({ length: cells.length / 7 }, (_, row) => <View style={styles.week} key={row}>{cells.slice(row * 7, row * 7 + 7).map((day, column) => {
          if (!day) return <View key={column} style={styles.cell} />;
          const d = Number(day.gregorian.day), active = d === selected, occasions = eventsForDay(day.hijri);
          const isToday = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && today.getDate() === d;
          return <TouchableOpacity key={column} accessibilityRole="button" accessibilityLabel={`${day.gregorian.day} ${day.gregorian.month.en}${occasions.length ? `. ${occasions.map(event => ar ? event.ar : event.en).join(', ')}` : ''}`} accessibilityState={{ selected: active }} onPress={() => setSelected(d)} style={[styles.cell, { backgroundColor: active ? '#287457' : occasions.length ? t.inputBackground : 'transparent', borderColor: isToday ? t.activeTabColor : 'transparent', borderWidth: 1 }]}><Text style={{ color: active ? '#fff' : t.textColor, fontSize: ar ? 18 : 15, fontWeight: '600' }}>{number(d)}</Text><Text style={{ color: active ? '#E0EEDB' : t.secondaryTextColor, fontSize: ar ? 13 : 10, lineHeight: 17 }}>{number(day.hijri.day)}</Text>{!!occasions.length && <View style={[styles.eventDot, { backgroundColor: active ? '#fff' : t.activeTabColor }]} />}</TouchableOpacity>;
        })}</View>)}</Animated.View>
        <View style={styles.legend}><View style={[styles.dot, { backgroundColor: t.activeTabColor }]} /><Text style={{ color: t.secondaryTextColor, fontSize: 11 }}>{ar ? 'مناسبة إسلامية' : 'Islamic occasion'}</Text></View>
        {!!error && <TouchableOpacity onPress={() => setRetry(n => n + 1)} style={{ padding: 8 }}><Text style={{ color: t.secondaryTextColor, fontSize: 11, textAlign: 'center' }}>{ar ? 'التقويم متاح دون اتصال · تحديث' : 'Offline calendar · Retry update'}</Text></TouchableOpacity>}
      </View>
      <View style={{ gap: 5 }}><Text style={{ color: t.textColor, fontSize: 19, fontWeight: '700' }}>{ar ? 'المناسبات القادمة' : 'Coming up'}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12, lineHeight: 19 }}>{ar ? 'قد تختلف التواريخ حسب رؤية الهلال محلياً.' : 'Dates may vary with local moon sighting.'}</Text></View>
      {events.map(event => <TouchableOpacity key={event.key} onPress={() => { const date = event.date; setMonth(date); setSelected(date.getDate()); }} style={[styles.event, { backgroundColor: t.cardColor, borderColor: t.separatorColor }]}><View style={[styles.eventDate, { backgroundColor: t.inputBackground }]}><Text style={{ color: t.activeTabColor, fontSize: 20, fontWeight: '600' }}>{number(event.date.getDate())}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 10 }}>{event.date.toLocaleDateString(locale, { month: 'short' })}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={{ color: t.textColor, fontSize: ar ? 18 : 15, fontWeight: '600' }}>{ar ? event.ar : event.en}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{event.date.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}</Text><Text style={{ color: t.activeTabColor, fontSize: 13, fontWeight: '600' }}>{countdownLabel(event.remaining, language)}</Text></View><Ionicons name="chevron-forward" size={17} color={t.secondaryTextColor} /></TouchableOpacity>)}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({ occasion: { padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 10 }, dot: { width: 5, height: 5, borderRadius: 3 }, eventDot: { position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: 3 }, content: { flexGrow: 1, width: '100%', paddingHorizontal: 20, gap: 14, paddingBottom: 20 }, dateCard: { padding: 20, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 16 }, calendar: { width: '100%', alignSelf: 'stretch', padding: 10, borderRadius: 22, borderWidth: 1, marginBottom: 10 }, month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, week: { width: '100%', flexDirection: 'row' }, cell: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, marginVertical: 2 }, event: { padding: 15, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }, eventDate: { width: 50, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 2 } });
