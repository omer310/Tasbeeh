import expo.modules.homewidgets.PrayerWidgetSize;

/** Source unit tests only; no Android app, emulator or APK is built/launched. */
public class PrayerWidgetSizeTest {
  private static void require(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
  public static void main(String[] args) {
    PrayerWidgetSize tiny = PrayerWidgetSize.forSize(100, 48, 1);
    require(!tiny.dashboard && !tiny.strip && tiny.time && !tiny.countdown, "smallest card prioritizes prayer/time");
    require((tiny.nameSp + tiny.timeSp) * 1.25f + 4 + tiny.padding * 2 <= 48.01f, "smallest card's lines fit");
    PrayerWidgetSize wide = PrayerWidgetSize.forSize(300, 48, 1);
    require(wide.strip && wide.countdown && !wide.hint, "one-row strip preserves next-prayer countdown");
    require((wide.nameSp + wide.timeSp) * 1.25f + 4 + wide.padding * 2 <= 48.01f, "strip labels fit");
    require(wide.countdownSp * 1.25f + wide.padding * 2 <= 48.01f, "strip countdown fits");
    require(!PrayerWidgetSize.forSize(150, 180, 1).dashboard, "small square avoids five squeezed columns");
    for (int[] size : new int[][] {{210,112}, {230,180}, {350,180}}) {
      PrayerWidgetSize p = PrayerWidgetSize.forSize(size[0], size[1], 1);
      require(p.dashboard && !p.agenda && !p.hero, "reference-like compact/wide sizes keep all five times");
    }
    PrayerWidgetSize large = PrayerWidgetSize.forSize(350, 300, 1);
    require(large.hero && large.details, "large dashboard adds prominent next prayer and location/date");
    require(!PrayerWidgetSize.forSize(350, 231, 1).hero, "hero needs height for timetable too");
    require(PrayerWidgetSize.forSize(350, 232, 1).hero, "hero breakpoint");
    require(PrayerWidgetSize.forSize(150, 310, 1).agenda, "narrow tall cards use a full vertical timetable");
    require(!PrayerWidgetSize.forSize(150, 309, 1).agenda, "agenda height breakpoint");
    require(!PrayerWidgetSize.forSize(350, 300, 2).dashboard, "large fonts reduce detail before squeezing text");
    require(!PrayerWidgetSize.forSize(100, 48, 2).time, "large fonts have a minimal fallback");
    require(PrayerWidgetSize.forSize(Float.NaN, -1, 0).dashboard, "missing launcher dimensions have a useful default");
    for (float scale : new float[] {1, 1.3f, 2}) for (int w = 100; w <= 700; w += 20) for (int h = 48; h <= 600; h += 12) {
      PrayerWidgetSize p = PrayerWidgetSize.forSize(w, h, scale);
      require(Float.isFinite(p.nameSp) && p.nameSp > 0 && p.countdownSp > 0, "finite sizing across host ranges");
      if (!p.dashboard) continue;
      // Conservative line-height budgets for XML: header, hero, footer, margins,
      // AM/PM and all five rows/columns. This catches content hidden by weighted layout.
      float usable = h / scale - p.padding * 2;
      float header = p.agenda ? 49 : p.details ? 34 : 22;
      float hero = p.hero ? (10 + p.nameSp + p.timeSp) * 1.25f + 25 : 0;
      float footer = p.hero ? 0 : p.footerSp * 1.25f;
      float location = p.details ? 16.5f : 0;
      float schedule = p.agenda ? 5 * (p.cellTimeSp * 1.25f + 6) : (p.cellNameSp + p.cellTimeSp + p.periodSp) * 1.25f + 11;
      require(header + hero + footer + location + schedule + 8 <= usable + .01f,
        "text exceeds dashboard budget at " + w + "x" + h + " font " + scale);
    }
    System.out.println("Prayer widget sizing: reference sizes, tiny/strip/grid/agenda, font-scale, boundaries and full-content budgets passed.");
  }
}
