import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { countries } from './countries';
import AdhanPreferencesModal from './AdhanPreferencesModal';

const madhhabSettings = [
  { id: 1, name: 'Shafi, Maliki, Hanbali' },
  { id: 2, name: 'Hanafi' }
];

const adjustmentMethods = [
  { id: 1, name: 'No adjustment' },
  { id: 2, name: 'Middle of night' },
  { id: 3, name: 'One-seventh of night' },
  { id: 4, name: 'Angle-based' }
];

const calculationMethods = [
  { id: 1, name: 'University of Islamic Sciences, Karachi', countries: ['PK', 'AF', 'BD', 'IN'] },
  { id: 2, name: 'Islamic Society of North America', countries: ['US', 'CA'] },
  { id: 3, name: 'Muslim World League', countries: ['EU', 'AF', 'AL', 'AZ', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'GE', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'KZ', 'XK', 'KG', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'TJ', 'UA', 'GB', 'UZ', 'VA'] },
  { id: 4, name: 'Umm Al-Qura University, Makkah', countries: ['SA'] },
  { id: 5, name: 'Egyptian General Authority of Survey', countries: ['EG', 'SD', 'LY', 'DZ', 'MA', 'TN', 'MR', 'SO', 'TD', 'DJ', 'ER', 'ET'] },
  { id: 7, name: 'Institute of Geophysics, University of Tehran', countries: ['IR'] },
  { id: 8, name: 'Gulf Region', countries: ['AE', 'KW', 'QA', 'BH', 'OM', 'YE'] },
  { id: 9, name: 'Kuwait', countries: ['KW'] },
  { id: 10, name: 'Qatar', countries: ['QA'] },
  { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore', countries: ['SG', 'MY', 'ID', 'BN', 'TH', 'PH', 'VN', 'KH', 'LA', 'MM'] },
  { id: 12, name: 'Union Organization islamic de France', countries: ['FR'] },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey', countries: ['TR', 'CY', 'AM', 'GR', 'BG'] },
  { id: 14, name: 'Spiritual Administration of Muslims of Russia', countries: ['RU', 'BY', 'UA', 'MD', 'EE', 'LV', 'LT', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'RS', 'HR', 'SI', 'BA', 'ME', 'MK', 'AL'] },
  { id: 15, name: 'Moonsighting Committee Worldwide', countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'ZA', 'NG', 'GH', 'KE', 'TZ', 'UG', 'RW', 'SN', 'ML', 'NE', 'CM', 'CI', 'BF', 'TG', 'BJ', 'GN', 'LR', 'SL', 'GM'] },
];

