import { Alert } from 'react-native';
import { useDua } from '../contexts/DuaContext';

export default function useDeleteCustomDua(language) {
  const { hydrated, onDeleteCustomDua } = useDua();
  const ar = language === 'ar';
  return (dua, onDeleted) => {
    if (!hydrated || !dua?.isCustom) return;
    const title = ar ? dua.titleAr || dua.title : dua.title;
    Alert.alert(
      ar ? 'حذف الدعاء؟' : 'Delete this Dua?',
      ar ? `سيُحذف «${title}» وملاحظته الشخصية من أدعيتك. لا يمكن التراجع عن الحذف.`
        : `“${title}” and its personal note will be deleted from My Duas. This cannot be undone.`,
      [
        { text: ar ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: ar ? 'حذف' : 'Delete', style: 'destructive', onPress: () => {
          onDeleteCustomDua(dua.id);
          onDeleted?.();
        } },
      ],
    );
  };
}
