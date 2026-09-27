/* global __dirname */
// Regenerate after editing the Hisn catalogue or the short navigation labels.
const fs = require('node:fs'), path = require('node:path');
const categories = require('../data/hisnDuas.json');
const { EVERYDAY_DUAS } = require('../utils/duaDiscovery');
const titles = new Map(EVERYDAY_DUAS.map(item => [item.id, item]));
const data = categories.map(category => ({ ...category,
  title: titles.get(category.id)?.title || category.title,
  titleAr: titles.get(category.id)?.titleAr || category.titleAr,
}));
const target = path.resolve(__dirname, '../modules/home-widgets/android/src/main/assets/widget_duas.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(data) + '\n');
console.log(`Synced ${data.length} Dua occasions for offline widgets.`);
