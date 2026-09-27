package expo.modules.homewidgets;

/** Layout budgets in effective dp, reduced by accessibility font scale. */
public final class PrayerWidgetSize {
  public final boolean dashboard, agenda, strip, hero, details, time, countdown, hint;
  public final int padding;
  public final float nameSp, timeSp, countdownSp, cellNameSp, cellTimeSp, periodSp, footerSp;

  private PrayerWidgetSize(float width, float height, float fontScale) {
    float scale = Math.max(1f, fontScale), w = width / scale, h = height / scale;
    agenda = w >= 125f && w < 210f && h >= 310f;
    dashboard = agenda || (w >= 210f && h >= 112f);
    strip = !dashboard && w >= 220f;
    hero = dashboard && !agenda && h >= 232f;
    details = dashboard && (agenda || h >= 260f);
    padding = h < 125f ? 6 : h < 184f ? 10 : 14;
    float textWidth = Math.max(32f, (width - padding * 2) / scale);
    time = h >= 40f;
    countdown = dashboard || strip || h >= 84f;
    hint = strip ? h >= 75f : h >= 145f;
    timeSp = h < 125f ? 11f : 13f;
    float preferredName = dashboard ? clamp(agenda ? textWidth / 5f : textWidth / 9f, 21f, 36f)
      : strip ? clamp(textWidth / 10f, 18f, 26f) : clamp(Math.min(textWidth / 4.5f, h / 6f), 14f, 36f);
    float available = (height - padding * 2) / scale;
    nameSp = Math.min(preferredName, Math.max(10f, (available - (time ? timeSp * 1.25f + 4f : 0f)) / 1.25f));
    countdownSp = dashboard ? clamp(agenda ? textWidth / 6f : textWidth / 10f, 18f, 34f)
      : strip ? Math.min(clamp(textWidth / 9f, 20f, 34f), Math.max(12f, (available - (hint ? 15f : 0f)) / 1.25f))
      : clamp(Math.min(textWidth / 5f, h / 5f), 14f, 36f);
    cellNameSp = agenda ? 12f : clamp(textWidth / 5f / 4.5f, 10f, h < 140f ? 11f : 14f);
    cellTimeSp = agenda ? 14f : clamp(textWidth / 5f / 3.7f, 11f, h < 140f ? 13f : 20f);
    periodSp = agenda ? 10f : clamp(cellTimeSp * .7f, 9f, 11f);
    footerSp = clamp(textWidth / 17f, 11f, h < 140f ? 14f : 16f);
  }
  public static PrayerWidgetSize forSize(float width, float height, float fontScale) {
    return new PrayerWidgetSize(valid(width, 280f), valid(height, 180f), valid(fontScale, 1f));
  }
  private static float valid(float value, float fallback) {
    return Float.isNaN(value) || Float.isInfinite(value) || value <= 0 ? fallback : value;
  }
  private static float clamp(float value, float min, float max) { return Math.max(min, Math.min(max, value)); }
}