const PrayerTimeSettings = ({ isVisible, onClose, themeColors, onSettingsChange }) => {
  const [showImsak, setShowImsak] = useState(false);
  const [autoDetectLocation, setAutoDetectLocation] = useState(true);
  const [automaticSettings, setAutomaticSettings] = useState(true);
  const [location, setLocation] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState('');
  const [calculationMethodId, setCalculationMethodId] = useState(3); // Default to Muslim World League
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [isAdhanModalVisible, setIsAdhanModalVisible] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [madhhabMethod, setMadhhabMethod] = useState(1);
  const [adjustmentMethod, setAdjustmentMethod] = useState(1);
  const [fajrAngle, setFajrAngle] = useState('18');
  const [ishaAngle, setIshaAngle] = useState('17');
  const [showManualSettings, setShowManualSettings] = useState(false);
  const [showCalculationMethodPicker, setShowCalculationMethodPicker] = useState(false);

  useEffect(() => {
    loadSettings();
    handleInitialLocation();
  }, []);

  const handleInitialLocation = async () => {
    const savedLocation = await AsyncStorage.getItem('location');
    if (!savedLocation) {
      handleAutoDetectChange(true);
    }
  };

  const loadSettings = async () => {
    try {
      const savedShowImsak = await AsyncStorage.getItem('showImsak');
      const savedAutoDetect = await AsyncStorage.getItem('autoDetectLocation');
      const savedAutoSettings = await AsyncStorage.getItem('automaticSettings');
      const savedLocation = await AsyncStorage.getItem('location');
      const savedMethod = await AsyncStorage.getItem('calculationMethod');
      const savedMethodId = await AsyncStorage.getItem('calculationMethodId');
      const savedLatitude = await AsyncStorage.getItem('latitude');
      const savedLongitude = await AsyncStorage.getItem('longitude');
      const savedCity = await AsyncStorage.getItem('city');
      const savedCountry = await AsyncStorage.getItem('country');

      setShowImsak(savedShowImsak === 'true');
      setAutoDetectLocation(savedAutoDetect !== 'false');
      setAutomaticSettings(savedAutoSettings !== 'false');
      if (savedLocation) setLocation(savedLocation);
      if (savedMethod) setCalculationMethod(savedMethod);
      if (savedMethodId) setCalculationMethodId(parseInt(savedMethodId));
      if (savedLatitude) setLatitude(parseFloat(savedLatitude));
      if (savedLongitude) setLongitude(parseFloat(savedLongitude));
      if (savedCity) setCity(savedCity);
      if (savedCountry) setCountry(savedCountry);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('showImsak', showImsak.toString());
      await AsyncStorage.setItem('autoDetectLocation', autoDetectLocation.toString());
      await AsyncStorage.setItem('automaticSettings', automaticSettings.toString());
      await AsyncStorage.setItem('location', location);
      await AsyncStorage.setItem('calculationMethod', calculationMethod);
      await AsyncStorage.setItem('calculationMethodId', calculationMethodId.toString());
      await AsyncStorage.setItem('latitude', latitude ? latitude.toString() : '');
      await AsyncStorage.setItem('longitude', longitude ? longitude.toString() : '');
      await AsyncStorage.setItem('city', city);
      await AsyncStorage.setItem('country', country);
      await AsyncStorage.setItem('madhhabMethod', madhhabMethod.toString());
      await AsyncStorage.setItem('adjustmentMethod', adjustmentMethod.toString());
      await AsyncStorage.setItem('fajrAngle', fajrAngle);
      await AsyncStorage.setItem('ishaAngle', ishaAngle);

      onSettingsChange({
        showImsak,
        autoDetectLocation,
        automaticSettings,
        location,
        calculationMethod,
        calculationMethodId,
        latitude,
        longitude,
        city,
        country,
        madhhabMethod,
        adjustmentMethod,
        fajrAngle,
        ishaAngle
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const getCalculationMethod = (countryCode) => {
    const method = calculationMethods.find(m => m.countries.includes(countryCode));
    return method ? method : calculationMethods.find(m => m.id === 3); // Default to Muslim World League
  };

  const handleManualLocationSelect = (selectedCountry) => {
    const countryCode = countries.find(c => c.name === selectedCountry)?.code;
    setCountry(selectedCountry);
    setLocation(selectedCountry);
    setShowLocationPicker(false);
    
    const method = getCalculationMethod(countryCode);
    setCalculationMethodId(method.id);
    setCalculationMethod(method.name);
    
    if (!automaticSettings) {
      console.log('Calculation method updated due to location change');
    }
  };

  const handleAutoDetectChange = async (value) => {
    setAutoDetectLocation(value);
    if (value) {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      setIsLoading(true);
      try {
        let locationResult = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = locationResult.coords;
        setLatitude(latitude);
        setLongitude(longitude);

        let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode[0]) {
          const newCity = geocode[0].city || geocode[0].subregion || '';
          const newCountry = geocode[0].country || '';
          const countryCode = countries.find(c => c.name === newCountry)?.code;
          setCity(newCity);
          setCountry(newCountry);
          const newLocation = newCity ? `${newCity}, ${newCountry}` : newCountry;
          setLocation(newLocation);
          
          await AsyncStorage.setItem('location', newLocation);
          
          const method = getCalculationMethod(countryCode);
          setCalculationMethodId(method.id);
          setCalculationMethod(method.name);

          onSettingsChange({
            showImsak,
            autoDetectLocation: true,
            automaticSettings: true,
            location: newLocation,
            calculationMethod: method.name,
            calculationMethodId: method.id,
            latitude,
            longitude,
            city: newCity,
            country: newCountry
          });
        }
      } catch (error) {
        console.error('Error in auto-detect location:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchPrayerTimes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://api.aladhan.com/v1/timingsByCity', {
        params: {
          city: city,
          country: country,
          method: calculationMethodId,
          date: new Date().toISOString().split('T')[0],
          adjustment: 1,
        },
      });
      setPrayerTimes(response.data.data.timings);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrayerPress = (prayer) => {
    setSelectedPrayer(prayer);
    setIsAdhanModalVisible(true);
  };

  const closeAdhanModal = () => {
    setIsAdhanModalVisible(false);
    setSelectedPrayer(null);
  };

  const renderPrayerTime = (prayer, time) => (
    <TouchableOpacity
      style={styles.prayerTimeContainer}
      onPress={() => handlePrayerPress(prayer)}
    >
      <View style={styles.prayerInfoContainer}>
        <PrayerIcons prayer={prayer} color={themeColors.textColor} />
        <Text style={[styles.prayerName, { color: themeColors.textColor }]}>{prayer}</Text>
      </View>
      <View style={styles.timeContainer}>
        <Text style={[styles.prayerTime, { color: themeColors.textColor }]}>{time}</Text>
        <Ionicons name="chevron-forward" size={24} color={themeColors.secondaryTextColor} />
      </View>
    </TouchableOpacity>
  );

  const handleAutomaticSettingsChange = (value) => {
    setAutomaticSettings(value);
    setShowManualSettings(!value);
    
    if (value && autoDetectLocation) {
      handleAutoDetectChange(true);
    }
  };

  const handleCalculationMethodSelect = (method) => {
    setCalculationMethod(method.name);
    setCalculationMethodId(method.id);
    setShowCalculationMethodPicker(false);
    
    if (!automaticSettings) {
      onSettingsChange({
        ...settings,
        calculationMethod: method.name,
        calculationMethodId: method.id,
      });
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        saveSettings();
        onClose();
      }}
    >
      <View style={[styles.modalContainer, { backgroundColor: themeColors.backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            saveSettings();
            onClose();
          }}>
            <Ionicons name="arrow-back" size={24} color={themeColors.textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeColors.textColor }]}>Prayer Times Settings</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>Show Imsak in Prayer Times page</Text>
            <Switch
              value={showImsak}
              onValueChange={setShowImsak}
              trackColor={{ false: "#767577", true: themeColors.activeTabColor }}
              thumbColor={showImsak ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: themeColors.activeTabColor }]}>Prayer Time Calculation</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowLocationPicker(true)}>
            <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>Location</Text>
            <Text style={[styles.settingValue, { color: themeColors.secondaryTextColor }]}>{location}</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>Auto-detect Location</Text>
            <Switch
              value={autoDetectLocation}
              onValueChange={handleAutoDetectChange}
              trackColor={{ false: "#767577", true: themeColors.activeTabColor }}
              thumbColor={autoDetectLocation ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>Automatic settings</Text>
              <Text style={[styles.settingValue, { color: themeColors.secondaryTextColor }]}>
                {calculationMethod}
              </Text>
            </View>
            <Switch
              value={automaticSettings}
              onValueChange={handleAutomaticSettingsChange}
              trackColor={{ false: "#767577", true: themeColors.activeTabColor }}
              thumbColor={automaticSettings ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          {!automaticSettings && (
            <View style={styles.manualSettingsContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.activeTabColor }]}>
                Manual Settings
              </Text>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowCalculationMethodPicker(true)}
              >
                <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>
                  Calculation Method
                </Text>
                <Text style={[styles.settingValue, { color: themeColors.secondaryTextColor }]}>
                  {calculationMethod}
                </Text>
              </TouchableOpacity>

              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>
                  Madhab
                </Text>
                <View style={styles.pickerContainer}>
                  {madhhabSettings.map((madhab) => (
                    <TouchableOpacity
                      key={madhab.id}
                      style={[
                        styles.pickerOption,
                        madhhabMethod === madhab.id && styles.pickerOptionSelected,
                        { borderColor: themeColors.activeTabColor }
                      ]}
                      onPress={() => setMadhhabMethod(madhab.id)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        madhhabMethod === madhab.id && { color: themeColors.activeTabColor }
                      ]}>
                        {madhab.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>
                  High Latitude Rule
                </Text>
                <View style={styles.pickerContainer}>
                  {adjustmentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.pickerOption,
                        adjustmentMethod === method.id && styles.pickerOptionSelected,
                        { borderColor: themeColors.activeTabColor }
                      ]}
                      onPress={() => setAdjustmentMethod(method.id)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        adjustmentMethod === method.id && { color: themeColors.activeTabColor }
                      ]}>
                        {method.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>
                  Prayer Angles
                </Text>
                <View style={styles.anglesContainer}>
                  <View style={styles.angleInput}>
                    <Text style={[styles.angleLabel, { color: themeColors.secondaryTextColor }]}>
                      Fajr
                    </Text>
                    <TextInput
                      style={[styles.angleTextInput, { color: themeColors.textColor }]}
                      value={fajrAngle}
                      onChangeText={setFajrAngle}
                      keyboardType="numeric"
                      placeholder="18°"
                      placeholderTextColor={themeColors.secondaryTextColor}
                    />
                  </View>
                  <View style={styles.angleInput}>
                    <Text style={[styles.angleLabel, { color: themeColors.secondaryTextColor }]}>
                      Isha
                    </Text>
                    <TextInput
                      style={[styles.angleTextInput, { color: themeColors.textColor }]}
                      value={ishaAngle}
                      onChangeText={setIshaAngle}
                      keyboardType="numeric"
                      placeholder="17°"
                      placeholderTextColor={themeColors.secondaryTextColor}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <Text style={[styles.infoText, { color: themeColors.secondaryTextColor }]}>
          These prayer times have been verified with {location} • {calculationMethod}. More info
        </Text>

        {prayerTimes && (
          <View style={styles.container}>
            {renderPrayerTime('Fajr', prayerTimes.Fajr)}
            {renderPrayerTime('Dhuhr', prayerTimes.Dhuhr)}
            {renderPrayerTime('Asr', prayerTimes.Asr)}
            {renderPrayerTime('Maghrib', prayerTimes.Maghrib)}
            {renderPrayerTime('Isha', prayerTimes.Isha)}
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={showLocationPicker}
          onRequestClose={() => setShowLocationPicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: themeColors.backgroundColor }]}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Ionicons name="close" size={24} color={themeColors.textColor} />
              </TouchableOpacity>
              <Text style={[styles.pickerTitle, { color: themeColors.textColor }]}>Select Country</Text>
            </View>
            <TextInput
              style={[styles.searchInput, { color: themeColors.textColor, backgroundColor: themeColors.cardBackground }]}
              placeholder="Search countries..."
              placeholderTextColor={themeColors.secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredCountries}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, { borderBottomColor: themeColors.borderColor }]}
                  onPress={() => handleManualLocationSelect(item.name)}
                >
                  <Text style={[styles.countryText, { color: themeColors.textColor }]}>{item.name}</Text>
                  <Text style={[styles.countryCode, { color: themeColors.secondaryTextColor }]}>{item.code}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.code}
            />
          </View>
        </Modal>

        <AdhanPreferencesModal
          isVisible={isAdhanModalVisible}
          onClose={closeAdhanModal}
          prayer={selectedPrayer}
          themeColors={themeColors}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={themeColors.activeTabColor} />
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={showCalculationMethodPicker}
          onRequestClose={() => setShowCalculationMethodPicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: themeColors.backgroundColor }]}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowCalculationMethodPicker(false)}>
                <Ionicons name="close" size={24} color={themeColors.textColor} />
              </TouchableOpacity>
              <Text style={[styles.pickerTitle, { color: themeColors.textColor }]}>Select Calculation Method</Text>
            </View>
            <FlatList
              data={calculationMethods}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.methodItem, { borderBottomColor: themeColors.borderColor }]}
                  onPress={() => handleCalculationMethodSelect(item)}
                >
                  <Text style={[styles.methodName, { color: themeColors.textColor }]}>{item.name}</Text>
                  {item.countries.length > 0 && (
                    <Text style={[styles.methodCountries, { color: themeColors.secondaryTextColor }]}>
                      Used in: {item.countries.join(', ')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginTop: 20,
  },
  pickerModal: {
    flex: 1,
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  searchInput: {
    padding: 10,
    marginBottom: 20,
    borderRadius: 10,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  countryCode: {
    fontSize: 14,
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    padding: 20,
  },
  prayerTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  prayerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerName: {
    fontSize: 18,
    marginLeft: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTime: {
    fontSize: 18,
    marginRight: 10,
  },
  manualSettingsContainer: {
    marginTop: 20,
  },
  pickerContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  pickerOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 5,
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
  },
  anglesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  angleInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  angleLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  angleTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  methodItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  methodCountries: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default PrayerTimeSettings;