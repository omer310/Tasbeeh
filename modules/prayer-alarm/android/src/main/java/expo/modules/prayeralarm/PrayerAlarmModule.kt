package expo.modules.prayeralarm

import android.app.*
import android.content.*
import android.media.*
import android.net.Uri
import android.os.*
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class PrayerAlarmModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)
  override fun definition() = ModuleDefinition {
    Name("PrayerAlarm")
    AsyncFunction("getStatus") { PrayerAlarms.status(context).toString() }
    AsyncFunction("replaceSchedule") { json: String -> PrayerAlarms.replace(context, JSONArray(json), false) }
    AsyncFunction("cancelTest") { PrayerAlarms.replace(context, JSONArray(), true) }
    AsyncFunction("scheduleTest") { json: String -> PrayerAlarms.replace(context, JSONArray().put(JSONObject(json)), true) }
    AsyncFunction("openAlarmSettings") {
      if (Build.VERSION.SDK_INT >= 31) context.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
        Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
    AsyncFunction("openNotificationSettings") {
      val intent = if (Build.VERSION.SDK_INT >= 26) Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        else Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
    AsyncFunction("stop") { context.stopService(Intent(context, AzanPlaybackService::class.java)) }
  }
}

internal object PrayerAlarms {
  const val PLAYBACK = "prayer-azan-playback-v1"
  const val REMINDERS = "prayer-reminders-v1"
  const val SILENT = "prayer-silent-v1"
  private fun prefs(c: Context) = c.getSharedPreferences("prayer_alarms_v1", Context.MODE_PRIVATE)
  private fun manager(c: Context) = c.getSystemService(AlarmManager::class.java)
  fun exact(c: Context) = Build.VERSION.SDK_INT < 31 || manager(c).canScheduleExactAlarms()
  fun stored(c: Context): JSONArray = try { JSONArray(prefs(c).getString("alarms", "[]")) } catch (_: Exception) { JSONArray() }
  fun channels(c: Context) {
    if (Build.VERSION.SDK_INT < 26) return
    val nm = c.getSystemService(NotificationManager::class.java)
    nm.createNotificationChannel(NotificationChannel(PLAYBACK, "Azan playback", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Full Azan audio with a Stop control. Uses notification volume and respects silent mode and Do Not Disturb."
      setSound(null, null)
    })
    nm.createNotificationChannel(NotificationChannel(REMINDERS, "Prayer reminders", NotificationManager.IMPORTANCE_HIGH))
    nm.createNotificationChannel(NotificationChannel(SILENT, "Silent prayer reminders", NotificationManager.IMPORTANCE_LOW).apply { setSound(null, null) })
  }
  fun status(c: Context): JSONObject {
    channels(c)
    val now = System.currentTimeMillis()
    val alarms = stored(c)
    val future = (0 until alarms.length()).map { alarms.getJSONObject(it).getLong("at") }.filter { it > now }.sorted()
    val audio = c.getSystemService(AudioManager::class.java)
    val nm = c.getSystemService(NotificationManager::class.java)
    return JSONObject().put("exact", exact(c))
      .put("notifications", NotificationManagerCompat.from(c).areNotificationsEnabled())
      .put("playbackChannel", Build.VERSION.SDK_INT < 26 || nm.getNotificationChannel(PLAYBACK)?.importance != NotificationManager.IMPORTANCE_NONE)
      .put("notificationVolume", audio.getStreamVolume(AudioManager.STREAM_NOTIFICATION))
      .put("silentMode", audio.ringerMode != AudioManager.RINGER_MODE_NORMAL)
      .put("doNotDisturb", nm.currentInterruptionFilter != NotificationManager.INTERRUPTION_FILTER_ALL)
      .put("scheduled", future.size).put("through", future.lastOrNull() ?: 0)
      .put("next", future.firstOrNull() ?: 0)
      .put("lastEvent", prefs(c).getString("lastEvent", "No Azan delivered yet"))
  }
  fun record(c: Context, message: String) { prefs(c).edit().putString("lastEvent", message).apply() }
  private fun pending(c: Context, item: JSONObject): PendingIntent = PendingIntent.getBroadcast(c, 0,
    Intent(c, PrayerAlarmReceiver::class.java).setAction("${c.packageName}.PRAYER_ALARM")
      .setData(Uri.parse("manarat-alarm://${item.getString("id")}"))
      .putExtra("alarm", item.toString()), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun set(c: Context, item: JSONObject) {
    manager(c).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, item.getLong("at"), pending(c, item))
  }
  @Synchronized fun replace(c: Context, incoming: JSONArray, test: Boolean): Int {
    channels(c)
    val previous = stored(c)
    val now = System.currentTimeMillis()
    val old = (0 until previous.length()).map { previous.getJSONObject(it) }
    val items = (0 until incoming.length()).map { incoming.getJSONObject(it) }.filter { it.getLong("at") > now }
    // Validate the complete replacement before touching a working schedule.
    items.forEach { require(it.getString("id").matches(Regex("[a-zA-Z0-9_-]+"))); it.getString("prayer"); it.getString("sound") }
    if (items.isNotEmpty()) {
      check(exact(c)) { "Allow Alarms & reminders for Azan at the correct prayer time." }
      check(NotificationManagerCompat.from(c).areNotificationsEnabled()) { "Allow notifications for prayer alerts." }
    }
    val kept = old.filter { it.optBoolean("test") != test && it.getLong("at") > now }
    val all = kept + items
    try { items.forEach { set(c, it) } } catch (e: Exception) {
      items.filter { item -> old.none { it.getString("id") == item.getString("id") } }.forEach { manager(c).cancel(pending(c, it)) }
      if (exact(c)) old.filter { it.getLong("at") > now }.forEach { set(c, it) }
      throw e
    }
    if (!prefs(c).edit().putString("alarms", JSONArray(all).toString()).commit()) {
      items.filter { item -> old.none { it.getString("id") == item.getString("id") } }.forEach { manager(c).cancel(pending(c, it)) }
      if (exact(c)) old.filter { it.getLong("at") > now }.forEach { set(c, it) }
      error("Could not save prayer alarms")
    }
    val ids = all.map { it.getString("id") }.toSet()
    old.filter { it.getString("id") !in ids }.forEach { manager(c).cancel(pending(c, it)) }
    return items.size
  }
  @Synchronized fun restore(c: Context) {
    if (!exact(c)) return
    val all = stored(c)
    for (i in 0 until all.length()) {
      val item = all.getJSONObject(i)
      if (item.getLong("at") > System.currentTimeMillis()) set(c, item)
    }
  }
  @Synchronized fun take(c: Context, id: String): JSONObject? {
    val all = stored(c)
    val items = (0 until all.length()).map { all.getJSONObject(it) }
    val item = items.find { it.getString("id") == id } ?: return null
    prefs(c).edit().putString("alarms", JSONArray(items.filter { it.getString("id") != id }).toString()).commit()
    return item
  }
  fun notification(c: Context, item: JSONObject, channel: String, playing: Boolean = false): android.app.Notification {
    val launch = c.packageManager.getLaunchIntentForPackage(c.packageName) ?: Intent()
    val open = PendingIntent.getActivity(c, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val builder = NotificationCompat.Builder(c, channel).setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(if (item.optBoolean("test")) "Azan test · ${item.getString("prayer")}" else item.optString("title", "Time for ${item.getString("prayer")} prayer"))
      .setContentText(if (playing) "${item.optString("preference")} · Tap Stop to end Azan" else item.optString("body", "It's time to pray"))
      .setContentIntent(open).setAutoCancel(!playing).setOngoing(playing).setOnlyAlertOnce(true)
      .setCategory(if (playing) NotificationCompat.CATEGORY_TRANSPORT else NotificationCompat.CATEGORY_REMINDER)
    if (Build.VERSION.SDK_INT < 26 && channel == REMINDERS) builder.setDefaults(android.app.Notification.DEFAULT_SOUND or android.app.Notification.DEFAULT_VIBRATE)
    if (playing) {
      val stop = PendingIntent.getService(c, 1, Intent(c, AzanPlaybackService::class.java).setAction("STOP"), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      builder.addAction(android.R.drawable.ic_media_pause, "Stop Azan", stop).setDeleteIntent(stop)
    }
    return builder.build()
  }
}

class PrayerAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != "${context.packageName}.PRAYER_ALARM") {
      try { PrayerAlarms.restore(context) } catch (e: Exception) { PrayerAlarms.record(context, "Restore failed: ${e.message}") }
      return
    }
    val raw = intent.getStringExtra("alarm") ?: return
    val item = PrayerAlarms.take(context, JSONObject(raw).getString("id")) ?: return
    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
      PrayerAlarms.record(context, "${item.getString("prayer")}: notifications disabled"); return
    }
    val sound = item.getString("sound")
    val late = System.currentTimeMillis() - item.getLong("at") > 10 * 60_000
    if (sound.startsWith("prayer_") && !late) {
      try {
        val service = Intent(context, AzanPlaybackService::class.java).putExtra("alarm", item.toString())
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service) else context.startService(service)
      } catch (e: Exception) {
        PrayerAlarms.record(context, "Playback could not start: ${e.message}")
        context.getSystemService(NotificationManager::class.java).notify(item.getString("id").hashCode(), PrayerAlarms.notification(context, item, PrayerAlarms.SILENT))
      }
    } else {
      val channel = if (sound == "silent" || late) PrayerAlarms.SILENT else PrayerAlarms.REMINDERS
      context.getSystemService(NotificationManager::class.java).notify(item.getString("id").hashCode(), PrayerAlarms.notification(context, item, channel))
      PrayerAlarms.record(context, "${item.getString("prayer")}: ${if (late) "delivered late, audio skipped" else "notification delivered"}")
    }
  }
}

