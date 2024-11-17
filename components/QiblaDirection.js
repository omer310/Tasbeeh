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
    },
    turnToYourLeft: {
      en: 'Turn to your left',
      ar: 'انعطف إلى يسارك'
    },
    turnToYourRight: {
      en: 'Turn to your right',
      ar: 'انعطف إلى يمينك'
    },
    youAreFacingMakkah: {
      en: "You're facing Makkah",
      ar: 'أنت تواجه مكة'
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
          prefix: "You're facing ",
          highlight: "Makkah",
        };
      }
      
      const isRight = angleDifference > 0;
      return {
        prefix: "Turn to your ",
        highlight: isRight ? "right" : "left",
      };
    };

    const content = getIndicatorContent();

    return (
      <View style={directionStyles.container}>
        <Text style={directionStyles.text}>
          <Text style={directionStyles.prefix}>
            {content.prefix}
          </Text>
          <Text style={directionStyles.highlight}>
            {content.highlight}
          </Text>
        </Text>
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

          {/* Move DirectionIndicator to the top */}
          <View style={styles.topSection}>
            <DirectionIndicator 
              angleDifference={qiblaDirection && compassHeading ? 
                ((qiblaDirection - compassHeading + 540) % 360) - 180 : 0
              }
              themeColors={themeColors}
            />
            
            {/* Move info button next to the direction text */}
            <TouchableOpacity 
              style={styles.infoButton}
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
});

// Separate styles for the direction indicator
const directionStyles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    top: '25%',
    left: 40,
  },
  text: {
    fontSize: 28,
    textAlign: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  prefix: {
    color: '#1F2937', // Dark gray/almost black from the image
    fontSize: 28,
    fontWeight: '400', // Regular weight for prefix
    letterSpacing: 0.3,
  },
  highlight: {
    fontSize: 28,
    fontWeight: '600', // Semi-bold for the highlighted word
    color: '#15803D', // Matching the exact green from the images
    letterSpacing: 0.3,
  }
});