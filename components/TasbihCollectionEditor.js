import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OptionSheet, ui } from './ScreenUI';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const digits = text => text.replace(/[٠-٩۰-۹]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.includes(digit) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
export default function TasbihCollectionEditor({ value, library, theme: t, language, onClose, onSave, onDelete }) {
  const ar = language === 'ar';
  const [name, setName] = useState(ar ? value?.titleAr || value?.title || '' : value?.title || '');
  const [items, setItems] = useState(() => (value?.items || []).map(item => ({ ...item, target: String(item.target) })));
  const [added, setAdded] = useState({});
  const [panel, setPanel] = useState('edit');
  const [query, setQuery] = useState('');
  const [own, setOwn] = useState(''), [meaning, setMeaning] = useState(''), [target, setTarget] = useState('33');
  const all = { ...library, ...added };
  const validTarget = text => /^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= 1000000;
  const valid = name.trim() && items.length && items.every(item => validTarget(item.target));
  const input = { backgroundColor: t.inputBackground, color: t.textColor, borderRadius: 13, padding: 13, fontSize: 15 };
  const label = { color: t.textColor, fontSize: 14, fontWeight: '600' };
  const toggle = id => setItems(old => old.some(item => item.dhikr === id) ? old.filter(item => item.dhikr !== id) : [...old, { id: uid(), dhikr: id, ar: all[id].ar, en: all[id].en, target: String(all[id].goal || 1) }]);
  const move = (index, offset) => setItems(old => { const targetIndex = index + offset; if (targetIndex < 0 || targetIndex >= old.length) return old; const next = [...old]; [next[index], next[targetIndex]] = [next[targetIndex], next[index]]; return next; });
  const save = () => {
    if (!valid) return;
    onSave({ ...value, id: value?.id || `collection-${uid()}`, title: ar ? value?.title || name.trim() : name.trim(), titleAr: ar ? name.trim() : value?.titleAr || name.trim(), items: items.map(item => ({ ...item, target: Number(item.target) })) }, added);
  };
  return <OptionSheet visible title={panel === 'pick' ? (ar ? 'اختر الأذكار' : 'Select Adhkar') : panel === 'own' ? (ar ? 'ذكر جديد' : 'Add your own dhikr') : value ? (ar ? 'تعديل المجموعة' : 'Edit collection') : (ar ? 'مجموعة جديدة' : 'New collection')} theme={t} onClose={onClose}>
    {panel === 'edit' ? <>
      <Text style={label}>{ar ? 'اسم المجموعة' : 'Collection name'}</Text><TextInput accessibilityLabel="Collection name" value={name} onChangeText={setName} placeholder={ar ? 'مثل: أذكار الصباح' : 'e.g. After Prayer'} placeholderTextColor={t.secondaryTextColor} style={input} />
      <Text style={{ color: t.secondaryTextColor, fontSize: 12, lineHeight: 19 }}>{ar ? 'اختر الترتيب وحدد عدد التكرارات لكل ذكر.' : 'Choose the order and a target for each dhikr.'}</Text>
      {items.map((item, index) => <View key={item.id} style={{ padding: 13, borderRadius: 16, backgroundColor: t.inputBackground, gap: 9 }}>
        <Text numberOfLines={3} style={{ color: t.textColor, fontFamily: 'Amiri', fontSize: 21, lineHeight: 32, textAlign: 'right' }}>{item.ar}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ color: t.secondaryTextColor, fontSize: 12, flex: 1 }}>{ar ? 'الهدف' : 'Target'}</Text><TextInput accessibilityLabel={`Target for ${item.en || item.ar}`} keyboardType="number-pad" value={item.target} onChangeText={text => setItems(old => old.map((entry, i) => i === index ? { ...entry, target: digits(text) } : entry))} style={[input, { minWidth: 65, textAlign: 'center', borderWidth: 1, borderColor: validTarget(item.target) ? t.separatorColor : t.errorColor }]} />
          {[[-1, 'arrow-up'], [1, 'arrow-down']].map(([offset, icon]) => <TouchableOpacity key={icon} accessibilityLabel={offset < 0 ? 'Move earlier' : 'Move later'} onPress={() => move(index, offset)} style={ui.icon}><Ionicons name={icon} size={18} color={t.textColor} /></TouchableOpacity>)}
          <TouchableOpacity accessibilityLabel="Remove from collection" onPress={() => setItems(old => old.filter(entry => entry.id !== item.id))} style={ui.icon}><Ionicons name="close" size={21} color={t.secondaryTextColor} /></TouchableOpacity>
        </View>
      </View>)}
      <TouchableOpacity onPress={() => { setPanel('pick'); setQuery(''); }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Ionicons name="list-outline" size={21} color={t.activeTabColor} /><Text style={{ color: t.textColor }}>{ar ? 'اختيار أذكار موجودة' : 'Select existing Adhkar'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setPanel('own')} style={[ui.row, { backgroundColor: t.inputBackground }]}><Ionicons name="add" size={21} color={t.activeTabColor} /><Text style={{ color: t.textColor }}>{ar ? 'إضافة ذكر خاص' : 'Add your own dhikr'}</Text></TouchableOpacity>
      {!!value && <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{ar ? 'حفظ التعديلات يبدأ جولة جديدة لهذه المجموعة.' : 'Saving changes starts a fresh round for this collection.'}</Text>}
      <TouchableOpacity disabled={!valid} onPress={save} style={[ui.primary, { opacity: valid ? 1 : 0.45 }]}><Text style={{ color: '#fff', fontWeight: '600' }}>{ar ? 'حفظ المجموعة' : 'Save collection'}</Text></TouchableOpacity>
      {!!value && !value.preset && <TouchableOpacity onPress={() => Alert.alert(ar ? 'حذف المجموعة؟' : 'Delete this collection?', ar ? 'ستبقى أذكارك في القائمة.' : 'Your Adhkar will stay in your library.', [{ text: ar ? 'إلغاء' : 'Cancel', style: 'cancel' }, { text: ar ? 'حذف' : 'Delete', style: 'destructive', onPress: () => onDelete(value.id) }])} style={{ padding: 12, alignItems: 'center' }}><Text style={{ color: t.errorColor }}>{ar ? 'حذف المجموعة' : 'Delete collection'}</Text></TouchableOpacity>}
    </> : panel === 'pick' ? <>
      <TouchableOpacity onPress={() => setPanel('edit')} style={ui.primary}><Text style={{ color: '#fff', fontWeight: '600' }}>{ar ? 'تم' : 'Done'} · {items.length}</Text></TouchableOpacity>
      <TextInput accessibilityLabel="Search Adhkar for collection" placeholder={ar ? 'ابحث…' : 'Search Adhkar…'} placeholderTextColor={t.secondaryTextColor} value={query} onChangeText={setQuery} style={input} />
      {Object.entries(all).filter(([, item]) => `${item.ar} ${item.en}`.toLowerCase().replace(/[\u064B-\u065F]/g, '').includes(query.toLowerCase().replace(/[\u064B-\u065F]/g, ''))).map(([id, item]) => <TouchableOpacity key={id} accessibilityRole="checkbox" accessibilityState={{ checked: items.some(entry => entry.dhikr === id) }} onPress={() => toggle(id)} style={[ui.row, { backgroundColor: t.inputBackground }]}><Ionicons name={items.some(entry => entry.dhikr === id) ? 'checkbox' : 'square-outline'} color={t.activeTabColor} size={22} /><View style={{ flex: 1, gap: 5 }}><Text style={{ color: t.textColor, fontFamily: 'Amiri', fontSize: 21, lineHeight: 32, textAlign: 'right' }}>{item.ar}</Text>{!ar && <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{item.en}</Text>}</View></TouchableOpacity>)}
    </> : <>
      <TextInput accessibilityLabel="Custom dhikr words" multiline value={own} onChangeText={setOwn} placeholder={ar ? 'اكتب الذكر…' : 'Write your dhikr…'} placeholderTextColor={t.secondaryTextColor} style={[input, { minHeight: 100, textAlignVertical: 'top' }]} />
      <TextInput accessibilityLabel="Custom dhikr meaning" value={meaning} onChangeText={setMeaning} placeholder={ar ? 'المعنى · اختياري' : 'Meaning · optional'} placeholderTextColor={t.secondaryTextColor} style={input} />
      <Text style={label}>{ar ? 'عدد التكرارات' : 'Target count'}</Text><TextInput accessibilityLabel="Custom dhikr target" keyboardType="number-pad" value={target} onChangeText={text => setTarget(digits(text))} style={input} />
      <TouchableOpacity disabled={!own.trim() || !validTarget(target)} onPress={() => { const id = `custom-${uid()}`, dhikr = { ar: own.trim(), en: meaning.trim(), count: 0, goal: Number(target) }; setAdded(old => ({ ...old, [id]: dhikr })); setItems(old => [...old, { id: uid(), dhikr: id, ar: dhikr.ar, en: dhikr.en, target }]); setOwn(''); setMeaning(''); setPanel('edit'); }} style={[ui.primary, { opacity: own.trim() && validTarget(target) ? 1 : 0.45 }]}><Text style={{ color: '#fff', fontWeight: '600' }}>{ar ? 'أضف إلى المجموعة' : 'Add to collection'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setPanel('edit')} style={{ padding: 12, alignItems: 'center' }}><Text style={{ color: t.secondaryTextColor }}>{ar ? 'رجوع' : 'Back to collection'}</Text></TouchableOpacity>
    </>}
  </OptionSheet>;
}
