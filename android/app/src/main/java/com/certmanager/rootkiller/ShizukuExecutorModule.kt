package com.certmanager.rootkiller

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import rikka.shizuku.Shizuku
import rikka.shizuku.ShizukuRemoteProcess
import java.io.BufferedReader
import java.io.InputStreamReader

class ShizukuExecutorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ShizukuExecutor"

    @ReactMethod
    fun checkShizukuPermission(promise: Promise) {
        try {
            val isAvailable = Shizuku.pingBinder()
            val hasPermission = if (isAvailable) Shizuku.checkSelfPermission() == 0 else false
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun executeShizukuCommand(cmd: String, promise: Promise) {
        Thread {
            try {
                if (!Shizuku.pingBinder()) {
                    promise.reject("ERR_SHIZUKU_DOWN", "Shizuku service is not running. Start it via Wireless Debugging.")
                    return@Thread
                }
                
                // Invoke privileged process through Shizuku AIDL binder (No Root needed)
                val process: ShizukuRemoteProcess = Shizuku.newProcess(arrayOf("sh", "-c", cmd), null, null)
                val reader = BufferedReader(InputStreamReader(process.inputStream))
                val output = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    output.append(line).append("\n")
                }
                val exitCode = process.waitFor()
                if (exitCode == 0) {
                    promise.resolve(output.toString())
                } else {
                    promise.reject("ERR_EXIT", "Process failed with exit code: $exitCode")
                }
            } catch (e: Exception) {
                promise.reject("ERR_EXEC", e.message)
            }
        }.start()
    }
}