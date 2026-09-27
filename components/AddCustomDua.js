import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useDua } from '../contexts/DuaContext';
import { PageHeader } from './ScreenUI';

export default function AddCustomDua({ route, navigation, themeColors, language }) {
  const t = themeColors || route.params.themeColors;
  const ar = (language || route.params.language) === 'ar';
  const { onAddCustomDua, hydrated, storageError } = useDua();
  const [form, setForm] = useState({ title: '', titleAr: '', arabic: '', transliteration: '', translation: '' });
  const [error, setError] = useState('');
  const save = () => {
    if (!hydrated) return;
    if (!form.title.trim() || ![form.arabic, form.translation].some(text => text.trim())) { setError(ar ? 'أضف عنواناً ونص الدعاء.' : 'Add a title and your Dua in Arabic or English.'); return; }
    const value = Object.fromEntries(Object.entries(form).map(([key, text]) => [key, text.trim()]));
    onAddCustomDua({ ...value, ...(ar ? { titleAr: value.title, translationAr: value.translation } : {}) });
    navigation.popTo('DuasHome', { showSaved: true });
  };
  const fields = [
    ['title', ar ? 'العنوان' : 'Title', ar ? 'اسم يسهل تذكره' : 'A name you will remember', false],
    ['arabic', ar ? 'نص الدعاء بالعربية' : 'Arabic Dua', ar ? 'اكتب دعاءك…' : 'Write or paste the Arabic…', true],
    ['translation', ar ? 'المعنى أو الدعاء بلغتك' : 'Meaning or your own words', ar ? 'اكتب دعاءك بلغتك…' : 'Write your Dua in your own words…', true],
    ['transliteration', ar ? 'النطق · اختياري' : 'Pronunciation · optional', ar ? 'النطق بالحروف اللاتينية' : 'Transliteration, if helpful', true],
  ];
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.backgroundColor }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <PageHeader title={ar ? 'إضافة دعاء' : 'Add a Dua'} subtitle={ar ? 'كلماتك، قريبة منك' : 'Keep your own words close'} onBack={() => navigation.goBack()} theme={t} />
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.form}>
      {fields.map(([key, label, placeholder, multiline]) => <View key={key} style={{ gap: 8 }}><Text style={{ color: t.textColor, fontSize: 14, fontWeight: '600' }}>{label}</Text><TextInput accessibilityLabel={label} value={form[key]} onChangeText={value => setForm(old => ({ ...old, [key]: value }))} placeholder={placeholder} placeholderTextColor={t.secondaryTextColor} multiline={multiline} textAlignVertical="top" style={[styles.input, { minHeight: multiline ? 94 : 48, color: t.textColor, borderColor: t.separatorColor, backgroundColor: t.cardColor }, key === 'arabic' && { fontFamily: 'Amiri', fontSize: 20, lineHeight: 32, textAlign: 'right', writingDirection: 'rtl' }]} /></View>)}
      {!!(error || storageError) && <Text accessibilityRole="alert" style={{ color: t.errorColor }}>{error || storageError}</Text>}
      <TouchableOpacity accessibilityRole="button" disabled={!hydrated} onPress={save} style={[styles.save, { backgroundColor: '#287457', opacity: hydrated ? 1 : 0.5 }]}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{ar ? 'حفظ في أدعيتي' : 'Save to My Duas'}</Text></TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ form: { paddingHorizontal: 22, paddingBottom: 32, gap: 20 }, input: { borderRadius: 16, borderWidth: 1, padding: 15, fontSize: 14, lineHeight: 22 }, save: { padding: 17, borderRadius: 16, alignItems: 'center', marginTop: 4 } });
