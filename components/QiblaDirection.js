import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, Animated, Easing, Alert, TouchableOpacity, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';

export default function QiblaDirection({ themeColors, language }) {
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [headingAccuracy, setHeadingAccuracy] = useState(null);
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  // Add this new function to show calibration instructions
  const showCalibrationInstructions = () => {
    Alert.alert(
      getTranslatedText('calibrationNeeded'),
      getTranslatedText('calibrationMessage'),
      [
        {
          text: getTranslatedText('ok'),
          onPress: () => {
            // You can add additional actions here if needed
          },
        },
      ]
    );
  };

  // Add translations
  const translations = {
    qiblaDirection: { en: 'Qibla Direction', ar: 'اتجاه القبلة' },
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
  };

  const getTranslatedText = (key) => {
    return translations[key][language] || key;
  };

  useEffect(() => {
    let headingSubscription;

    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      // Get the user's current location
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      fetchQiblaDirection(location.coords.latitude, location.coords.longitude);

      // Subscribe to heading updates
      headingSubscription = await Location.watchHeadingAsync((heading) => {
        // Use true heading if available, otherwise use magnetic heading
        const headingValue = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
        setCompassHeading(headingValue);
        setHeadingAccuracy(heading.accuracy);

        // Animate the arrow rotation
        Animated.timing(rotationAnimation, {
          toValue: headingValue,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }).start();
      });
    })();

    // Clean up the subscription when the component unmounts
    return () => {
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (headingAccuracy > 15) {
      Alert.alert(
        getTranslatedText('calibrationNeeded'),
        getTranslatedText('calibrationMessage'),
        [{ text: getTranslatedText('ok') }]
      );
    }
  }, [headingAccuracy]);

  const fetchQiblaDirection = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
      const data = await response.json();
      if (data.code === 200 && data.status === 'OK') {
        setQiblaDirection(data.data.direction);
        setDebugInfo(`API Qibla: ${data.data.direction}°`);
      } else {
        setError('Failed to fetch Qibla direction');
      }
    } catch (error) {
      setError('Error fetching Qibla direction');
    }
  };

  const getArrowColor = (angleDifference) => {
    const hue = (1 - angleDifference / 180) * 120; // 0 is red, 120 is green
    return `hsl(${hue}, 100%, 50%)`;
  };

  const getInstruction = (angleDifference, rotationDiff) => {
    if (angleDifference < 10) {
      return getTranslatedText('facingQibla');
    } else {
      const direction = rotationDiff > 0 ? 'right' : 'left';
      if (angleDifference < 45) {
        return getTranslatedText(`turnSlightly${direction.charAt(0).toUpperCase() + direction.slice(1)}`);
      } else {
        return getTranslatedText(`turn${direction.charAt(0).toUpperCase() + direction.slice(1)}`);
      }
    }
  };

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: themeColors.textColor }]}>{error}</Text>
      </View>
    );
  }

  if (qiblaDirection === null || userLocation === null) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.loading, { color: themeColors.textColor }]}>{getTranslatedText('calculating')}</Text>
      </View>
    );
  }

  // Calculate the difference between compass heading and Qibla direction
  const arrowRotation = (qiblaDirection - compassHeading + 360) % 360;
  const rotationDiff = ((qiblaDirection - compassHeading + 540) % 360) - 180;
  const angleDifference = Math.abs(rotationDiff);

  const arrowColor = getArrowColor(angleDifference);
  const instruction = getInstruction(angleDifference, rotationDiff);

  // Construct debug information
  const updatedDebugInfo = `${debugInfo}\nCompass: ${compassHeading.toFixed(2)}°\nArrow Rotation: ${arrowRotation.toFixed(
    2
  )}°`;

  // Convert rotation to radians for animation
  const rotation = rotationAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const ArrowWithHead = ({ rotation, color }) => {
    const { width, height } = Dimensions.get('window');
    const screenSize = Math.min(width, height);
    const arrowSize = screenSize * 0.8; // 80% of the smaller screen dimension
    const headSize = screenSize * 0.15; // 15% of the smaller screen dimension
    const shaftWidth = screenSize * 0.025; // 2.5% of the smaller screen dimension

    return (
      <Animated.View
        style={[
          styles.qiblaArrow,
          {
            transform: [{ rotate: `${rotation}deg` }],
            width: arrowSize,
            height: arrowSize,
          },
        ]}
      >
        <Svg
          width={arrowSize}
          height={arrowSize}
          viewBox={`0 0 ${arrowSize} ${arrowSize}`}
          style={styles.arrowShaft}
        >
          <Path
            d={`M ${arrowSize / 2} ${arrowSize - (arrowSize * 0.2)} L ${arrowSize / 2} ${headSize + (arrowSize * 0.1)}`}
            stroke={color}
            strokeWidth={shaftWidth}
            strokeLinecap="round"
          />
        </Svg>
        <Image
          source={require('../assets/Qibla-head.png')}
          style={[
            styles.arrowHead,
            {
              width: headSize,
              height: headSize,
              position: 'absolute',
              top: arrowSize * 0.1,
              left: (arrowSize - headSize) / 2,
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>
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
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: themeColors.textColor }]}>{getTranslatedText('qiblaDirection')}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={[styles.degrees, { color: themeColors.textColor }]}>{`${qiblaDirection.toFixed(2)}°`}</Text>
            <View style={styles.instructionContainer}>
              <Text style={[styles.instruction, { color: themeColors.textColor }]}>{instruction}</Text>
            </View>
          </View>

          <View style={styles.compassContainer}>
            <Image source={require('../assets/islamic-pattern6.png')} style={styles.compassRose} />
            <ArrowWithHead
              rotation={arrowRotation}
              color={getArrowColor(angleDifference)}
            />
          </View>

          <View style={styles.accuracyContainer}>
            <Text style={[styles.accuracy, { color: themeColors.textColor }]}>
              {getTranslatedText('compassAccuracy')}: {headingAccuracy ? `${headingAccuracy.toFixed(2)}°` : getTranslatedText('unknown')}
            </Text>
            {headingAccuracy && headingAccuracy > 15 && (
              <TouchableOpacity onPress={showCalibrationInstructions} style={styles.calibrateButton}>
                <Text style={[styles.calibrateButtonText, { color: themeColors.textColor }]}>
                  {getTranslatedText('lowAccuracy')} - {getTranslatedText('tapToCalibrate')}
                </Text>
              </TouchableOpacity>
            )}
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
    justifyContent: 'center', // Changed from 'flex-start' to 'center'
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingTop: -20, // Add some top padding to move content down
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20, // Reduced margin
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  compassContainer: {
    width: 350,  // Increased from 300
    height: 350, // Increased from 300
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  compassRose: {
    width: 350,  // Increased from 300
    height: 350, // Increased from 300
    position: 'absolute',
  },
  qiblaArrow: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowShaft: {
    position: 'absolute',

  },
  arrowHead: {
    position: 'absolute',
  },
  needleImage: {
    width: 300,  // Increased from 150
    height: 300, // Increased from 150
    resizeMode: 'contain',
  },
  degrees: {
    fontSize: 48, // Increased font size
    fontWeight: 'bold',
    marginBottom: 10, // Added margin
  },
  instructionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: '90%', // Increased width
  },
  instruction: {
    fontSize: 20, // Increased font size
    textAlign: 'center',
    fontWeight: '600',
  },
  accuracy: {
    fontSize: 16, // Increased font size
    marginBottom: 5,
    opacity: 0.8,
  },
  error: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
  },
  debug: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20, // Added margin
  },
  accuracyContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  calibrateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 5,
  },
  calibrateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});