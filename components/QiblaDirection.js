import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing, 
  TouchableOpacity, 
  Dimensions,
  Vibration,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PageHeader, IconButton } from './ScreenUI';
import { detectPrayerLocation } from '../services/PrayerLocationService';
import { withTimeout } from '../utils/withTimeout';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InstructionsModal from './InstructionsModal';
import CompassCalibrationSheet from './CompassCalibrationSheet';
import CompassArtwork, { KAABA_ARTWORK_ANGLE } from './CompassArtwork';
import AsyncStorage from '@react-native-async-storage/async-storage';

// First, define the defaultTheme outside the component
const defaultTheme = {
  backgroundColor: '#ffffff',
  textColor: '#064e3b',
  primaryColor: '#059669',
  accentColor: '#10b981',
  errorColor: '#ef4444'
};

// Constants
const INSTRUCTIONS_SHOWN_KEY = 'qibla_instructions_shown';
const QIBLA_ALIGNMENT_THRESHOLD = 5;
const NEAR_ALIGNMENT_THRESHOLD = 15;
const COMPASS_SMOOTHING_FACTOR = 0.1; // Adjust this value between 0.1 and 0.3 for different smoothing levels

// Add these new translations to your translations object
const translations = {
  qiblaDirection: { 
    en: 'Qibla Direction', 
    ar: 'اتجاه القبلة' 
  },
  calculating: { en: 'Calculating...', ar: 'جاري الحساب...' },
  facingQibla: { en: 'You are facing the Qibla', ar: 'أنت تواجه القبلة' },
  turnSlightlyRight: { en: 'Turn slightly to the right', ar: 'انعطف قليلاً إلى اليمين' },
  turnSlightlyLeft: { en: 'Turn slightly to the left', ar: 'انعطف قليلاً إلى اليسار' },
  turnRight: { en: 'Turn to the right', ar: 'انعطف إلى اليمين' },
  turnLeft: { en: 'Turn to the left', ar: 'انعطف إلى اليسار' },
  compassAccuracy: { en: 'Compass Accuracy', ar: 'دقة البوصلة' },
  unknown: { en: 'Unknown', ar: 'غير معروف' },
  calibrationNeeded: { en: 'Compass Calibration Needed', ar: 'يلزم معايرة البوصلة' },
  calibrationMessage: { 
    en: 'To calibrate your compass:\n\n1. Move away from electronic devices and metal objects.\n2. Hold your device flat and level.\n3. Move your device in a figure-eight pattern several times.\n4. Rotate your device slowly in all directions.',
    ar: 'لمعايرة البوصلة:\n\n1. ابتعد عن الأجهزة الإلكترونية والأجسام المعدنية.\n2. امسك جهازك بشكل مستوٍ وأفقي.\n3. حرك جهازك في نمط على شكل رقم 8 عدة مرات.\n4. قم بتدوير جهازك ببطء في جميع الاتجاهات.'
  },
  lowAccuracy: { en: 'Low Accuracy', ar: 'دقة منخفضة' },
  tapToCalibrate: { en: 'Tap to calibrate', ar: 'انقر للمعايرة' },
  startGuide: {
    en: 'Start Finding Qibla',
    ar: 'ابدأ في البحث عن القبلة'
  },
  accuracy: {
    en: 'Accuracy',
    ar: 'الدقة'
  },
  aligned: {
    en: 'Aligned with Qibla!',
    ar: 'مه نحو القبلة!'
  },
  gettingClose: {
    en: 'Getting Close...',
    ar: 'تقترب...'
  },
  turnToYourLeft: {
    en: 'Turn to your left',
    ar: 'انعطف إلى اليسار'
  },
  turnToYourRight: {
    en: 'Turn to your right',
    ar: 'انعطف إلى اليمين'
  },
  youAreFacingMakkah: {
    en: "You're facing Makkah",
    ar: 'أنت تواجه مكة'
  },
  startCalibration: {
    en: 'Start Calibration',
    ar: 'بدء المعايرة'
  },
  later: {
    en: 'Later',
    ar: 'لاحقاً'
  },
  accuracyLow: {
    en: 'Compass accuracy is low',
    ar: 'دقة البوصلة منخفضة'
  },
  facingPrefix: {
    en: "You're facing ",
    ar: 'أنت تواجه '
  },
  makkah: {
    en: "Makkah",
    ar: 'مكة'
  },
  turnToYour: {
    en: "Turn to your ",
    ar: 'انعطف إلى '
  },
  right: {
    en: "right",
    ar: 'اليمين'
  },
  left: {
    en: "left",
    ar: 'اليسار'
  }
};

