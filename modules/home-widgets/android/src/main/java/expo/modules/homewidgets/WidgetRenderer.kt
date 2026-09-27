package expo.modules.homewidgets

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

object WidgetRenderer {
  const val REFRESH = "expo.modules.homewidgets.REFRESH"
  const val PREVIOUS = "expo.modules.homewidgets.PREVIOUS"
  const val NEXT = "expo.modules.homewidgets.NEXT"
  const val PINNED = "expo.modules.homewidgets.PINNED"
  const val SELECT = "expo.modules.homewidgets.SELECT."
  fun ids(context: Context, type: Class<*>) = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, type))
  fun launch(context: Context, url: String): PendingIntent {
    val intent = requireNotNull(context.packageManager.getLaunchIntentForPackage(context.packageName))
      .setAction(Intent.ACTION_VIEW).setData(Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
  fun action(context: Context, id: Int, action: String): PendingIntent = PendingIntent.getBroadcast(context, id,
    Intent(context, DuaWidgetProvider::class.java).setAction(action).setData(Uri.parse("manarat-widget://$id/$action"))
      .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

  fun style(context: Context, views: RemoteViews, textIds: List<Int>, subtleIds: List<Int> = emptyList()) {
    val dark = WidgetStore.dark(context)
    views.setInt(R.id.widget_root, "setBackgroundResource", if (dark) R.drawable.manarat_widget_dark else R.drawable.manarat_widget_light)
    views.setInt(R.id.widget_root, "setLayoutDirection", if (WidgetStore.arabic(context)) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR)
    textIds.forEach { views.setTextColor(it, Color.parseColor(if (dark) "#EDF6EE" else "#19382B")) }
    subtleIds.forEach { views.setTextColor(it, Color.parseColor(if (dark) "#BCD0C1" else "#536F5F")) }
  }
  fun updateAll(context: Context) { updatePrayers(context); ids(context, DuaWidgetProvider::class.java).forEach { updateDua(context, it) } }
  @Synchronized fun updatePrayers(context: Context, resizedId: Int = AppWidgetManager.INVALID_APPWIDGET_ID, resizedOptions: Bundle? = null) {
    val manager = AppWidgetManager.getInstance(context)
    val widgetIds = ids(context, PrayerWidgetProvider::class.java)
    val alarm = context.getSystemService(AlarmManager::class.java)
    val pending = PendingIntent.getBroadcast(context, 0, Intent(context, WidgetRefreshReceiver::class.java).setAction(REFRESH), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    alarm.cancel(pending)
    if (widgetIds.isEmpty()) return
    val saved = try { JSONObject(WidgetStore.prefs(context).getString("prayer", "{}") ?: "{}") } catch (_: Exception) { JSONObject() }
    val now = System.currentTimeMillis()
    val array = saved.optJSONArray("entries")
    val entries = (0 until (array?.length() ?: 0)).mapNotNull { array?.optJSONObject(it) }
      .filter { it.optLong("at") > now }.sortedBy { it.optLong("at") }
    // Missing days must not advertise a prayer several days away as the next one.
    val next = entries.firstOrNull()?.takeIf { it.optLong("at") <= now + 36L * 60 * 60 * 1000 }
    val day = PrayerWidgetLayout.day(saved, now)
    val refreshAt = listOfNotNull(next?.optLong("at"), day?.optLong("end")).filter { it > now }.minOrNull()
    var countdown = false
    if (refreshAt != null) {
      val at = refreshAt
      // Prayer boundaries and local midnight; no per-second service, JS or network.
      try {
        if (Build.VERSION.SDK_INT < 31 || alarm.canScheduleExactAlarms()) {
          alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
          countdown = true
        } else alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
      } catch (_: SecurityException) { alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending) }
    }
    widgetIds.forEach { id ->
      val options = if (id == resizedId && resizedOptions != null) resizedOptions else manager.getAppWidgetOptions(id)
      val views = PrayerWidgetLayout.render(context, options, saved, next, day, countdown, now)
      manager.updateAppWidget(id, views)
    }
  }

  fun duaBody(context: Context, id: Int): RemoteViews {
    val cards = WidgetStore.cards(context, id)
    val card = cards.getOrNull(WidgetStore.cursor(context, id, cards.size))?.second
    val body = RemoteViews(context.packageName, R.layout.manarat_dua_body)
    body.setTextViewText(R.id.dua_arabic, card?.optString("arabic") ?: "")
    body.setTextColor(R.id.dua_arabic, Color.parseColor(if (WidgetStore.dark(context)) "#EDF6EE" else "#19382B"))
    val count = card?.optInt("repetitions", 1) ?: 1
    val reference = if (WidgetStore.arabic(context)) card?.optString("referenceAr") else card?.optString("reference")
    body.setTextViewText(R.id.dua_reference, "${reference.orEmpty()}\n${WidgetStore.text(context, "Repeat $count", "التكرار: $count")}")
    body.setTextColor(R.id.dua_reference, Color.parseColor(if (WidgetStore.dark(context)) "#BCD0C1" else "#536F5F"))
    return body
  }
  @Synchronized fun updateDua(context: Context, id: Int, resetScroll: Boolean = false) {
    val manager = AppWidgetManager.getInstance(context)
    if (id !in ids(context, DuaWidgetProvider::class.java)) return
    val cards = WidgetStore.cards(context, id)
    if (cards.isEmpty()) return
    val cursor = WidgetStore.cursor(context, id, cards.size)
    val (category, card) = cards[cursor]
    val views = RemoteViews(context.packageName, R.layout.manarat_dua_widget)
    val shortcuts = listOf(R.id.dua_shortcut_0, R.id.dua_shortcut_1, R.id.dua_shortcut_2, R.id.dua_shortcut_3)
    style(context, views, listOf(R.id.dua_title, R.id.dua_previous, R.id.dua_next, R.id.dua_edit, R.id.dua_open) + shortcuts, listOf(R.id.dua_position))
    val chosen = WidgetStore.selection(context, id)
    val catalogue = WidgetStore.catalogue(context).associateBy { it.getString("id") }
    shortcuts.forEachIndexed { index, viewId ->
      val item = chosen.getOrNull(index)?.let { catalogue[it] }
      views.setViewVisibility(viewId, if (item != null && chosen.size > 1) View.VISIBLE else View.GONE)
      if (item != null) {
        val title = item.getString(if (WidgetStore.arabic(context)) "titleAr" else "title")
        val active = item.getString("id") == category.getString("id")
        views.setTextViewText(viewId, title)
        views.setContentDescription(viewId, title + if (active) WidgetStore.text(context, ", selected", "، محدد") else "")
        views.setInt(viewId, "setBackgroundResource", if (active) {
          if (WidgetStore.dark(context)) R.drawable.manarat_widget_selected_dark else R.drawable.manarat_widget_selected
        } else android.R.color.transparent)
        views.setOnClickPendingIntent(viewId, action(context, id, "$SELECT$index"))
      }
    }
    views.setViewVisibility(R.id.dua_shortcuts, if (chosen.size > 1) View.VISIBLE else View.GONE)
    views.setTextViewText(R.id.dua_title, category.getString(if (WidgetStore.arabic(context)) "titleAr" else "title"))
    views.setTextViewText(R.id.dua_position, "${cursor + 1} / ${cards.size}")
    views.setContentDescription(R.id.dua_previous, WidgetStore.text(context, "Previous Dua", "الدعاء السابق"))
    views.setContentDescription(R.id.dua_next, WidgetStore.text(context, "Next Dua", "الدعاء التالي"))
    views.setContentDescription(R.id.dua_edit, WidgetStore.text(context, "Choose Duas", "اختيار الأدعية"))
    views.setContentDescription(R.id.dua_open, WidgetStore.text(context, "Open this Dua in the app", "افتح هذا الدعاء في التطبيق"))
    views.setTextViewText(R.id.dua_previous, if (WidgetStore.arabic(context)) "›" else "‹")
    views.setTextViewText(R.id.dua_next, if (WidgetStore.arabic(context)) "‹" else "›")
    views.setOnClickPendingIntent(R.id.dua_previous, action(context, id, PREVIOUS))
    views.setOnClickPendingIntent(R.id.dua_next, action(context, id, NEXT))
    views.setOnClickPendingIntent(R.id.dua_open, launch(context, "manarat://widget/dua/${category.getString("id")}/${card.getString("id")}"))
    val edit = Intent(context, DuaWidgetConfigurationActivity::class.java).setData(Uri.parse("manarat-widget://configure/$id"))
      .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id)
    views.setOnClickPendingIntent(R.id.dua_edit, PendingIntent.getActivity(context, id, edit, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
    if (Build.VERSION.SDK_INT >= 31) {
      views.setRemoteAdapter(R.id.dua_content, RemoteViews.RemoteCollectionItems.Builder().setViewTypeCount(1).setHasStableIds(true)
        .addItem(card.getString("id").hashCode().toLong(), duaBody(context, id)).build())
    } else {
      @Suppress("DEPRECATION")
      views.setRemoteAdapter(R.id.dua_content, Intent(context, DuaWidgetContentService::class.java)
        .setData(Uri.parse("manarat-widget://content/$id")).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id))
    }
    if (resetScroll) views.setScrollPosition(R.id.dua_content, 0)
    manager.updateAppWidget(id, views)
    if (Build.VERSION.SDK_INT < 31) {
      @Suppress("DEPRECATION")
      manager.notifyAppWidgetViewDataChanged(id, R.id.dua_content)
    }
  }
}
