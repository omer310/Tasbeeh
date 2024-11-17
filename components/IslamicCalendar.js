import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@react-navigation/native';
import moment from 'moment-hijri';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_OF_WEEK_AR = [
  'الأحد',    // Sunday
  'الإثنين',  // Monday  
  'الثلاثاء', // Tuesday
  'الأربعاء', // Wednesday
  'خميس',   // Thursday
  'الجمعة',   // Friday
  'السبت'     // Saturday
];

const ISLAMIC_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-awwal', 'Rabi al-thani', 'Jumada al-awwal', 'Jumada al-thani',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'
];

const EVENTS_AR = {
  "Islamic New Year": "رأس السنة الهجرية",
  "Day of Ashura": "يوم عاشوراء",
  "Mawlid al-Nabi": "المولد النبوي",
  "Lailat al Miraj": "ليلة المعراج",
  "Ramadan (start)": "بداية رمضان",
  "Eid al-Fitr": "عيد الفطر",
  "Day of Arafah": "يوم عرفة",
  "Eid al-Adha": "عيد الأضحى"
};

// Add these Arabic month names at the top with other constants
const GREGORIAN_MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Helper function to parse date strings with UTC
const parseDateStringUTC = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// Function to normalize month names
const normalizeMonthName = (monthName) => monthName.toLowerCase().replace(/[^a-z]/g, '');

