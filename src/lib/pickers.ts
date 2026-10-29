import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

// Android-only app: the native dialog is imperative, so wrap it in a promise.
// Resolves `null` when dismissed (or on platforms without the imperative API).
function open(
  mode: 'date' | 'time',
  value: Date,
  extra?: { minimumDate?: Date; maximumDate?: Date },
) {
  return new Promise<Date | null>((resolve) => {
    if (Platform.OS !== 'android') {
      resolve(null);
      return;
    }
    DateTimePickerAndroid.open({
      value,
      mode,
      ...extra,
      onChange: (event, date) => resolve(event.type === 'set' && date ? date : null),
    });
  });
}

export const pickDate = (value: Date, extra?: { minimumDate?: Date; maximumDate?: Date }) =>
  open('date', value, extra);

export const pickTime = (value: Date) => open('time', value);
