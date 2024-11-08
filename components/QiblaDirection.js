import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ImageBackground, 
  Animated, 
  Easing, 
  Alert, 
  TouchableOpacity, 
  Dimensions,
  Vibration,
  Platform 
} from 'react-native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InstructionsModal from './InstructionsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

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

export default function QiblaDirection({ themeColors = defaultTheme, language = 'en' }) {
  // State declarations
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [headingAccuracy, setHeadingAccuracy] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isQiblaAligned, setIsQiblaAligned] = useState(false);
  const [firstTimeUser, setFirstTimeUser] = useState(true);
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  // Enhanced translations with more context
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
      ar: 'متجه نحو القبلة!'
    },
    gettingClose: {
      en: 'Getting Close...',
      ar: 'تقترب...'
    }
  };

  const getTranslatedText = (key) => {
    return translations[key][language] || key;
  };

  useEffect(() => {
    let headingSubscription;

    const setupCompass = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
        fetchQiblaDirection(location.coords.latitude, location.coords.longitude);

        headingSubscription = await Location.watchHeadingAsync((heading) => {
          const headingValue = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
          setCompassHeading(headingValue);
          setHeadingAccuracy(heading.accuracy);

          Animated.timing(rotationAnimation, {
            toValue: headingValue,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }).start();
        });
      } catch (err) {
        setError('Error accessing compass');
      }
    };

    setupCompass();
    return () => {
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  // Enhanced calibration check
  useEffect(() => {
    if (headingAccuracy > 15 && !isCalibrating) {
      showCalibrationAlert();
    }
  }, [headingAccuracy]);

  // Enhanced Qibla alignment feedback
  useEffect(() => {
    if (qiblaDirection && compassHeading) {
      const angleDifference = Math.abs(((qiblaDirection - compassHeading + 540) % 360) - 180);
      const isAligned = angleDifference < QIBLA_ALIGNMENT_THRESHOLD;
      const isNearlyAligned = angleDifference < NEAR_ALIGNMENT_THRESHOLD;
      
      setIsQiblaAligned(isAligned);
      
      if (isAligned) {
        // Vibrate in a success pattern when aligned
        Vibration.vibrate([0, 100, 50, 100]);
      }
    }
  }, [qiblaDirection, compassHeading]);

  useEffect(() => {
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const hasShownInstructions = await AsyncStorage.getItem(INSTRUCTIONS_SHOWN_KEY);
      if (!hasShownInstructions) {
        setShowInstructions(true);
        await AsyncStorage.setItem(INSTRUCTIONS_SHOWN_KEY, 'true');
      }
      setFirstTimeUser(false);
    } catch (error) {
      console.error('Error checking first-time user:', error);
    }
  };

  const showCalibrationAlert = () => {
    Alert.alert(
      getTranslatedText('calibrationNeeded'),
      getTranslatedText('calibrationMessage'),
      [
        {
          text: getTranslatedText('startCalibration'),
          onPress: startCalibration,
          style: 'default',
        },
        {
          text: getTranslatedText('later'),
          style: 'cancel',
        },
      ]
    );
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    // Simulate calibration process
    setTimeout(() => {
      setIsCalibrating(false);
    }, 10000);
  };

  const fetchQiblaDirection = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
      const data = await response.json();
      if (data.code === 200 && data.status === 'OK') {
        setQiblaDirection(data.data.direction);
      } else {
        setError('Failed to fetch Qibla direction');
      }
    } catch (error) {
      setError('Error fetching Qibla direction');
    }
  };

  // Enhanced Compass component with smoother animations
  const Compass = ({ rotation }) => {
    const { width } = Dimensions.get('window');
    const compassSize = width * 0.8;
    
    const angleDifference = qiblaDirection && compassHeading ? 
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
          tint="light"
        />
        
        <Animated.View
          style={[
            styles.compassRotation,
            {
              transform: [{ rotate: rotation }],
              width: compassSize,
              height: compassSize,
              borderColor: getCompassRimColor(),
              borderWidth: 20,
              borderRadius: 999,
            },
          ]}
        >
          <Image
            source={require('../assets/qibla-compass3.png')}
            style={[
              styles.compass,
              {
                width: '92%',
                height: '92%',
                alignSelf: 'center',
              },
              isCalibrating && styles.calibratingCompass,
              isQiblaAligned && styles.compassAligned
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.centerTextContainer}>
          <Text style={[styles.degrees, { color: themeColors.textColor }]}>
            {qiblaDirection ? `${qiblaDirection.toFixed(2)}°` : '--°'}
          </Text>
          <View style={styles.accuracyIndicator}>
            <Text style={[styles.accuracyText, { color: themeColors.textColor }]}>
              {`${getTranslatedText('accuracy')}: ${
                headingAccuracy ? `${headingAccuracy.toFixed(1)}°` : '--°'
              }`}
            </Text>
            {headingAccuracy > 15 && (
              <TouchableOpacity 
                style={[styles.calibrateButton, { backgroundColor: themeColors.primaryColor }]}
                onPress={showCalibrationAlert}
              >
                <Text style={styles.calibrateText}>
                  {getTranslatedText('tapToCalibrate')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
  const DirectionIndicator = ({ angleDifference, themeColors }) => {
    const getIndicatorContent = () => {
      if (isQiblaAligned) {
        return {
          icon: 'checkbox-marked-circle-outline',
          text: getTranslatedText('aligned'),
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.15)'
        };
      } else if (Math.abs(angleDifference) < NEAR_ALIGNMENT_THRESHOLD) {
        return {
          icon: 'target',
          text: getTranslatedText('gettingClose'),
          color: '#34d399',
          bgColor: 'rgba(52, 211, 153, 0.15)'
        };
      } else {
        const isRight = angleDifference > 0;
        return {
          icon: isRight ? 'rotate-right' : 'rotate-left',
          text: getTranslatedText(isRight ? 'turnRight' : 'turnLeft'),
          color: themeColors.primaryColor,
          bgColor: `${themeColors.primaryColor}15`
        };
      }
    };

    const content = getIndicatorContent();

    return (
      <View style={styles.directionContainer}>
        <Animated.View style={[
          styles.modernIndicatorContent,
          {
            backgroundColor: content.bgColor,
            borderColor: content.color,
            transform: [{ scale: isQiblaAligned ? 1.05 : 1 }]
          }
        ]}>
          <MaterialCommunityIcons 
            name={content.icon} 
            size={24} 
            color={content.color}
          />
          <Text style={[
            styles.modernDirectionText,
            { color: content.color }
          ]}>
            {content.text}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/islamic-pattern4.png')}
      style={[styles.backgroundImage, { backgroundColor: themeColors.backgroundColor }]}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {/* Instructions Modal */}
          {showInstructions && (
            <InstructionsModal 
              visible={showInstructions}
              onClose={() => setShowInstructions(false)} 
              themeColors={themeColors}
              language={language}
            />
          )}

          {/* Header Section with Title and Info Button */}
          <View style={styles.headerContainer}>
            <View style={styles.titleWrapper}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: themeColors.textColor }]}>
                  {getTranslatedText('qiblaDirection')}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.infoButton,
                { backgroundColor: 'rgba(255, 255, 255, 0.8)' }
              ]}
              onPress={() => setShowInstructions(true)}
            >
              <Ionicons 
                name="information-circle" 
                size={28} 
                color={themeColors.textColor}
              />
            </TouchableOpacity>
          </View>

          <Compass
            rotation={rotationAnimation.interpolate({
              inputRange: [0, 360],
              outputRange: ['360deg', '0deg'],
            })}
          />

          {/* Add the DirectionIndicator to your return statement, just before the status container */}
          <View style={styles.directionContainer}>
            <DirectionIndicator 
              angleDifference={qiblaDirection && compassHeading ? 
                ((qiblaDirection - compassHeading + 540) % 360) - 180 : 0
              }
              themeColors={themeColors}
            />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
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
    paddingTop: 80,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    top: 65,
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
  degrees: {
    fontSize: 38,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
    textAlign: 'center',
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
  error: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoButton: {
    position: 'absolute',
    right: 20,
    top: '100%',
    transform: [{ translateY: -22 }],
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  blurView: {
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  directionContainer: {
    position: 'absolute',
    bottom: '15%',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 3,
  },
  
  directionIndicator: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.98)', // More opaque
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Increased shadow opacity
    shadowRadius: 12,
    elevation: 8, // Increased elevation for Android
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // Added subtle border
  },

  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },

  directionText: {
    fontSize: 28, // Slightly larger
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },

  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },

  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },

  alignedIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
  },

  alignedText: {
    color: '#10b981',
    fontWeight: '700',
  },

  alignedProgress: {
    backgroundColor: '#10b981',
  },

  nearlyAlignedIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },

  nearlyAlignedText: {
    color: '#10b981',
  },

  nearlyAlignedProgress: {
    backgroundColor: '#10b981',
  },

  compassTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.3,
    zIndex: 1,
  },

  modernDirectionIndicator: {
    position: 'absolute',
    bottom: '30%',
    left: '50%',
    transform: [{ translateX: -75 }], // Half of the width
    width: 150,
    alignItems: 'center',
    zIndex: 3,
  },

  modernIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },

  modernDirectionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  modernAlignedIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },

  modernNearlyAlignedIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },

  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});