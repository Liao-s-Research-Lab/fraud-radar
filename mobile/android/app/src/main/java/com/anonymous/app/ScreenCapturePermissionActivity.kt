package com.anonymous.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle

/**
 * 透明、無 UI 的 Activity。
 * 唯一工作:跳出系統「螢幕截取授權」對話框 → 拿到授權(resultCode + data Intent)後,
 * 把它交給 FloatingViewService 去做真正的截圖,然後自己關閉。
 *
 * 這樣做的好處:MediaProjection 一定要從 Activity 取得授權,但我們不想驚動 RN 主畫面,
 * 所以用一個獨立的透明 Activity 處理授權,使用者只會看到系統的授權框。
 */
class ScreenCapturePermissionActivity : Activity() {

    companion object {
        private const val REQ_MEDIA_PROJECTION = 4321
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val mpm = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(mpm.createScreenCaptureIntent(), REQ_MEDIA_PROJECTION)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_MEDIA_PROJECTION && resultCode == RESULT_OK && data != null) {
            val intent = Intent(this, FloatingViewService::class.java).apply {
                action = FloatingViewService.ACTION_CAPTURE
                putExtra(FloatingViewService.EXTRA_RESULT_CODE, resultCode)
                putExtra(FloatingViewService.EXTRA_RESULT_DATA, data)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        }
        finish()
        overridePendingTransition(0, 0)
    }
}
