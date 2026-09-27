/* global __dirname */
// Vendor only the MIT free icons used by Duas. Parse static literals; never
// execute downloaded modules. License: assets/licenses/hugeicons.txt.
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');
const originalIcons = require('../data/duaOriginalIcons.json');
const VERSION = '4.3.5';
// Null entries are original app artwork, kept separate from the vendor license.
const ICONS = {
  prayer: 'SujoodIcon', daily: 'LanternIcon', family: 'CharityIcon',
  comfort: null, health: 'HandHeartIcon', food: 'DatesIcon',
  travel: 'CamelIcon', nature: 'CloudRainIcon', pilgrimage: null,
  home: 'House01Icon', mosque: 'Mosque01Icon', afterPrayer: 'SalahIcon',
  sleep: 'SleepingIcon', morning: 'SunriseIcon', evening: 'MoonStarIcon',
  meal: 'Dish01Icon', restroom: 'Toilet02Icon', wudu: 'WuduIcon',
};
function literal(node) {
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral') return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(property => {
    if (property.type !== 'ObjectProperty' || property.computed) throw new Error('Non-literal icon property');
    return [property.key.name || property.key.value, literal(property.value)];
  }));
  throw new Error(`Unexpected icon syntax: ${node.type}`);
}
const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
async function main() {
  const icons = { ...originalIcons };
  await Promise.all(Object.entries(ICONS).filter(([, moduleName]) => moduleName).map(async ([name, moduleName]) => {
    const response = await fetch(`https://unpkg.com/@hugeicons/core-free-icons@${VERSION}/dist/esm/${moduleName}.js`);
    if (!response.ok) throw new Error(`${moduleName}: ${response.status}`);
    const ast = parse(await response.text(), { sourceType: 'module' });
    const declaration = ast.program.body.find(node => node.type === 'VariableDeclaration')?.declarations[0];
    const shapes = literal(declaration.init);
    const content = shapes.map(([tag, attributes]) => {
      if (!['path', 'circle', 'ellipse', 'line', 'rect', 'polyline', 'polygon'].includes(tag)) throw new Error(`Unexpected SVG tag: ${tag}`);
      return `<${tag} ${Object.entries(attributes).filter(([key]) => key !== 'key').map(([key, value]) => `${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}="${escape(value)}"`).join(' ')} />`;
    }).join('');
    icons[name] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">${content}</svg>`;
  }));
  const ordered = Object.fromEntries(Object.keys(ICONS).map(key => [key, icons[key]]));
  fs.writeFileSync(path.join(__dirname, '../data/duaIcons.json'), `${JSON.stringify(ordered, null, 2)}\n`);
  console.log(`Bundled ${Object.keys(ordered).length} Dua SVGs: ${Object.values(ICONS).filter(Boolean).length} Hugeicons ${VERSION} and ${Object.keys(originalIcons).length} original icons.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
