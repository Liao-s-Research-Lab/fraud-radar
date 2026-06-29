package com.anonymous.app

import android.animation.ObjectAnimator
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import kotlin.math.hypot
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.util.Log
import android.view.*
import android.view.animation.LinearInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * 懸浮窗 + 一鍵截圖偵測。
 *
 * 流程:
 *  1. onCreate 顯示懸浮氣泡(可拖曳)。
 *  2. 點氣泡 → 顯示「檢測」按鈕;點「檢測」→ 開 ScreenCapturePermissionActivity 要螢幕截取授權。
 *  3. 授權後該 Activity 用 ACTION_CAPTURE 回呼本服務 → 轉前景服務(mediaProjection)→ 取得 MediaProjection。
 *  4. 先把氣泡藏起來(避免拍到自己)→ 用 VirtualDisplay + ImageReader 擷取一張畫面 → Bitmap。
 *  5. 還原氣泡 → 把圖以 multipart(files[])直接 POST 到 {api_base_url}/api/fetch-content。
 *  6. 解析回傳 pythonResult → 用浮層顯示偵測結果。
 */
class FloatingViewService : Service() {

    companion object {
        const val ACTION_CAPTURE = "com.anonymous.app.ACTION_CAPTURE"
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"
        private const val CHANNEL_ID = "fraud_radar_capture"
        private const val NOTI_ID = 1001
        private const val TAG = "FloatingViewService"
    }

    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null
    private var modalView: View? = null
    private var bubbleImage: ImageView? = null
    private var mediaProjection: MediaProjection? = null
    private var imageReader: ImageReader? = null
    private var virtualDisplay: VirtualDisplay? = null
    @Volatile private var captureRequested = false
    @Volatile private var busy = false
    private var scrW = 0
    private var scrH = 0
    private var scrDensity = 0
    private var loadingAnimator: ObjectAnimator? = null
    private var removeView: View? = null
    private var removeBg: GradientDrawable? = null
    @Volatile private var overRemove = false
    private val mainHandler = Handler(Looper.getMainLooper())

