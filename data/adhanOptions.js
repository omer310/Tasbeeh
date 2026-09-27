// Keep preference names stable: existing installations store these strings.
export const ADHAN_OPTIONS = [
  { name: 'None', icon: 'ban-outline' },
  { name: 'Silent', icon: 'volume-mute-outline' },
  { name: 'Vibrate', icon: 'phone-portrait-outline' },
  { name: 'Default notification sound', icon: 'notifications-outline' },
  { name: 'Adhan (Nureyn Mohammad)', country: 'Sudan', sound: require('../assets/adhan.mp3') },
  { name: 'Adhan (Sudan)', country: 'Sudan', sound: require('../assets/Sudanese Athan.mp3') },
  { name: 'Adhan (Madina)', country: 'Saudi Arabia', sound: require('../assets/madinah_adhan.mp3') },
  { name: 'Adhan (Makka)', country: 'Saudi Arabia', sound: require('../assets/makkah_adhan.mp3') },
  { name: 'Adhan (Mishary Alafasy)', country: 'Kuwait', sound: require('../modules/prayer-alarm/android/src/main/res/raw/prayer_alafasy.mp3') },
  { name: 'Adhan (Abdulbasit)', country: 'Egypt', sound: require('../modules/prayer-alarm/android/src/main/res/raw/prayer_abdulbasit.mp3') },
  { name: 'Adhan (Al-Aqsa)', country: 'Palestine', sound: require('../modules/prayer-alarm/android/src/main/res/raw/prayer_aqsa.mp3') },
  { name: 'Adhan (Turkey)', country: 'Turkey', sound: require('../modules/prayer-alarm/android/src/main/res/raw/prayer_turkey.mp3') },
  { name: 'Long beep', icon: 'alarm-outline', sound: require('../assets/long_beep.mp3') },
];
