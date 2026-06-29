package com.anonymous.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// 讓 JS(首頁)可以重新開啟 / 查詢懸浮偵測按鈕
class FloatingModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

  override fun getName() = "FloatingModule"

  // 重新開啟懸浮按鈕:清掉「已移除」旗標並啟動服務
  @ReactMethod
  fun openFloating(promise: Promise) {
    try {
      // 還沒授權「顯示在其他應用程式上層」就先帶去設定頁
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) {
        val i = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${ctx.packageName}")
        )
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(i)
        promise.resolve("need_permission")
        return
      }
      ctx.getSharedPreferences("fraud_floating", Context.MODE_PRIVATE)
        .edit().putBoolean("dismissed", false).apply()
      ctx.startService(Intent(ctx, FloatingViewService::class.java))
      promise.resolve("ok")
    } catch (e: Exception) {
      promise.reject("open_failed", e)
    }
  }

  // 是否目前被使用者移除
  @ReactMethod
  fun isDismissed(promise: Promise) {
    val v = ctx.getSharedPreferences("fraud_floating", Context.MODE_PRIVATE)
      .getBoolean("dismissed", false)
    promise.resolve(v)
  }
}
