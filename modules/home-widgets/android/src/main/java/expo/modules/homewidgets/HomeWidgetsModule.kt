package expo.modules.homewidgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class HomeWidgetsModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)
  override fun definition() = ModuleDefinition {
    Name("HomeWidgets")
    AsyncFunction("setPrayerData") { json: String ->
      require(JSONObject(json).optInt("version") == 1)
      check(WidgetStore.prefs(context).edit().putString("prayer", json).commit())
      WidgetRenderer.updatePrayers(context)
    }
    AsyncFunction("setAppearance") { language: String, appearance: String ->
      check(WidgetStore.prefs(context).edit().putString("language", if (language == "ar") "ar" else "en")
        .putString("appearance", appearance).commit())
      WidgetRenderer.updateAll(context)
    }
    AsyncFunction("addWidget") { kind: String ->
      if (Build.VERSION.SDK_INT < 26) return@AsyncFunction false
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      val manager = AppWidgetManager.getInstance(context)
      if (!manager.isRequestPinAppWidgetSupported) return@AsyncFunction false
      if (kind == "dua") {
        activity.startActivity(Intent(activity, DuaWidgetConfigurationActivity::class.java).putExtra("pin", true))
        true
      } else if (kind == "prayer") manager.requestPinAppWidget(ComponentName(context, PrayerWidgetProvider::class.java), null, null)
      else false
    }.runOnQueue(expo.modules.kotlin.functions.Queues.MAIN)
  }
}