class AzanPlaybackService : Service() {
  private var player: MediaPlayer? = null
  private var focus: AudioFocusRequest? = null
  private val handler = Handler(Looper.getMainLooper())
  private var prayer = "Azan"
  private val focusListener = AudioManager.OnAudioFocusChangeListener { change ->
    if (change < 0) { PrayerAlarms.record(this, "$prayer: interrupted by other audio"); stopSelf() }
  }
  override fun onBind(intent: Intent?) = null
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == "STOP" || intent?.getStringExtra("alarm") == null) { PrayerAlarms.record(this, "$prayer: stopped"); stopSelf(); return START_NOT_STICKY }
    release()
    val item = JSONObject(intent.getStringExtra("alarm")!!)
    prayer = item.getString("prayer")
    PrayerAlarms.channels(this)
    startForeground(5701, PrayerAlarms.notification(this, item, PrayerAlarms.PLAYBACK, true))
    val status = PrayerAlarms.status(this)
    if (!status.getBoolean("notifications") || !status.getBoolean("playbackChannel") || status.getBoolean("silentMode") || status.getBoolean("doNotDisturb") || status.getInt("notificationVolume") == 0) {
      PrayerAlarms.record(this, "$prayer: audio muted by phone settings")
      getSystemService(NotificationManager::class.java).notify(item.getString("id").hashCode(), PrayerAlarms.notification(this, item, PrayerAlarms.SILENT))
      stopSelf(); return START_NOT_STICKY
    }
    try {
      val audio = getSystemService(AudioManager::class.java)
      val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()
      val focusResult = if (Build.VERSION.SDK_INT >= 26) {
        focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT).setAudioAttributes(attributes).setOnAudioFocusChangeListener(focusListener).build()
        audio.requestAudioFocus(focus!!)
      } else {
        @Suppress("DEPRECATION")
        audio.requestAudioFocus(focusListener, AudioManager.STREAM_NOTIFICATION, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      }
      if (focusResult != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
        PrayerAlarms.record(this, "$prayer: audio focus unavailable"); stopSelf(); return START_NOT_STICKY
      }
      val resource = resources.getIdentifier(item.getString("sound"), "raw", packageName)
      check(resource != 0) { "Missing bundled Azan audio" }
      val current = MediaPlayer()
      player = current
      current.setAudioAttributes(attributes)
      current.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK)
      resources.openRawResourceFd(resource).use { current.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
      current.setOnPreparedListener { if (player === it) { it.start(); PrayerAlarms.record(this, "$prayer: Azan playback started") } }
      current.setOnCompletionListener { PrayerAlarms.record(this, "$prayer: Azan playback completed"); stopSelf() }
      current.setOnErrorListener { _, what, extra -> PrayerAlarms.record(this, "$prayer: audio error $what/$extra"); stopSelf(); true }
      current.prepareAsync()
      handler.postDelayed({ stopSelf() }, 10 * 60_000L)
    } catch (e: Exception) { PrayerAlarms.record(this, "$prayer: ${e.message}"); stopSelf() }
    return START_NOT_STICKY
  }
  private fun release() {
    handler.removeCallbacksAndMessages(null)
    player?.release(); player = null
    val audio = getSystemService(AudioManager::class.java)
    if (Build.VERSION.SDK_INT >= 26) focus?.let { audio.abandonAudioFocusRequest(it) }
    else { @Suppress("DEPRECATION") audio.abandonAudioFocus(focusListener) }
    focus = null
  }
  override fun onDestroy() { release(); stopForeground(STOP_FOREGROUND_REMOVE); super.onDestroy() }
}
