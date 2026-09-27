import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { withTimeout } from '../utils/withTimeout';
import { locationLabel } from '../utils/locationLabel';
import AsyncStorage from '@react-native-async-storage/async-storage';

let pendingLocation;
export async function describePrayerLocation(coords) {
  const key = `locationName:${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;
  const cached = await AsyncStorage.getItem(key).catch(() => null);
  if (cached) return cached;
  const addresses = await withTimeout(Location.reverseGeocodeAsync(coords), 4000, 'Address lookup timed out.').catch(() => []);
  const label = locationLabel(addresses[0]);
  if (label) await AsyncStorage.setItem(key, label).catch(() => {});
  return label || 'Current location';
}
export function detectPrayerLocation() {
  if (pendingLocation) return pendingLocation;
  pendingLocation = (async () => {
    if (Platform.OS === 'web') throw new Error('Choose a city and country to load prayer times.');
    const permission = await withTimeout(Location.requestForegroundPermissionsAsync(), 20000,
      'Location permission is still pending. You can choose a city instead.');
    if (permission.status !== 'granted') throw new Error('Location access is off. Choose a city instead.');
    if (!await withTimeout(Location.hasServicesEnabledAsync(), 3000, 'Location services are unavailable.')) {
      throw new Error('Turn on your phone’s location services or choose a city.');
    }
    const recent = await withTimeout(Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000, requiredAccuracy: 10000 }),
      2500, 'No recent location available.').catch(() => null);
    if (recent) return recent.coords;
    const position = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      10000, 'Could not find your location. Choose a city, or retry with a clearer GPS signal.');
    return position.coords;
  })().finally(() => { pendingLocation = null; });
  return pendingLocation;
}
