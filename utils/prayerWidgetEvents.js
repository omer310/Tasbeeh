// In-process bridge: publish only prayer data already accepted by the app.
const listeners = new Set();
function onPrayerWidgetData(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function publishPrayerWidgetData(settings, days) { for (const listener of listeners) listener({ settings, days }); }
module.exports = { onPrayerWidgetData, publishPrayerWidgetData };
