package expo.modules.homewidgets

import android.content.Context
import android.content.res.Configuration
import org.json.JSONArray
import org.json.JSONObject

object WidgetStore {
  private var catalogue: List<JSONObject>? = null
  val defaults = listOf("hisn-10", "hisn-11", "hisn-13", "hisn-28")
  fun prefs(context: Context) = context.getSharedPreferences("manarat_home_widgets", Context.MODE_PRIVATE)
  fun arabic(context: Context) = prefs(context).getString("language", "en") == "ar"
  fun text(context: Context, en: String, ar: String) = if (arabic(context)) ar else en
  fun dark(context: Context): Boolean = when (prefs(context).getString("appearance", "system")) {
    "dark" -> true
    "light" -> false
    else -> context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
  }
  fun catalogue(context: Context): List<JSONObject> {
    catalogue?.let { return it }
    val json = JSONArray(context.assets.open("widget_duas.json").bufferedReader().use { it.readText() })
    return (0 until json.length()).map { json.getJSONObject(it) }.also { catalogue = it }
  }
  fun selection(context: Context, id: Int): List<String> {
    val raw = prefs(context).getString("duas_$id", null) ?: return defaults
    return try { val array = JSONArray(raw); (0 until array.length()).map { array.getString(it) } }
      catch (_: Exception) { defaults }
  }
  fun save(context: Context, id: Int, ids: List<String>) {
    val valid = catalogue(context).map { it.getString("id") }.toSet()
    val chosen = ids.distinct().filter { it in valid }.take(4)
    require(chosen.isNotEmpty())
    check(prefs(context).edit().putString("duas_$id", JSONArray(chosen).toString()).putInt("cursor_$id", 0).commit())
  }
  fun cards(context: Context, id: Int): List<Pair<JSONObject, JSONObject>> {
    val items = catalogue(context).associateBy { it.getString("id") }
    return selection(context, id).flatMap { key ->
      val category = items[key] ?: return@flatMap emptyList()
      val cards = category.getJSONArray("subcategories")
      (0 until cards.length()).map { category to cards.getJSONObject(it) }
    }
  }
  fun cursor(context: Context, id: Int, size: Int): Int = if (size == 0) 0 else Math.floorMod(prefs(context).getInt("cursor_$id", 0), size)
}
