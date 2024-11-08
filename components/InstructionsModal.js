import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const InstructionsModal = ({ visible, onClose, language = 'en', themeColors }) => {
  // Translations object
  const translations = {
    instructions: {
      en: 'How to Find Qibla',
      ar: 'كيفية إيجاد القبلة'
    },
    step1: {
      en: 'Hold your phone flat',
      ar: 'امسك هاتفك بشكل مستوٍ'
    },
    step2: {
      en: 'Rotate slowly until aligned',
      ar: 'قم بالتدوير ببطء حتى المحاذاة'
    },
    step3: {
      en: 'Follow the arrow direction',
      ar: 'اتبع اتجاه السهم'
    },
    gotIt: {
      en: 'Got it',
      ar: 'فهمت'
    }
  };

  const getTranslatedText = (key) => {
    return translations[key]?.[language] || key;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: themeColors?.textColor || '#064e3b' }]}>
            {getTranslatedText('instructions')}
          </Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: themeColors?.primaryColor || '#059669' }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>{getTranslatedText('step1')}</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: themeColors?.primaryColor || '#059669' }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>{getTranslatedText('step2')}</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: themeColors?.primaryColor || '#059669' }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>{getTranslatedText('step3')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: themeColors?.primaryColor || '#059669' }]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>
              {getTranslatedText('gotIt')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    width: '100%',
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default InstructionsModal; 