const IslamicCalendar = ({ themeColors, language = 'en' }) => {
  const { colors } = useTheme();
  const [calendarData, setCalendarData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentEvents, setCurrentEvents] = useState([]); 
  const [currentHijriYear, setCurrentHijriYear] = useState(null);

  useEffect(() => {
    fetchCalendarData();
    updateCurrentEvents();
  }, [currentDate, currentHijriYear]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const response = await axios.get(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`, {
        params: {
          adjustment: 0,
          method: 4 // Umm al-Qura University, Makkah
        }
      });
      setCalendarData(response.data.data);
      if (!selectedDate) {
        setSelectedDate(response.data.data.find(d => d.gregorian.day == currentDate.getDate()));
      }
      // Set current Hijri year
      if (response.data.data.length > 0) {
        setCurrentHijriYear(parseInt(response.data.data[0].hijri.year));
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
    setLoading(false);
  };

  const updateCurrentEvents = () => {
    if (!currentHijriYear) return;

    const dynamicEvents = generateDynamicEvents(currentHijriYear);
    const nextYearEvents = generateDynamicEvents(currentHijriYear + 1);
    const allEvents = [...dynamicEvents, ...nextYearEvents];
    const today = moment();
    
    // Only keep future events
    const futureEvents = allEvents
      .filter(event => {
        const eventDate = moment(`${event.hijriYear}-${event.hijriMonth}-${event.hijriDay}`, 'iYYYY-iM-iD');
        return eventDate.isSameOrAfter(today, 'day');
      })
      .sort((a, b) => {
        const dateA = moment(`${a.hijriYear}-${a.hijriMonth}-${a.hijriDay}`, 'iYYYY-iM-iD');
        const dateB = moment(`${b.hijriYear}-${b.hijriMonth}-${b.hijriDay}`, 'iYYYY-iM-iD');
        return dateA.diff(dateB);
      });

    setCurrentEvents(futureEvents);
  };

  const generateDynamicEvents = (hijriYear) => {
    return [
      { name: "Islamic New Year", hijriDay: 1, hijriMonth: 1, hijriYear: hijriYear },
      { name: "Day of Ashura", hijriDay: 10, hijriMonth: 1, hijriYear: hijriYear },
      { name: "Mawlid al-Nabi", hijriDay: 12, hijriMonth: 3, hijriYear: hijriYear },
      { name: "Lailat al Miraj", hijriDay: 27, hijriMonth: 7, hijriYear: hijriYear },
      { name: "Ramadan (start)", hijriDay: 1, hijriMonth: 9, hijriYear: hijriYear },
      { name: "Eid al-Fitr", hijriDay: 1, hijriMonth: 10, hijriYear: hijriYear },
      { name: "Day of Arafah", hijriDay: 9, hijriMonth: 12, hijriYear: hijriYear },
      { name: "Eid al-Adha", hijriDay: 10, hijriMonth: 12, hijriYear: hijriYear },
    ];
  };

  const changeMonth = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleDatePress = (date) => {
    setSelectedDate(date);
  };

  const handleEventInfoPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const navigateToEventDate = (event) => {
    const eventDate = moment(`${event.hijriYear}-${event.hijriMonth}-${event.hijriDay}`, 'iYYYY-iM-iD');
    const gregorianDate = eventDate.toDate();
    
    setCurrentDate(gregorianDate);
    
    // Find the corresponding calendar date and select it
    const matchingDate = calendarData.find(date => 
      parseInt(date.hijri.day) === event.hijriDay &&
      parseInt(date.hijri.month.number) === event.hijriMonth &&
      parseInt(date.hijri.year) === event.hijriYear
    );
    
    if (matchingDate) {
      setSelectedDate(matchingDate);
    }
  };

  const ISLAMIC_MONTHS_AR = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  // Updated isCurrentDay function
  const isCurrentDay = (date) => {
    const today = new Date();
    return parseInt(date.gregorian.day, 10) === today.getUTCDate() &&
           parseInt(date.gregorian.month.number, 10) === (today.getUTCMonth() + 1) &&
           parseInt(date.gregorian.year, 10) === today.getUTCFullYear();
  };

  const isImportantDay = (date) => {
    return currentEvents.some(event => 
      event.hijriDay == date.hijri.day &&
      event.hijriMonth == date.hijri.month.number &&
      event.hijriYear == date.hijri.year
    );
  };

  // Updated renderCalendarGrid function
  const renderCalendarGrid = () => {
    if (loading || calendarData.length === 0) {
      return <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>;
    }

    const firstDayOfMonth = parseDateStringUTC(calendarData[0].gregorian.date);
    const firstDayOfWeek = firstDayOfMonth.getUTCDay();
    const totalDays = calendarData.length;
    const rows = Math.ceil((firstDayOfWeek + totalDays) / 7);

    let days = [];
    let dayCounter = 0;

    for (let i = 0; i < rows; i++) {
      let row = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDayOfWeek) {
          // Add empty cells for days before the first day of the month
          row.push(<View key={`empty-${i}-${j}`} style={styles.emptyDay} />);
        } else if (dayCounter < totalDays) {
          const date = calendarData[dayCounter];
          const isToday = isCurrentDay(date);
          const isImportant = isImportantDay(date);
          const isSelected = selectedDate && selectedDate.gregorian.date === date.gregorian.date;
          row.push(
            <TouchableOpacity
              key={`day-${dayCounter}`}
              style={[
                styles.day,
                isSelected && styles.selectedDay,
                isToday && styles.currentDay,
                isImportant && styles.importantDay
              ]}
              onPress={() => handleDatePress(date)}
            >
              <Text style={[styles.dayNumber, isToday && styles.currentDayText, { color: isSelected || isImportant ? '#fff' : colors.text }]}>
                {language === 'ar' ? convertToArabicNumbers(date.gregorian.day) : date.gregorian.day}
              </Text>
              <Text style={[styles.hijriDay, isToday && styles.currentDayText, { color: isSelected || isImportant ? '#fff' : colors.text }]}>
                {language === 'ar' ? convertToArabicNumbers(date.hijri.day) : date.hijri.day}
              </Text>
            </TouchableOpacity>
          );
          dayCounter++;
        } else {
          // Add empty cells for days after the last day of the month
          row.push(<View key={`empty-end-${i}-${j}`} style={styles.emptyDay} />);
        }
      }
      days.push(
        <View 
          key={`row-${i}`} 
          style={[
            styles.week,
            language === 'ar' && { flexDirection: 'row-reverse' }
          ]}
        >
          {row}
        </View>
      );
    }

    return (
      <View style={styles.calendarWrapper}>
        {days}
      </View>
    );
  };

  const getHeaderDate = () => {
    if (selectedDate) {
      if (language === 'ar') {
        return `${convertToArabicNumbers(selectedDate.hijri.day)} ${ISLAMIC_MONTHS_AR[parseInt(selectedDate.hijri.month.number) - 1]} ${convertToArabicNumbers(selectedDate.hijri.year)} هـ`;
      }
      return `${selectedDate.hijri.day} ${selectedDate.hijri.month.en} ${selectedDate.hijri.year} AH`;
    }
    return '';
  };

  const getSubHeaderDate = () => {
    if (selectedDate) {
      if (language === 'ar') {
        const arabicDay = convertToArabicNumbers(selectedDate.gregorian.day);
        const monthIndex = parseInt(selectedDate.gregorian.month.number) - 1;
        const arabicYear = convertToArabicNumbers(selectedDate.gregorian.year);
        return `${GREGORIAN_MONTHS_AR[monthIndex]} ${arabicDay}، ${arabicYear}`;
      }
      return `${selectedDate.gregorian.month.en} ${selectedDate.gregorian.day}, ${selectedDate.gregorian.year}`;
    }
    return '';
  };

  const convertToArabicNumbers = (num) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => arabicNumbers[digit]).join('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={language === 'ar' ? styles.headerRTL : styles.headerLTR}>
          <Text style={[
            styles.headerTitle, 
            { color: colors.text },
            language === 'ar' && styles.arabicText
          ]}>
            {getHeaderDate()}
          </Text>
          <Text style={[
            styles.headerSubtitle, 
            { color: colors.text },
            language === 'ar' && styles.arabicText
          ]}>
            {getSubHeaderDate()}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
          <View style={[
            styles.monthNavigation,
            language === 'ar' && { flexDirection: 'row-reverse' }
          ]}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Icon name={language === 'ar' ? "chevron-left" : "chevron-right"} size={30} color="#4CAF50" />
            </TouchableOpacity>
            <Text style={[
              styles.currentMonth, 
              { color: colors.text },
              language === 'ar' && styles.arabicText
            ]}>
              {language === 'ar' 
                ? `${GREGORIAN_MONTHS_AR[currentDate.getMonth()]} ${convertToArabicNumbers(currentDate.getFullYear())}`
                : currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
              }
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Icon name={language === 'ar' ? "chevron-right" : "chevron-left"} size={30} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <View style={[
            styles.daysOfWeek,
            language === 'ar' && { flexDirection: 'row-reverse' }
          ]}>
            {(language === 'ar' ? DAYS_OF_WEEK_AR : DAYS_OF_WEEK).map((day, index) => (
              <Text key={index} style={[
                styles.dayOfWeek, 
                index === 5 && styles.friday, 
                { color: colors.text },
                language === 'ar' && styles.arabicText
              ]}>
                {day}
              </Text>
            ))}
          </View>
          {renderCalendarGrid()}
        </View>
        <View style={[styles.eventsContainer, { backgroundColor: colors.card }]}>
          <Text style={[
            styles.eventsTitle, 
            { color: colors.text },
            language === 'ar' && { textAlign: 'right', width: '100%' }
          ]}>
            {language === 'ar' ? 'المناسبات الإسلامية' : 'Islamic Events'}
          </Text>
          {currentEvents.map((event, index) => {
            const hijriDate = moment(`${event.hijriYear}-${event.hijriMonth}-${event.hijriDay}`, 'iYYYY-iM-iD');
            const gregorianDate = hijriDate.format('MMMM D, YYYY');
            
            const gregorianDateAr = language === 'ar' ? (() => {
              const gDate = new Date(gregorianDate);
              const day = convertToArabicNumbers(gDate.getDate());
              const month = GREGORIAN_MONTHS_AR[gDate.getMonth()];
              const year = convertToArabicNumbers(gDate.getFullYear());
              return `${month} ${day}، ${year}`;
            })() : gregorianDate;
            
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.eventItem,
                  language === 'ar' && styles.eventItemRTL
                ]} 
                onPress={() => navigateToEventDate(event)}
              >
                <View style={[
                  styles.eventContent,
                  language === 'ar' && styles.eventContentRTL
                ]}>
                  <View style={language === 'ar' ? { width: '100%' } : null}>
                    <Text style={[
                      styles.eventName, 
                      { color: colors.text },
                      language === 'ar' && styles.eventTextRTL
                    ]}>
                      {language === 'ar' ? EVENTS_AR[event.name] : event.name}
                    </Text>
                    <Text style={[
                      styles.eventDescription, 
                      { color: '#4CAF50' }, 
                      language === 'ar' && styles.eventTextRTL
                    ]}>
                      {language === 'ar' 
                        ? `${convertToArabicNumbers(event.hijriDay)} ${ISLAMIC_MONTHS_AR[event.hijriMonth - 1]} ${convertToArabicNumbers(event.hijriYear)} هـ`
                        : `${event.hijriDay} ${ISLAMIC_MONTHS[event.hijriMonth - 1]} ${event.hijriYear} AH`
                      }
                    </Text>
                    <Text style={[
                      styles.gregorianDate, 
                      { color: colors.text },
                      language === 'ar' && styles.eventTextRTL
                    ]}>
                      {language === 'ar' ? gregorianDateAr : gregorianDate}
                    </Text>
                  </View>
                  {language !== 'ar' && (
                    <TouchableOpacity 
                      style={styles.infoButton}
                      onPress={() => handleEventInfoPress(event)}
                    >
                      <Icon name="info-outline" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedEvent?.name}</Text>
            <Text style={[styles.modalDescription, { color: colors.text }]}>{selectedEvent?.description}</Text>
            <Text style={[styles.modalInfo, { color: colors.text }]}>{selectedEvent?.info}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    marginHorizontal: 16,
    opacity: 0.7,
  },
  calendarContainer: {
    padding: 16,
    borderRadius: 10,
    margin: 16,
    elevation: 3,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayOfWeek: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  friday: {
    color: '#4CAF50',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  day: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#4CAF50',
  },
  currentDay: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  importantDay: {
    backgroundColor: '#81C784',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  hijriDay: {
    fontSize: 10,
  },
  currentDayText: {
    color: '#4CAF50',
  },
  eventsContainer: {
    padding: 16,
    marginTop: 16,
    borderRadius: 10,
    margin: 16,
    elevation: 3,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    width: '100%',
  },
  eventItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
  },
  eventItemRTL: {
    flexDirection: 'row-reverse',
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyDay: {
    width: 40,
    height: 40,
  },
  gregorianDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  arabicText: {
    fontFamily: 'System',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerLTR: {
    alignItems: 'flex-start',
  },
  headerRTL: {
    alignItems: 'flex-end',
    width: '100%',
  },
  eventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  eventContentRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  eventTextRTL: {
    textAlign: 'right',
    width: '100%',
  },
  infoButton: {
    padding: 5,
    marginLeft: 10,
  },
  infoButtonRTL: {
    padding: 5,
    marginRight: 10,
  },
});

export default IslamicCalendar;