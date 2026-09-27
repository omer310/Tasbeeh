# Dua icons

The Duas discovery screen uses the rounded-stroke [Hugeicons family](https://github.com/hugeicons/hugeicons) and two original symbols in the same line style. Its subjects remain distinct from the bottom navigation: no repeated prayer rug, Tasbih beads, Dua hands or Kaaba. Sixteen shapes from `@hugeicons/core-free-icons@4.3.5` and the original heart/shield and pilgrim artwork in `data/duaOriginalIcons.json` are bundled as eighteen static SVG strings; the app needs no icon network requests or added package dependency. The vendor MIT notice is retained in `assets/licenses/hugeicons.txt`; the two original symbols are app artwork. `scripts/sync-dua-icons.cjs` reproduces the bundle by parsing static module literals without executing downloaded code, then merging the originals.

| Category | Symbol |
| --- | --- |
| Prayer & worship | Worshipper in prostration ([Sujood](https://hugeicons.com/icon/sujood)) |
| Daily life | Lantern |
| Family & kindness | Giving hand |
| Comfort & protection | Heart protected by a shield |
| Health & loss | Supporting hand and heart |
| Food & fasting | Dates |
| Travel | Camel |
| Nature & weather | Rain cloud |
| Hajj & Umrah | Pilgrim wearing ihram |

Everyday shortcuts use a house, mosque, seated worshipper for After Prayer, sleep, sunrise, dates, a dish, restroom and wudu artwork. Entering and leaving use distinct directional badges on their place icon. Morning/evening Athkar use sunrise and a crescent with a star. Colors follow the active theme; accessible button names remain the occasion names. These changes affect Dua discovery artwork; the bottom navigation, Hisn text, occasion IDs, variants and saved Duas retain their existing behavior.

On 2026-09-23, Omar requested the distinct subject choices after spotting the repeated navigation artwork. The four replacement symbols were rendered at 28 px and enlarged in light/dark palettes (`output/dua-icons/dua-icons-preview.png`). All twelve everyday icon names resolve, all three existing Dua discovery tests pass, and touched JavaScript lints cleanly. Omar subsequently confirmed the update works and looks good on his device; these icon replacements are accepted.