    private fun dp(v: Float) =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics).toInt()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        showBubble()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_CAPTURE) {
            val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
            @Suppress("DEPRECATION")
            val data = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
            if (resultCode == Activity.RESULT_OK && data != null) {
                startCaptureForeground()
                val mpm = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjection = mpm.getMediaProjection(resultCode, data)
                mediaProjection?.registerCallback(object : MediaProjection.Callback() {
                    override fun onStop() {
                        Log.d(TAG, "MediaProjection stopped")
                        releaseCaptureSession()
                    }
                }, mainHandler)
                setupCaptureSession()  // 建立持續截取工作階段(只授權這一次)
                requestCapture()       // 立即做第一次偵測
            } else {
                Toast.makeText(this, "未取得螢幕截取授權", Toast.LENGTH_SHORT).show()
            }
        }
        return START_NOT_STICKY
    }

    // ---------------- 懸浮氣泡 ----------------

    private fun showBubble() {
        if (floatingView != null) return
        val view = LayoutInflater.from(this).inflate(R.layout.layout_floating_widget, null)
        floatingView = view

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )
        layoutParams.gravity = Gravity.TOP or Gravity.START
        layoutParams.x = 100
        layoutParams.y = 300
        windowManager.addView(view, layoutParams)

        val bubble = view.findViewById<ImageView>(R.id.bubble_icon)

        bubbleImage = bubble
        // 點氣泡 = 截圖偵測。已建立截取階段就直接截,不再每次跳授權框
        bubble.setOnClickListener {
            if (busy) {
                Toast.makeText(this, "偵測中,請稍候…", Toast.LENGTH_SHORT).show()
            } else if (virtualDisplay != null && mediaProjection != null) {
                Toast.makeText(this, "偵測中…", Toast.LENGTH_SHORT).show()
                requestCapture()
            } else {
                Toast.makeText(this, "首次需授權螢幕截取(僅此一次)…", Toast.LENGTH_SHORT).show()
                val i = Intent(this, ScreenCapturePermissionActivity::class.java)
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(i)
            }
        }

        // 拖曳(可分辨點擊與拖曳)
        bubble.setOnTouchListener(object : View.OnTouchListener {
            var initialX = 0
            var initialY = 0
            var initialTouchX = 0f
            var initialTouchY = 0f
            var isClick = false

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        isClick = true
                        initialX = layoutParams.x
                        initialY = layoutParams.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (kotlin.math.abs(dx) > 8 || kotlin.math.abs(dy) > 8) isClick = false
                        layoutParams.x = initialX + dx
                        layoutParams.y = initialY + dy
                        windowManager.updateViewLayout(view, layoutParams)
                        if (!isClick) {
                            showRemoveZone()
                            updateOverRemove(layoutParams.x + view.width / 2, layoutParams.y + view.height / 2)
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (isClick) {
                            bubble.performClick()
                        } else if (overRemove) {
                            dismissBubble()
                            return true
                        }
                        hideRemoveZone()
                        return true
                    }
                }
                return false
            }
        })
    }

    // ---------------- 拖曳移除區 ----------------

    private fun buildRemoveView(): View {
        val size = dp(76f)
        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#B3D9685A"))
            setStroke(dp(2f), Color.parseColor("#FFFFFF"))
        }
        removeBg = bg
        return TextView(this).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            textSize = 30f
            gravity = Gravity.CENTER
            background = bg
            width = size
            height = size
        }
    }

    private fun showRemoveZone() {
        if (removeView == null) {
            val v = buildRemoveView()
            removeView = v
            val lp = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                PixelFormat.TRANSLUCENT
            )
            lp.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            lp.y = dp(90f)
            windowManager.addView(v, lp)
        }
        removeView?.visibility = View.VISIBLE
    }

    private fun hideRemoveZone() {
        overRemove = false
        bubbleImage?.alpha = 1f
        removeView?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }
        removeView = null
        removeBg = null
    }

    // 判斷氣泡是否拖到移除區上方,並給回饋(放大 + 變更透明度)
    private fun updateOverRemove(bubbleCx: Int, bubbleCy: Int) {
        val rv = removeView ?: return
        val loc = IntArray(2)
        rv.getLocationOnScreen(loc)
        val rcx = loc[0] + rv.width / 2
        val rcy = loc[1] + rv.height / 2
        val over = hypot((bubbleCx - rcx).toDouble(), (bubbleCy - rcy).toDouble()) < dp(75f)
        if (over != overRemove) {
            overRemove = over
            // 不縮放(會被視窗裁成方形),改用變色回饋:移上去變實心亮紅
            removeBg?.setColor(Color.parseColor(if (over) "#F0D9685A" else "#B3D9685A"))
            bubbleImage?.alpha = if (over) 0.4f else 1f
        }
    }

    private fun dismissBubble() {
        getSharedPreferences("fraud_floating", Context.MODE_PRIVATE)
            .edit().putBoolean("dismissed", true).apply()
        hideRemoveZone()
        floatingView?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }
        floatingView = null
        bubbleImage = null
        Toast.makeText(this, "已暫時移除,可在 App 首頁重新開啟", Toast.LENGTH_LONG).show()
        stopSelf()
    }

    // ---------------- 前景服務 ----------------

    private fun startCaptureForeground() {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "詐騙截圖檢測", NotificationManager.IMPORTANCE_LOW
            )
            nm.createNotificationChannel(channel)
        }
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            Notification.Builder(this, CHANNEL_ID)
        else
            @Suppress("DEPRECATION") Notification.Builder(this)
        val notification = builder
            .setContentTitle("騙局雷達 · 懸浮偵測已啟用")
            .setContentText("點氣泡即可截圖偵測當前畫面")
            .setSmallIcon(R.mipmap.ic_launcher)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTI_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
        } else {
            startForeground(NOTI_ID, notification)
        }
    }

    // ---------------- 截圖 ----------------

    // 建立持續截取工作階段(只授權一次,之後從這裡持續抓畫面)
    private fun setupCaptureSession() {
        if (virtualDisplay != null) return
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getRealMetrics(metrics)
        scrW = metrics.widthPixels
        scrH = metrics.heightPixels
        scrDensity = metrics.densityDpi

        imageReader = ImageReader.newInstance(scrW, scrH, PixelFormat.RGBA_8888, 2)
        imageReader?.setOnImageAvailableListener({ reader ->
            val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener
            if (!captureRequested) { image.close(); return@setOnImageAvailableListener }  // 平時丟棄,保持畫面新鮮
            captureRequested = false
            try {
                val bitmap = imageToBitmap(image, scrW, scrH)
                image.close()
                mainHandler.post {
                    floatingView?.visibility = View.VISIBLE
                    startBubbleLoading()
                }
                uploadBitmap(bitmap)
            } catch (e: Exception) {
                Log.e(TAG, "imageToBitmap error", e)
                image.close()
                mainHandler.post {
                    floatingView?.visibility = View.VISIBLE
                    stopBubbleLoading()
                    Toast.makeText(this, "截圖失敗:${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }, mainHandler)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "FraudCapture", scrW, scrH, scrDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface, null, null
        )
    }

    // 要求做一次偵測:先藏氣泡 → 等下一幀(不含氣泡)→ 截取
    private fun requestCapture() {
        if (virtualDisplay == null) return
        busy = true
        floatingView?.visibility = View.GONE
        mainHandler.postDelayed({ captureRequested = true }, 220)
    }

    private fun releaseCaptureSession() {
        try { virtualDisplay?.release() } catch (_: Exception) {}
        try { imageReader?.close() } catch (_: Exception) {}
        virtualDisplay = null
        imageReader = null
        mediaProjection = null
        mainHandler.post { stopBubbleLoading() }
    }

    // 偵測中:氣泡轉圈 loading
    private fun startBubbleLoading() {
        val v = bubbleImage ?: return
        loadingAnimator?.cancel()
        loadingAnimator = ObjectAnimator.ofFloat(v, "rotation", 0f, 360f).apply {
            duration = 900
            repeatCount = ObjectAnimator.INFINITE
            interpolator = LinearInterpolator()
            start()
        }
    }

    private fun stopBubbleLoading() {
        busy = false
        loadingAnimator?.cancel()
        loadingAnimator = null
        bubbleImage?.rotation = 0f
    }

    private fun imageToBitmap(image: Image, width: Int, height: Int): Bitmap {
        val plane = image.planes[0]
        val buffer = plane.buffer
        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * width
        val bmpWidth = width + rowPadding / pixelStride
        val bitmap = Bitmap.createBitmap(bmpWidth, height, Bitmap.Config.ARGB_8888)
        bitmap.copyPixelsFromBuffer(buffer)
        return if (rowPadding == 0) bitmap
        else Bitmap.createBitmap(bitmap, 0, 0, width, height)
    }

    private fun stopProjection() {
        try {
            mediaProjection?.stop()
        } catch (_: Exception) {}
        mediaProjection = null
        mainHandler.post {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION") stopForeground(true)
            }
        }
    }

    // ---------------- 上傳 + 解析 ----------------

    private fun uploadBitmap(bitmap: Bitmap) {
        Thread {
            try {
                val baseUrl = getString(R.string.api_base_url).trimEnd('/')
                val url = URL("$baseUrl/api/fetch-content")
                val boundary = "----FraudRadar${System.currentTimeMillis()}"

                val baos = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.JPEG, 80, baos)
                val imageBytes = baos.toByteArray()

                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    doOutput = true
                    connectTimeout = 20000
                    readTimeout = 120000  // 後端 OCR+Gemini 可能要 ~60 秒,給足時間避免逾時放棄
                    setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                }

                DataOutputStream(conn.outputStream).use { out ->
                    // 來源欄位(後端會讀 from,可選)
                    out.writeBytes("--$boundary\r\n")
                    out.writeBytes("Content-Disposition: form-data; name=\"from\"\r\n\r\n")
                    out.writeBytes("app-screenshot\r\n")
                    // 圖片欄位:必須是 files[](後端用 formData.getAll('files[]'))
                    out.writeBytes("--$boundary\r\n")
                    out.writeBytes("Content-Disposition: form-data; name=\"files[]\"; filename=\"screen.jpg\"\r\n")
                    out.writeBytes("Content-Type: image/jpeg\r\n\r\n")
                    out.write(imageBytes)
                    out.writeBytes("\r\n")
                    out.writeBytes("--$boundary--\r\n")
                    out.flush()
                }

                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val response = stream.bufferedReader().use { it.readText() }
                Log.d(TAG, "fetch-content response: $response")

                val data = JSONObject(response)
                val pythonResult = data.optJSONObject("pythonResult")
                if (pythonResult != null) {
                    mainHandler.post { stopBubbleLoading(); showResponseOverlay(pythonResult) }
                } else {
                    mainHandler.post {
                        stopBubbleLoading()
                        Toast.makeText(this, "未取得偵測結果", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "upload error", e)
                mainHandler.post {
                    stopBubbleLoading()
                    Toast.makeText(this, "檢測失敗:${e.message}(後端是否開著?)", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private fun showResponseOverlay(pythonResult: JSONObject) {
        // 若已有舊浮層,先移除
        modalView?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }

        val inflater = getSystemService(LAYOUT_INFLATER_SERVICE) as LayoutInflater
        val view = inflater.inflate(R.layout.layout_modal_overlay, null)
        modalView = view

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )
        layoutParams.gravity = Gravity.CENTER
        // 滿版容器(FrameLayout)讓卡片真正置中;高度限制讓內容過長時可在浮層內捲動
        layoutParams.width = WindowManager.LayoutParams.MATCH_PARENT
        val dm = DisplayMetrics()
        @Suppress("DEPRECATION") windowManager.defaultDisplay.getRealMetrics(dm)
        layoutParams.height = (dm.heightPixels * 0.82).toInt()

        val resultText = view.findViewById<TextView>(R.id.result_text)
        val rateText = view.findViewById<TextView>(R.id.rate_text)
        val keywordText = view.findViewById<TextView>(R.id.keyword_text)
        val typeText = view.findViewById<TextView>(R.id.type_text)
        val remindText = view.findViewById<TextView>(R.id.remind_text)
        val preventText = view.findViewById<TextView>(R.id.prevent_text)
        val closeButton = view.findViewById<Button>(R.id.modal_close_button)

        val fraudResult = pythonResult.optString("FraudResult", "未檢測到")
        val fraudRate = pythonResult.optDouble("FraudRate", 0.0)
        val matchArray = pythonResult.optJSONArray("Match")

        val keywords = mutableListOf<String>()
        val types = mutableListOf<String>()
        val reminds = mutableListOf<String>()
        val prevents = mutableListOf<String>()
        if (matchArray != null) {
            for (i in 0 until matchArray.length()) {
                val m = matchArray.getJSONObject(i)
                keywords.add(m.optString("MatchKeyword", ""))
                types.add(m.optString("MatchType", ""))
                reminds.add(m.optString("Remind", ""))
                prevents.add(m.optString("Prevent", ""))
            }
        }

        val verdict = when {
            fraudRate >= 60 -> "⚠ 高風險,極可能是詐騙"
            fraudRate >= 30 -> "需留意,有疑慮"
            else -> "風險較低"
        }
        rateText.text = "詐騙率 ${"%.0f".format(fraudRate)}%"
        resultText.text = if (fraudResult.isNotBlank() && fraudResult != "未檢測到") "$verdict · $fraudResult" else verdict
        keywordText.text = "關鍵詞:${keywords.filter { it.isNotBlank() }.joinToString(", ").ifEmpty { "無" }}"
        typeText.text = "類型:${types.filter { it.isNotBlank() }.joinToString(", ").ifEmpty { "無" }}"
        remindText.text = "提醒:${reminds.filter { it.isNotBlank() }.joinToString(" / ").ifEmpty { "—" }}"
        preventText.text = "防範建議:${prevents.filter { it.isNotBlank() }.joinToString(" / ").ifEmpty { "—" }}"

        closeButton.setOnClickListener {
            try { windowManager.removeView(view) } catch (_: Exception) {}
            modalView = null
        }

        windowManager.addView(view, layoutParams)

        // 彈出動畫:卡片由 0.85 縮放 + 淡入,帶輕微回彈
        val card = view.findViewById<View>(R.id.modal_overlay)
        card.alpha = 0f
        card.scaleX = 0.85f
        card.scaleY = 0.85f
        card.animate()
            .alpha(1f).scaleX(1f).scaleY(1f)
            .setDuration(260)
            .setInterpolator(OvershootInterpolator(1.6f))
            .start()
    }

    override fun onDestroy() {
        super.onDestroy()
        loadingAnimator?.cancel()
        try { virtualDisplay?.release() } catch (_: Exception) {}
        try { imageReader?.close() } catch (_: Exception) {}
        try { mediaProjection?.stop() } catch (_: Exception) {}
        modalView?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }
        if (::windowManager.isInitialized) {
            floatingView?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }
        }
    }
}
