import moment from 'moment-hijri';

export const getHijriDate = () => {
  const hijriDate = moment().format('iD iMMMM iYYYY');
  const [day, month, year] = hijriDate.split(' ');
  return { day, month, year };
};