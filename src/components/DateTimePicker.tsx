import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Card, Modal, Portal, Text } from 'react-native-paper';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
}

const CustomDateTimePicker: React.FC<Props> = ({
  visible,
  onDismiss,
  onConfirm,
  initialDate = new Date(),
  mode = 'datetime',
  minimumDate,
  maximumDate,
  title = 'Select Date & Time'
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      if (mode === 'datetime' && Platform.OS === 'android') {
        setShowDatePicker(false);
        setShowTimePicker(true);
      }
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (time) {
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours());
      newDate.setMinutes(time.getMinutes());
      setSelectedDate(newDate);
      setShowTimePicker(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onDismiss();
  };

  if (Platform.OS === 'ios') {
    return (
      <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>{title}</Text>
              <DateTimePicker
                value={selectedDate}
                mode={mode}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.picker}
              />
              <View style={styles.buttons}>
                <Button mode="outlined" onPress={onDismiss} style={styles.button}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleConfirm} style={styles.button}>
                  Confirm
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  }

  // Android
  return (
    <>
      {showDatePicker && visible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
      {showTimePicker && visible && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  picker: {
    marginVertical: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    minWidth: 100,
  },
});

export default CustomDateTimePicker;
