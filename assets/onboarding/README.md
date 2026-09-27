# Onboarding artwork

Generated with the built-in `image_gen` tool on September 7, 2026, using the original project illustrations as style references. Exact prompts are in [prompts.json](prompts.json) and [replacement-prompts.json](replacement-prompts.json).

- [language.png](language.png): English/Arabic language selection; style references `welcome.png`, `tasbeeh2.png`, and `charity.png`.
- [prayer-notifications.png](prayer-notifications.png): prayer notification setup; style references `welcome.png`, `prayer.png`, and `charity.png`. A second generation removed the first output's checkerboard backdrop.
- [hadith-calendar.png](hadith-calendar.png): a unified book/calendar scene replacing the earlier four-panel collage at Omar's request. References: the original `quran.png`, `tasbeeh2.png` and `welcome.png`.
- [charity.png](charity.png): hands nurturing a plant, symbolizing ongoing charity; replaces the original night scene at Omar's request. Uses the same three original style references. The dedication text is unchanged.

The generator returned RGB PNGs despite the transparent-output prompts. `components/OnboardingArtwork.js` clips the generated backplates at display time so their exterior canvas does not appear in the themed app. No raster post-processing or recoloring was applied. Four original transparent illustrations remain in the tour: `welcome.png`, `prayer.png`, `quran.png`, and `tasbeeh2.png`. The original `assets/hadith.png` and `assets/charity.png` are preserved on disk but no longer used by onboarding.

These assets and the restored onboarding are awaiting Omar's visual review. Source checks do not establish device acceptance; no new build or app tests were run.
