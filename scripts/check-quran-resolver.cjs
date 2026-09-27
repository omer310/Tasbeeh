// Validate the actual Metro file map/resolver, without transforming a bundle,
// building an APK, opening an app or starting another development server.
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig } = require('metro-config');
const DependencyGraph = require('metro/private/node-haste/DependencyGraph').default;

async function main() {
  const root = path.resolve(__dirname, '..');
  const cache = path.join(root, '.local-backups', 'metro-resolver-cache');
  fs.mkdirSync(cache, { recursive: true });
  const config = await loadConfig({ cwd: root, config: path.join(root, 'metro.config.js') });
  config.resetCache = true;
  config.fileMapCacheDirectory = cache;
  config.maxWorkers = 1;
  config.reporter = { update() {} };
  config.resolver.useWatchman = false;
  const graph = new DependencyGraph(config, { watch: false });
  let checked = 0, assets = 0;
  try {
    await graph.ready();
    for (const file of fs.readdirSync(path.join(root, 'utils')).filter(name => name.endsWith('Catalog.js'))) {
      const origin = path.join(root, 'utils', file);
      const source = fs.readFileSync(origin, 'utf8');
      for (const [, name] of source.matchAll(/require\(['"](\.\.\/data\/quran\/[^'"]+\.json)['"]\)/g)) {
        const result = graph.resolveDependency(origin, { name, data: { isESMImport: false, locs: [] } }, 'android', {});
        const expected = path.resolve(path.dirname(origin), name);
        if (result.type !== 'sourceFile' || result.filePath !== expected) throw Error(`Unexpected resolution: ${file} -> ${name}`);
        await graph.getOrComputeSha1(result.filePath);
        JSON.parse(fs.readFileSync(result.filePath, 'utf8'));
        checked++;
      }
      for (const [, name] of source.matchAll(/require\(['"](\.\.\/assets\/quran-vectors\/[^'"]+\.zip)['"]\)/g)) {
        const result = graph.resolveDependency(origin, { name, data: { isESMImport: false, locs: [] } }, 'android', {});
        const expected = path.resolve(path.dirname(origin), name);
        // DependencyGraph normalizes a resolved asset to its base sourceFile;
        // the transformer subsequently handles it using resolver.assetExts.
        if (!config.resolver.assetExts.includes('zip') || result.type !== 'sourceFile' || result.filePath !== expected) throw Error(`Unexpected asset resolution: ${file} -> ${name}`);
        await graph.getOrComputeSha1(expected); assets++;
      }
    }
    if (checked !== 3556 || assets !== 1208) throw Error(`Expected 3556 generated modules and 1208 vector assets, checked ${checked}/${assets}`);
    console.log(`Metro resolves and hashes all ${checked} generated Quran modules and ${assets} vector page assets, including page 81 in both editions.`);
  } finally { await graph.end(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
