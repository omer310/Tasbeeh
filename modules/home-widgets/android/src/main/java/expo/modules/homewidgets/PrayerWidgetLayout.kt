package expo.modules.homewidgets

import android.appwidget.AppWidgetManager
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.util.SizeF
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/** Every instance keeps its own layout on resize, prayer transitions and midnight. */
object PrayerWidgetLayout {
  fun day(saved: JSONObject, now: Long): JSONObject? {
    val days = saved.optJSONArray("days") ?: return null
    return (0 until days.length()).mapNotNull { days.optJSONObject(it) }
      .firstOrNull { now >= it.optLong("start") && now < it.optLong("end") }
  }

  fun render(context: Context, options: Bundle, saved: JSONObject, next: JSONObject?, day: JSONObject?, countdown: Boolean, now: Long): RemoteViews {
    fun at(size: SizeF) = content(context, size, saved, next, day, countdown, now)
    if (Build.VERSION.SDK_INT >= 31) {
      @Suppress("DEPRECATION")
      val sizes = options.getParcelableArrayList<SizeF>(AppWidgetManager.OPTION_APPWIDGET_SIZES)
        ?.filter { it.width.isFinite() && it.height.isFinite() && it.width > 0 && it.height > 0 }?.distinct()?.take(16)
      if (!sizes.isNullOrEmpty()) return RemoteViews(sizes.associateWith { at(it) })
    }
    val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 280).takeIf { it > 0 } ?: 280
    val maxWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, minWidth).coerceAtLeast(minWidth)
    val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 180).takeIf { it > 0 } ?: 180
    val maxHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, minHeight).coerceAtLeast(minHeight)
    return RemoteViews(at(SizeF(maxWidth.toFloat(), minHeight.toFloat())), at(SizeF(minWidth.toFloat(), maxHeight.toFloat())))
  }

  private fun content(context: Context, size: SizeF, saved: JSONObject, next: JSONObject?, day: JSONObject?, canCount: Boolean, now: Long): RemoteViews {
    val layout = PrayerWidgetSize.forSize(size.width, size.height, context.resources.configuration.fontScale)
    // Snapshots from the previous APK still render a useful next-prayer card until JS syncs.
    val dashboard = layout.dashboard && day != null
    val resource = when {
      dashboard && layout.agenda -> R.layout.manarat_prayer_widget_agenda
      dashboard -> R.layout.manarat_prayer_widget
      layout.strip -> R.layout.manarat_prayer_widget_strip
      else -> R.layout.manarat_prayer_widget_compact
    }
    val views = RemoteViews(context.packageName, resource)
    val dark = WidgetStore.dark(context)
    val main = Color.parseColor(if (dark) "#F2F6EA" else "#163B2F")
    val muted = Color.parseColor(if (dark) "#B9CDBF" else "#536B5C")
    val accent = Color.parseColor(if (dark) "#E4C57D" else "#806022")
    val locale = if (WidgetStore.arabic(context)) Locale.forLanguageTag("ar") else Locale.ENGLISH
    fun tr(en: String, ar: String) = WidgetStore.text(context, en, ar)
    fun visible(id: Int, show: Boolean) = views.setViewVisibility(id, if (show) View.VISIBLE else View.GONE)
    fun color(id: Int, color: Int) = views.setTextColor(id, color)
    fun sp(id: Int, value: Float) = views.setTextViewTextSize(id, TypedValue.COMPLEX_UNIT_SP, value)
    fun stamp(at: Long, zone: String, pattern: String) = SimpleDateFormat(pattern, locale).apply { timeZone = TimeZone.getTimeZone(zone) }.format(Date(at))
    val hour24 = saved.optString("timeFormat") == "24"
    fun time(at: Long, zone: String) = stamp(at, zone, if (hour24) "HH:mm" else "h:mm a")
    val zone = next?.optString("timeZone", "UTC") ?: day?.optString("timeZone", "UTC") ?: "UTC"
    val nextName = next?.let { name(context, it.optString("prayer")) } ?: tr("Prayers", "الصلاة")
    val anotherDay = next != null && stamp(next.optLong("at"), zone, "yyyy-MM-dd") != stamp(now, zone, "yyyy-MM-dd")
    val nextTime = next?.let { time(it.optLong("at"), zone) } ?: tr("Tap to refresh", "اضغط للتحديث")
    val count = next != null && canCount && layout.countdown
    fun timer(id: Int, format: String) {
      if (count) {
        views.setChronometerCountDown(id, true)
        views.setChronometer(id, SystemClock.elapsedRealtime() + next!!.getLong("at") - now, format, true)
      }
    }
    views.setInt(R.id.widget_root, "setBackgroundResource", if (dark) R.drawable.manarat_prayer_dark else R.drawable.manarat_prayer_light)
    views.setInt(R.id.widget_root, "setLayoutDirection", if (WidgetStore.arabic(context)) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR)
    val pad = (layout.padding * context.resources.displayMetrics.density).toInt()
    views.setViewPadding(R.id.widget_root, pad, pad, pad, pad)
    views.setOnClickPendingIntent(R.id.widget_root, WidgetRenderer.launch(context, "manarat://widget/prayer"))
    views.setTextViewText(R.id.prayer_name, nextName)
    views.setContentDescription(R.id.prayer_name, nextName + if (anotherDay) tr(", tomorrow", "، غدًا") else "")
    views.setTextViewText(R.id.prayer_time, nextTime)
    views.setTextViewText(R.id.prayer_hint, if (count) tr("remaining", "متبقي") else tr("Tap for all times", "اضغط لجميع المواقيت"))
    color(R.id.prayer_name, main); color(R.id.prayer_time, muted)
    color(R.id.prayer_countdown, accent); color(R.id.prayer_hint, muted)
    sp(R.id.prayer_name, layout.nameSp); sp(R.id.prayer_time, layout.timeSp)
    sp(R.id.prayer_countdown, layout.countdownSp)
    visible(R.id.prayer_countdown, count)
    visible(R.id.prayer_time, layout.time)
    timer(R.id.prayer_countdown, "%s")
    if (!layout.strip || dashboard) {
      views.setTextViewText(R.id.prayer_label, if (next == null) tr("UPDATE YOUR TIMES", "تحديث المواقيت") else if (anotherDay) tr("NEXT · TOMORROW", "القادمة · غدًا") else tr("NEXT PRAYER", "الصلاة القادمة"))
      color(R.id.prayer_label, accent)
      views.setTextViewText(R.id.prayer_location, saved.optString("location").ifBlank { tr("Manarat al-Muslim", "منارة المسلم") })
      color(R.id.prayer_location, muted)
    }
    if (!dashboard) {
      visible(R.id.prayer_hint, layout.hint)
      if (layout.strip) visible(R.id.prayer_timer_group, count || layout.hint)
      else {
        val h = size.height / context.resources.configuration.fontScale.coerceAtLeast(1f)
        visible(R.id.prayer_label, h >= 140)
        visible(R.id.prayer_location, h >= 170)
      }
      return views
    }

    val today = requireNotNull(day)
    val dayZone = today.optString("timeZone", "UTC")
    val hijri = today.optJSONObject("hijri")
    val number = NumberFormat.getIntegerInstance(locale).apply { isGroupingUsed = false }
    val month = hijri?.optString(if (WidgetStore.arabic(context)) "monthAr" else "monthShort", hijri.optString("month")).orEmpty()
    val hijriLabel = if (hijri != null && month.isNotBlank()) "${number.format(hijri.optInt("day"))} $month" else tr("Today's prayers", "صلوات اليوم")
    views.setTextViewText(R.id.prayer_hijri, hijriLabel)
    views.setTextViewText(R.id.prayer_date, stamp(now, dayZone, "EEE, d MMM yyyy"))
    color(R.id.prayer_hijri, main); color(R.id.prayer_date, muted)
    visible(R.id.prayer_date, layout.details)
    visible(R.id.prayer_hero, layout.hero)
    visible(R.id.prayer_location, layout.details)
    val sunrise = today.optLong("sunrise")
    visible(R.id.prayer_sunrise_group, sunrise > 0)
    if (sunrise > 0) {
      val full = tr("Sunrise", "الشروق") + " " + time(sunrise, dayZone)
      val roomy = size.width / context.resources.configuration.fontScale.coerceAtLeast(1f) >= 330 || layout.agenda
      views.setTextViewText(R.id.prayer_sunrise, if (roomy) full else time(sunrise, dayZone))
      views.setContentDescription(R.id.prayer_sunrise, full)
      views.setInt(R.id.prayer_sunrise_icon, "setColorFilter", accent)
      color(R.id.prayer_sunrise, muted)
    }
    visible(R.id.prayer_footer_countdown, !layout.hero && count)
    visible(R.id.prayer_footer, !layout.hero && !count)
    timer(R.id.prayer_footer_countdown, tr("$nextName in %s", "$nextName بعد %s"))
    sp(R.id.prayer_footer_countdown, layout.footerSp); color(R.id.prayer_footer_countdown, accent)
    sp(R.id.prayer_footer, layout.footerSp); color(R.id.prayer_footer, accent)
    views.setTextViewText(R.id.prayer_footer, if (next != null) "$nextName · $nextTime" else tr("Tap to refresh times", "اضغط لتحديث المواقيت"))

    val prayers = today.optJSONArray("prayers")
    val byName = (0 until (prayers?.length() ?: 0)).mapNotNull { prayers?.optJSONObject(it) }.associateBy { it.optString("prayer") }
    views.removeAllViews(R.id.prayer_schedule)
    listOf("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha").forEach { prayer ->
      val item = byName[prayer]
      val at = item?.optLong("at") ?: 0L
      val active = at > 0 && at == next?.optLong("at")
      val cell = RemoteViews(context.packageName, if (layout.agenda) R.layout.manarat_prayer_row else R.layout.manarat_prayer_cell)
      val fullName = name(context, prayer)
      val small = !layout.agenda && size.width / context.resources.configuration.fontScale.coerceAtLeast(1f) < 300
      val label = if (small && !WidgetStore.arabic(context) && prayer == "Maghrib") "Magh." else fullName
      cell.setTextViewText(R.id.prayer_cell_name, label)
      cell.setTextViewText(R.id.prayer_cell_time, if (at > 0) stamp(at, dayZone, if (hour24) "HH:mm" else "h:mm") else "—")
      cell.setTextViewText(R.id.prayer_cell_period, if (at > 0 && !hour24) stamp(at, dayZone, "a") else "")
      cell.setViewVisibility(R.id.prayer_cell_period, if (at > 0 && !hour24) View.VISIBLE else View.GONE)
      cell.setTextViewTextSize(R.id.prayer_cell_name, TypedValue.COMPLEX_UNIT_SP, layout.cellNameSp)
      cell.setTextViewTextSize(R.id.prayer_cell_time, TypedValue.COMPLEX_UNIT_SP, layout.cellTimeSp)
      cell.setTextViewTextSize(R.id.prayer_cell_period, TypedValue.COMPLEX_UNIT_SP, layout.periodSp)
      cell.setTextColor(R.id.prayer_cell_name, if (active) accent else muted)
      cell.setTextColor(R.id.prayer_cell_time, if (active) accent else if (at <= now) muted else main)
      cell.setTextColor(R.id.prayer_cell_period, if (active) accent else muted)
      cell.setInt(R.id.prayer_cell, "setBackgroundResource", if (active) {
        if (dark) R.drawable.manarat_prayer_active_dark else R.drawable.manarat_prayer_active
      } else android.R.color.transparent)
      cell.setContentDescription(R.id.prayer_cell, fullName + ", " + (if (at > 0) time(at, dayZone) else tr("Unavailable", "غير متاح")) + if (active) tr(", next prayer", "، الصلاة القادمة") else "")
      views.addView(R.id.prayer_schedule, cell)
    }
    return views
  }

  private fun name(context: Context, name: String): String {
    val arabic = mapOf("Fajr" to "الفجر", "Dhuhr" to "الظهر", "Asr" to "العصر", "Maghrib" to "المغرب", "Isha" to "العشاء")
    return if (WidgetStore.arabic(context)) arabic[name] ?: name else name
  }
}
