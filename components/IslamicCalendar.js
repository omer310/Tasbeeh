import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@react-navigation/native';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const ISLAMIC_EVENTS = [
  { name: "Islamic New Year", description: "1 Muharram", info: "Marks the beginning of the Islamic lunar calendar." },
  { name: "Day of Ashura", description: "10 Muharram", info: "A day of fasting to commemorate the day Noah left the Ark and Moses was saved from the Egyptians by God." },
  { name: "Mawlid al-Nabi", description: "12 Rabi' al-awwal", info: "Celebration of the birthday of Islamic prophet Muhammad." },
  { name: "Lailat al Miraj", description: "27 Rajab", info: "Commemorates Muhammad's night journey from Mecca to Jerusalem and his ascension to heaven." },
  { name: "Laylat al Bara'at", description: "15 Sha'ban", info: "Night of forgiveness and spiritual merit." },
  { name: "Ramadan (start)", description: "1 Ramadan", info: "The beginning of the month of fasting." },
  { name: "Laylat al-Qadr", description: "27 Ramadan", info: "The night when the first verses of the Quran were revealed to Muhammad." },
  { name: "Eid al-Fitr", description: "1 Shawwal", info: "Festival of breaking the fast, marks the end of Ramadan." },
  { name: "Day of Arafah", description: "9 Dhu al-Hijjah", info: "The holiest day in the Islamic calendar, the day before Eid al-Adha." },
  { name: "Eid al-Adha", description: "10 Dhu al-Hijjah", info: "Festival of sacrifice, commemorates Ibrahim's willingness to sacrifice his son." },
];


const IslamicCalendar = ({ themeColors }) => {
  const { colors } = useTheme();
  const [calendarData, setCalendarData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

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
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
    setLoading(false);
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
    const [day, month] = event.description.split(' ');
    const eventDate = calendarData.find(date => 
      date.hijri.day === day && date.hijri.month.en === month
    );
    if (eventDate) {
      const newDate = new Date(eventDate.gregorian.date);
      setCurrentDate(newDate);
      setSelectedDate(eventDate);
    }
  };

  const isCurrentDay = (date) => {
    const today = new Date();
    return date.gregorian.day === today.getDate().toString() &&
           date.gregorian.month.number === (today.getMonth() + 1).toString() &&
           date.gregorian.year === today.getFullYear().toString();
  };

  const isImportantDay = (date) => {
    return ISLAMIC_EVENTS.some(event => 
      event.description.split(' ')[0] == date.hijri.day &&
      event.description.split(' ')[1] == date.hijri.month.en
    );
  };

  const renderCalendarGrid = () => {
    if (loading || calendarData.length === 0) {
      return <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>;
    }

    const firstDayOfMonth = new Date(calendarData[0].gregorian.date);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = calendarData.length;
    const rows = Math.ceil((firstDayOfWeek + totalDays) / 7);

    let days = [];
    let dayCounter = 0;

    for (let i = 0; i < rows; i++) {
      let row = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDayOfWeek) || dayCounter >= totalDays) {
          row.push(<View key={`empty-${i}-${j}`} style={styles.emptyDay} />);
        } else {
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
                {date.gregorian.day}
              </Text>
              <Text style={[styles.hijriDay, isToday && styles.currentDayText, { color: isSelected || isImportant ? '#fff' : colors.text }]}>
                {date.hijri.day}
              </Text>
            </TouchableOpacity>
          );
          dayCounter++;
        }
      }
      days.push(<View key={`row-${i}`} style={styles.week}>{row}</View>);
    }

    return (
      <View style={styles.calendarWrapper}>
        {days}
      </View>
    );
  };

  const getHeaderDate = () => {
    if (selectedDate) {
      return `${selectedDate.hijri.day} ${selectedDate.hijri.month.en} ${selectedDate.hijri.year} AH`;
    }
    return '';
  };

  const getSubHeaderDate = () => {
    if (selectedDate) {
      return selectedDate.gregorian.date;
    }
    return '';
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => {}}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{getHeaderDate()}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]}>{getSubHeaderDate()}</Text>
        </View>
      </View>
      <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Icon name="chevron-left" size={30} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={[styles.currentMonth, { color: colors.text }]}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Icon name="chevron-right" size={30} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        <View style={styles.daysOfWeek}>
          {DAYS_OF_WEEK.map((day, index) => (
            <Text key={index} style={[styles.dayOfWeek, index === 5 && styles.friday, { color: colors.text }]}>{day}</Text>
          ))}
        </View>
        {renderCalendarGrid()}
      </View>
      <View style={[styles.eventsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.eventsTitle, { color: colors.text }]}>Islamic Events</Text>
        {ISLAMIC_EVENTS.map((event, index) => (
          <TouchableOpacity key={index} style={styles.eventItem} onPress={() => navigateToEventDate(event)}>
            <View>
              <Text style={[styles.eventName, { color: colors.text }]}>{event.name}</Text>
              <Text style={[styles.eventDescription, { color: '#4CAF50' }]}>{event.description}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEventInfoPress(event)}>
              <Icon name="info-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginLeft: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    marginLeft: 16,
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
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
});

export default IslamicCalendar;