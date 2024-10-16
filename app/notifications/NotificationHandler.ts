import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { getSelectedAdhan } from '../utils/preferences'; // Assume this function exists to get the selected adhan

async function handleNotification(notification: Notifications.Notification) {
  // ... existing notification handling code ...

  // Play the adhan
  const selectedAdhan = await getSelectedAdhan();
  if (selectedAdhan) {
    try {
      const { sound } = await Audio.Sound.createAsync(selectedAdhan);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing adhan:', error);
    }
  }

  // ... rest of the notification handling code ...
}