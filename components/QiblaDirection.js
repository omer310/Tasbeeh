import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

const MECCA_COORDS = { latitude: 21.4225, longitude: 39.8262 };

export default function QiblaDirection({ themeColors }) {
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let magnetometerSubscription;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      calculateQiblaDirection(location.coords.latitude, location.coords.longitude);

      magnetometerSubscription = Magnetometer.addListener(data => {
        let angle = calculateCompassHeading(data);
        setCompassHeading(angle);
      });
    })();

    return () => {
      if (magnetometerSubscription) {
        magnetometerSubscription.remove();
      }
    };
  }, []);

  const calculateCompassHeading = (data) => {
    let angle = Math.atan2(-data.y, data.x); // Use this calculation for most devices
    let degree = angle * (180 / Math.PI);
    degree = (degree + 360) % 360;
    return degree;
  };

  const calculateQiblaDirection = (latitude, longitude) => {
    const φ1 = toRadians(latitude);
    const φ2 = toRadians(MECCA_COORDS.latitude);
    const λ1 = toRadians(longitude);
    const λ2 = toRadians(MECCA_COORDS.longitude);

    const Δλ = λ2 - λ1;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    let qiblaAngle = Math.atan2(y, x);
    qiblaAngle = toDegrees(qiblaAngle);
    qiblaAngle = (qiblaAngle + 360) % 360;

    setQiblaDirection(qiblaAngle);
  };

  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const toDegrees = (radians) => radians * (180 / Math.PI);

  if (error) {
    return <Text style={[styles.error, { color: themeColors.textColor }]}>{error}</Text>;
  }

  if (qiblaDirection === null || userLocation === null) {
    return <Text style={[styles.loading, { color: themeColors.textColor }]}>Calculating Qibla direction...</Text>;
  }

  // Adjusted rotation calculation
  const rotation = (qiblaDirection - compassHeading + 360) % 360;

  // Flip the arrow direction by adding 180 degrees
  const arrowRotation = (rotation + 180) % 360;

  const rotationDiff = ((qiblaDirection - compassHeading + 540) % 360) - 180;
  const angleDifference = Math.abs(rotationDiff);

  const getArrowColor = (angleDifference) => {
    let hue = 120 - (angleDifference / 180) * 120; // Map angleDifference from 0-180 to hue from 120-0
    return `hsl(${hue}, 100%, 50%)`;
  };

  const getInstruction = (angleDifference, rotationDiff) => {
    if (angleDifference < 10) {
      return "You are facing the Qibla direction.";
    } else {
      const direction = rotationDiff > 0 ? "right" : "left";
      if (angleDifference < 45) {
        return `Turn slightly to your ${direction} to face the Qibla.`;
      } else {
        return `Turn to your ${direction} to face the Qibla.`;
      }
    }
  };

  const arrowColor = getArrowColor(angleDifference);
  const instruction = getInstruction(angleDifference, rotationDiff);

  return (
    <ImageBackground 
      source={require('../assets/islamic-pattern4.png')}
      style={[styles.backgroundImage, { backgroundColor: themeColors.backgroundColor }]}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: themeColors.textColor }]}>Qibla Direction</Text>
        <View style={styles.compassContainer}>
          <Image
            source={require('../assets/qibla-compass.png')}
            style={styles.compassRose}
          />
          <View style={[styles.qiblaArrow, { transform: [{ rotate: `${arrowRotation}deg` }] }]} >
            <View style={[styles.arrowHead, { borderBottomColor: arrowColor }]} />
            <View style={[styles.arrowTail, { backgroundColor: arrowColor }]} />
          </View>
        </View>
        <Text style={[styles.degrees, { color: themeColors.textColor }]}>{`${qiblaDirection.toFixed(2)}°`}</Text>
        <Text style={[styles.instruction, { color: themeColors.textColor }]}>{instruction}</Text>
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
    // backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  compassContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassRose: {
    width: 250,
    height: 250,
    position: 'absolute',
  },
  qiblaArrow: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowHead: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowTail: {
    width: 6,
    height: 80,
    marginTop: -5,
  },
  degrees: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 20,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  error: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
  },
});
