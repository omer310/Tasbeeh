package expo.modules.homewidgets

import android.app.Activity
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import org.json.JSONObject
import java.text.Normalizer
import java.util.UUID

class DuaWidgetConfigurationActivity : Activity() {
  private var widgetId = AppWidgetManager.INVALID_APPWIDGET_ID
  private val selected = linkedSetOf<String>()
  private var filtered = emptyList<JSONObject>()
  private lateinit var adapter: BaseAdapter
  private lateinit var count: TextView
  private lateinit var save: Button
  private val ar get() = WidgetStore.arabic(this)
  private val ink get() = Color.parseColor(if (WidgetStore.dark(this)) "#EDF6EE" else "#19382B")
  private fun text(en: String, arabic: String) = if (ar) arabic else en
  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
  private fun label(value: String, size: Float) = TextView(this).apply { text = value; textSize = size; setTextColor(ink); setPadding(dp(6), dp(8), dp(6), dp(8)) }

  override fun onCreate(state: Bundle?) {
    super.onCreate(state)
    setResult(RESULT_CANCELED)
    widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
    val pin = intent.getBooleanExtra("pin", false)
    if (!pin && widgetId !in WidgetRenderer.ids(this, DuaWidgetProvider::class.java)) { finish(); return }
    selected.addAll(state?.getStringArrayList("selected") ?: if (pin) WidgetStore.defaults else WidgetStore.selection(this, widgetId))
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      layoutDirection = if (ar) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR
      setBackgroundColor(Color.parseColor(if (WidgetStore.dark(this@DuaWidgetConfigurationActivity)) "#17231D" else "#FAFBF8"))
      setPadding(dp(20), dp(16), dp(20), dp(16))
      setOnApplyWindowInsetsListener { view, insets ->
        @Suppress("DEPRECATION")
        view.setPadding(dp(20) + insets.systemWindowInsetLeft, dp(16) + insets.systemWindowInsetTop, dp(20) + insets.systemWindowInsetRight, dp(16) + insets.systemWindowInsetBottom)
        insets
      }
    }
    val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
    header.addView(Button(this).apply { text = text("Back", "رجوع"); setOnClickListener { finish() } })
    header.addView(label(text("Your Dua widget", "الأدعية على شاشتك"), 23f).apply { setTypeface(null, Typeface.BOLD) }, LinearLayout.LayoutParams(0, -2, 1f))
    root.addView(header)
    root.addView(label(text("Choose 1–4 occasions. Read and scroll on your home screen; use the arrows to move through their Duas.", "اختر من مناسبة إلى أربع. اقرأ الأدعية ومرّر النص على شاشتك الرئيسية، وتنقّل بينها بالأسهم."), 15f))
    count = label("", 14f); root.addView(count)
    val search = EditText(this).apply {
      hint = text("Search occasions", "ابحث عن مناسبة"); setTextColor(ink); setHintTextColor(ink)
      setSingleLine(true); inputType = android.text.InputType.TYPE_CLASS_TEXT
      setPadding(dp(12), dp(8), dp(12), dp(8))
      background = GradientDrawable().apply { setColor(if (WidgetStore.dark(this@DuaWidgetConfigurationActivity)) 0xFF283B30.toInt() else 0xFFE8F0E9.toInt()); cornerRadius = dp(14).toFloat() }
    }
    root.addView(search, LinearLayout.LayoutParams(-1, dp(52)))
    val catalogue = WidgetStore.catalogue(this).sortedBy { category ->
      val index = WidgetStore.defaults.indexOf(category.getString("id")); if (index < 0) 1000 else index
    }
    filtered = catalogue
    adapter = object : BaseAdapter() {
      override fun getCount() = filtered.size
      override fun getItem(position: Int) = filtered[position]
      override fun getItemId(position: Int) = position.toLong()
      override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val category = filtered[position]
        val chosen = selected.indexOf(category.getString("id"))
        return label("${if (chosen >= 0) "✓ ${chosen + 1}  " else "○  "}${category.getString(if (ar) "titleAr" else "title")}", 16f).apply {
          minHeight = dp(58); gravity = Gravity.CENTER_VERTICAL
          contentDescription = "${text}, ${if (chosen >= 0) text("selected", "محدد") else text("not selected", "غير محدد") }"
          setTypeface(null, if (chosen >= 0) Typeface.BOLD else Typeface.NORMAL)
        }
      }
    }
    val list = ListView(this).apply {
      adapter = this@DuaWidgetConfigurationActivity.adapter; dividerHeight = 0
      setOnItemClickListener { _, _, position, _ ->
        val id = filtered[position].getString("id")
        if (!selected.remove(id)) {
          if (selected.size >= 4) { Toast.makeText(this@DuaWidgetConfigurationActivity, text("Choose up to four occasions. Deselect one to replace it.", "اختر أربع مناسبات كحد أقصى. ألغِ إحداها لاستبدالها."), Toast.LENGTH_SHORT).show(); return@setOnItemClickListener }
          selected.add(id)
        }
        refresh()
      }
    }
    root.addView(list, LinearLayout.LayoutParams(-1, 0, 1f))
    save = Button(this).apply {
      text = if (pin) text("Add Dua widget", "إضافة أداة الأدعية") else text("Save Duas", "حفظ الأدعية")
      setTextColor(Color.WHITE); backgroundTintList = android.content.res.ColorStateList.valueOf(0xFF287457.toInt())
      setOnClickListener { commitSelection(pin) }
    }
    root.addView(save, LinearLayout.LayoutParams(-1, dp(56)))
    search.addTextChangedListener(object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
        val query = normalize(s.toString())
        filtered = catalogue.filter { normalize(it.getString("title") + " " + it.getString("titleAr")).contains(query) }
        adapter.notifyDataSetChanged()
      }
      override fun afterTextChanged(s: Editable?) {}
    })
    setContentView(root); root.requestApplyInsets(); refresh()
  }
  private fun refresh() {
    count.text = "${selected.size} / 4 · " + text("Selected in reading order", "محددة حسب ترتيب القراءة")
    save.isEnabled = selected.isNotEmpty(); adapter.notifyDataSetChanged()
  }
  private fun commitSelection(pin: Boolean) {
    try {
      if (pin) {
        if (Build.VERSION.SDK_INT < 26) { finish(); return }
        val manager = AppWidgetManager.getInstance(this)
        if (!manager.isRequestPinAppWidgetSupported) {
          Toast.makeText(this, text("Add Manarat widgets from your home screen’s widget picker.", "أضف أدوات منارة المسلم من قائمة أدوات الشاشة الرئيسية."), Toast.LENGTH_LONG).show(); return
        }
        val callback = Intent(this, DuaWidgetProvider::class.java).setAction(WidgetRenderer.PINNED)
          .setData(Uri.parse("manarat-widget://pin/${UUID.randomUUID()}"))
          .putStringArrayListExtra("selection", ArrayList(selected))
        // The launcher supplies EXTRA_APPWIDGET_ID on success; keep the target explicit.
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0
        val pending = PendingIntent.getBroadcast(this, 0, callback, flags)
        if (!manager.requestPinAppWidget(ComponentName(this, DuaWidgetProvider::class.java), null, pending)) return
      } else {
        WidgetStore.save(this, widgetId, selected.toList())
        WidgetRenderer.updateDua(this, widgetId, true)
        setResult(RESULT_OK, Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId))
      }
      finish()
    } catch (_: Exception) { Toast.makeText(this, text("Could not save. Please try again.", "تعذّر الحفظ. حاول مرة أخرى."), Toast.LENGTH_LONG).show() }
  }
  override fun onSaveInstanceState(outState: Bundle) { outState.putStringArrayList("selected", ArrayList(selected)); super.onSaveInstanceState(outState) }
  private fun normalize(value: String) = Normalizer.normalize(value.lowercase(), Normalizer.Form.NFD)
    .replace(Regex("[\\p{M}ـ]"), "").replace(Regex("[أإآٱ]"), "ا").trim()
}
