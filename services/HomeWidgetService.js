import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { prayerWidgetSnapshot } from '../utils/homeWidgets';

const native = Platform.OS === 'android' ? requireOptionalNativeModule('HomeWidgets') : null;
export const homeWidgetsAvailable = Boolean(native);
let writes = Promise.resolve();
export function syncPrayerWidget(settings, days) {
  if (!native) return Promise.resolve();
  const snapshot = prayerWidgetSnapshot(settings, days);
  writes = writes.catch(() => {}).then(() => native.setPrayerData(JSON.stringify(snapshot)));
  return writes;
}
export async function syncWidgetAppearance(language, appearance) {
  await native?.setAppearance(language, appearance);
}
export async function addHomeWidget(kind) {
  if (!native) return false;
  return native.addWidget(kind);
}
