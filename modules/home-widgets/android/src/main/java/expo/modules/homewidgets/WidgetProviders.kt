package expo.modules.homewidgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import android.widget.RemoteViewsService

class PrayerWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = WidgetRenderer.updatePrayers(context)
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) = WidgetRenderer.updatePrayers(context, id, options)
  override fun onDisabled(context: Context) = WidgetRenderer.updatePrayers(context)
}
class DuaWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { ids.forEach { WidgetRenderer.updateDua(context, it) } }
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) = WidgetRenderer.updateDua(context, id)
  override fun onDeleted(context: Context, ids: IntArray) {
    val editor = WidgetStore.prefs(context).edit()
    ids.forEach { editor.remove("duas_$it").remove("cursor_$it") }; editor.apply()
  }
  override fun onRestored(context: Context, oldIds: IntArray, newIds: IntArray) {
    oldIds.zip(newIds).forEach { (old, new) -> WidgetStore.save(context, new, WidgetStore.selection(context, old)) }
  }
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
    if (id !in WidgetRenderer.ids(context, DuaWidgetProvider::class.java)) return
    if (intent.action?.startsWith(WidgetRenderer.SELECT) == true) {
      val slot = intent.action?.removePrefix(WidgetRenderer.SELECT)?.toIntOrNull() ?: return
      val category = WidgetStore.selection(context, id).getOrNull(slot) ?: return
      val cursor = WidgetStore.cards(context, id).indexOfFirst { it.first.getString("id") == category }
      if (cursor >= 0) {
        WidgetStore.prefs(context).edit().putInt("cursor_$id", cursor).apply()
        WidgetRenderer.updateDua(context, id, true)
      }
      return
    }
    when (intent.action) {
      WidgetRenderer.NEXT, WidgetRenderer.PREVIOUS -> {
        val size = WidgetStore.cards(context, id).size
        if (size == 0) return
        val delta = if (intent.action == WidgetRenderer.NEXT) 1 else -1
        WidgetStore.prefs(context).edit().putInt("cursor_$id", Math.floorMod(WidgetStore.cursor(context, id, size) + delta, size)).apply()
        WidgetRenderer.updateDua(context, id, true)
      }
      WidgetRenderer.PINNED -> {
        val selection = intent.getStringArrayListExtra("selection") ?: return
        WidgetStore.save(context, id, selection)
        WidgetRenderer.updateDua(context, id, true)
      }
    }
  }
}
class WidgetRefreshReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == WidgetRenderer.REFRESH) WidgetRenderer.updatePrayers(context)
    else WidgetRenderer.updateAll(context)
  }
}

// Android 8–11 fallback. Newer launchers receive the collection inline.
@Suppress("DEPRECATION")
class DuaWidgetContentService : RemoteViewsService() {
  override fun onGetViewFactory(intent: Intent): RemoteViewsFactory = object : RemoteViewsFactory {
    private val widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
    override fun onCreate() {}
    override fun onDataSetChanged() {}
    override fun onDestroy() {}
    override fun getCount() = 1
    override fun getViewAt(position: Int): RemoteViews = WidgetRenderer.duaBody(applicationContext, widgetId)
    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount() = 1
    override fun getItemId(position: Int) = 0L
    override fun hasStableIds() = true
  }
}