export default function QiblaDirection({ themeColors = defaultTheme, language = 'en' }) {
  // State declarations
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [error, setError] = useState(null);
  const [headingAccuracy, setHeadingAccuracy] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isQiblaAligned, setIsQiblaAligned] = useState(false);
  const [rotationAnimation] = useState(() => new Animated.Value(0));
  const smoothedHeading = useRef(0);
  const [showCalibrationOverlay, setShowCalibrationOverlay] = useState(false);
  const [calibrationReady, setCalibrationReady] = useState(false);
  const quality = useRef({ goodSince: 0, lowSince: 0, goodSamples: 0, prompted: false });

  const getTranslatedText = (key) => {
    return translations[key][language] || key;
  };

  const bearing = useRef(null);
  useFocusEffect(useCallback(() => {
    let active = true, headingSubscription;
    quality.current = { goodSince: 0, lowSince: 0, goodSamples: 0, prompted: false };
    async function setup() {
      if (Platform.OS === 'web') { setError('The live compass is available in the mobile app.'); return; }
      try {
        setError(null);
        const coords = await detectPrayerLocation();
        const response = await withTimeout(fetch(`https://api.aladhan.com/v1/qibla/${coords.latitude}/${coords.longitude}`), 12000, 'Could not calculate Qibla. Check your connection.');
        const data = await response.json();
        if (!Number.isFinite(data.data?.direction)) throw new Error('Qibla direction is unavailable.');
        if (!active) return;
        bearing.current = data.data.direction; setQiblaDirection(bearing.current);
        headingSubscription = await Location.watchHeadingAsync(heading => {
          if (!active) return;
          const value = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
          setCompassHeading(value); setHeadingAccuracy(heading.accuracy);
          const now = Date.now(), q = quality.current;
          if (heading.accuracy >= 3) {
            q.lowSince = 0; q.goodSince ||= now; q.goodSamples++;
            if (now - q.goodSince >= 2500 && q.goodSamples >= 3) setCalibrationReady(true);
          } else {
            q.goodSince = 0; q.goodSamples = 0; if (heading.accuracy < 2) q.lowSince ||= now; else q.lowSince = 0; setCalibrationReady(false);
            if (q.lowSince && now - q.lowSince >= 2500 && !q.prompted) { q.prompted = true; setShowInstructions(false); setShowCalibrationOverlay(true); }
          }
          const rotation = (360 - value) % 360;
          const delta = ((rotation - smoothedHeading.current + 540) % 360 + 360) % 360 - 180;
          smoothedHeading.current += delta * COMPASS_SMOOTHING_FACTOR;
          Animated.timing(rotationAnimation, { toValue: smoothedHeading.current, duration: 80, useNativeDriver: true, easing: Easing.linear }).start();
        });
        if (!active) headingSubscription.remove();
      } catch (e) { if (active) setError(e.message || 'Could not access the compass.'); }
    }
    setup();
    return () => { active = false; headingSubscription?.remove(); rotationAnimation.stopAnimation(); };
  }, [rotationAnimation]));

  // Enhanced Qibla alignment feedback
  useEffect(() => {
    if (qiblaDirection != null) {
      // Calculate the actual angle difference between current heading and Qibla direction
      let angleDifference = ((qiblaDirection - compassHeading + 360) % 360);
      
      // Normalize the angle difference to -180 to +180 range
      if (angleDifference > 180) {
        angleDifference -= 360;
      }
      
      // Check if we're actually facing the Qibla
      const isAligned = headingAccuracy >= 2 && Math.abs(angleDifference) < QIBLA_ALIGNMENT_THRESHOLD;
      
      setIsQiblaAligned(isAligned);
      
      if (isAligned && !isQiblaAligned) {
        Vibration.vibrate([0, 100, 50, 100]);
      }
    }
  }, [qiblaDirection, compassHeading, headingAccuracy, isQiblaAligned]);

  useEffect(() => {
    checkFirstTimeUser();
  }, []);

  async function checkFirstTimeUser() {
    try {
      const hasShownInstructions = await AsyncStorage.getItem(INSTRUCTIONS_SHOWN_KEY);
      if (!hasShownInstructions) {
        setShowInstructions(true);
        await AsyncStorage.setItem(INSTRUCTIONS_SHOWN_KEY, 'true');
      }
    } catch (error) {
      console.error('Error checking first-time user:', error);
    }
  };

  // Enhanced Compass component with smoother animations
  const renderCompass = ({ rotation }) => {
    const { width } = Dimensions.get('window');
    const compassSize = width * 0.8;
    
    const angleDifference = qiblaDirection != null ?
      Math.abs(((qiblaDirection - compassHeading + 540) % 360) - 180) : 180;
    
    // Get the rim color for the compass
    const getCompassRimColor = () => {
      if (isQiblaAligned) {
        return '#10b981'; // Green when aligned
      } else if (angleDifference < NEAR_ALIGNMENT_THRESHOLD) {
        return '#34d399'; // Light green when getting closer
      } else if (angleDifference < 45) {
        return '#fbbf24'; // Yellow when somewhat off
      } else {
        return '#ef4444'; // Red when far off
      }
    };

    return (
      <View style={[styles.compassWrapper, { width: compassSize, height: compassSize }]}>
        <BlurView
          intensity={0}
          style={[StyleSheet.absoluteFill, styles.blurView]}
          tint={themeColors.isDark ? 'dark' : 'light'}
        />
        
        <Animated.View
          style={[
            styles.compassRotation,
            {
              width: compassSize,
              height: compassSize,
              borderColor: getCompassRimColor(),
              borderWidth: 20,
              borderRadius: 999,
              backgroundColor: themeColors.isDark ? '#17231D' : '#F6F8EF',
            },
          ]}
        >
          <Animated.View style={{ position: 'absolute', transform: [{ rotate: rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend' }) }] }}><CompassArtwork size={(compassSize - 40) * 0.92} dark={themeColors.isDark} /></Animated.View>
          <Animated.View style={{ position: 'absolute', transform: [{ rotate: rotation.interpolate({ inputRange: [0, 360], outputRange: [`${(qiblaDirection || 0) - KAABA_ARTWORK_ANGLE}deg`, `${360 + (qiblaDirection || 0) - KAABA_ARTWORK_ANGLE}deg`], extrapolate: 'extend' }) }] }}><CompassArtwork size={(compassSize - 40) * 0.92} dark={themeColors.isDark} markerOnly /></Animated.View>
        </Animated.View>

        <View style={styles.centerTextContainer}>
          {headingAccuracy != null && headingAccuracy < 2 && (
            <TouchableOpacity 
              style={[styles.calibrateButton, { backgroundColor: themeColors.primaryColor }]}
              onPress={() => setShowCalibrationOverlay(true)}
            >
              <Text style={styles.calibrateText}>
                {getTranslatedText('tapToCalibrate')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.northIndicator, { top: -55 }]}>
          <MaterialCommunityIcons 
            name="navigation" 
            size={44} 
            color={isQiblaAligned ? '#10b981' : themeColors.primaryColor} 
          />
        </View>
      </View>
    );
  };

  // Update the DirectionIndicator component
  const renderDirectionIndicator = () => {
    const getIndicatorContent = () => {
      if (isQiblaAligned) {
        return {
          prefix: getTranslatedText('facingPrefix'),
          highlight: getTranslatedText('makkah'),
        };
      }
      
      const turnDirection = ((qiblaDirection - compassHeading + 360) % 360) > 180 ? "left" : "right";
      
      return {
        prefix: getTranslatedText('turnToYour'),
        highlight: getTranslatedText(turnDirection),
      };
    };

    const content = getIndicatorContent();

    return (
      <View style={directionStyles.container}>
        <Text style={directionStyles.text}>
          <Text style={[directionStyles.prefix, { color: themeColors.textColor }]}>
            {content.prefix}
          </Text>
          <Text style={[directionStyles.highlight, { color: themeColors.primaryColor }]}>
            {content.highlight}
          </Text>
        </Text>
      </View>
    );
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: themeColors.backgroundColor }}>
    <PageHeader title={language === 'ar' ? 'القبلة' : 'Qibla'} subtitle={language === 'ar' ? 'لحظة للسكينة' : 'Find your direction'} theme={themeColors}><IconButton name="information-circle-outline" label="Compass instructions" color={themeColors.textColor} onPress={() => setShowInstructions(true)} /></PageHeader>
    <View style={{ flex: 1, alignItems: 'center', paddingBottom: 104, paddingTop: 8 }}>
      <View style={{ paddingHorizontal: 25, alignItems: 'center', gap: 10 }}>
        {error ? <Text style={[styles.error, { color: themeColors.textColor }]}>{error}</Text> : qiblaDirection == null ? <Text style={{ color: themeColors.secondaryTextColor }}>{getTranslatedText('calculating')}</Text> : renderDirectionIndicator()}
        <Text style={{ color: themeColors.secondaryTextColor, fontSize: 13, textAlign: 'center', lineHeight: 21 }}>{language === 'ar' ? 'أمسك هاتفك بشكل مستوٍ وبعيداً عن المعادن' : 'Hold your phone flat, away from metal objects'}</Text>
      </View>
      {!error && renderCompass({ rotation: rotationAnimation })}
      <View style={{ alignItems: 'center', gap: 10, paddingBottom: 16 }}>
        {qiblaDirection != null && <Text style={{ color: themeColors.textColor, fontSize: 15, fontWeight: '600' }}>{Math.round(qiblaDirection)}° · {language === 'ar' ? 'نحو مكة' : 'toward Makkah'}</Text>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Calibrate compass" onPress={() => setShowCalibrationOverlay(true)} style={{ paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, backgroundColor: themeColors.inputBackground }}><Text style={{ color: themeColors.activeTabColor }}>{language === 'ar' ? 'معايرة البوصلة' : 'Calibrate compass'}</Text></TouchableOpacity>
      </View>
    </View>
    <InstructionsModal visible={showInstructions && !showCalibrationOverlay} onClose={() => setShowInstructions(false)} themeColors={themeColors} language={language} />
    <CompassCalibrationSheet visible={showCalibrationOverlay} ready={calibrationReady} accuracy={headingAccuracy} onClose={() => setShowCalibrationOverlay(false)} theme={themeColors} language={language} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Adjusted for status bar
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 999,
    overflow: 'visible',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  compassRotation: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  compass: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
    borderRadius: 999,
  },
  compassAligned: {
    opacity: 1,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  northIndicator: {
    position: 'absolute',
    top: -55,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }],
    zIndex: 3,
  },
  calibratingCompass: {
    opacity: 0.5,
  },
  calibrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  calibrationText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  accuracyIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  calibrateButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  calibrateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 20,
    marginLeft: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    left: -10,
    top: -20,
  },
  blurView: {
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  calibrationOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calibrationContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calibrationTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  calibrationInstructions: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  calibrationButtons: {
    width: '100%',
    gap: 12,
  },
  calibrationButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  calibrationButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrationButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '500',
  },
});

// Separate styles for the direction indicator
const directionStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  text: { fontSize: 25, textAlign: 'center', lineHeight: 34 },
  prefix: { fontSize: 25, fontWeight: '400' },
  highlight: { fontSize: 25, fontWeight: '700' },
});
