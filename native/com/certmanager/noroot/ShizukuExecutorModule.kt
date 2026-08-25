package com.certmanager.noroot

import android.content.pm.PackageManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import rikka.shizuku.Shizuku
import rikka.shizuku.ShizukuRemoteProcess
import java.io.BufferedReader
import java.io.InputStreamReader

class ShizukuExecutorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val REQUEST_PERMISSION_CODE = 4001
    private var pendingPermissionPromise: Promise? = null

    private val permissionListener = Shizuku.OnRequestPermissionResultListener { requestCode, grantResult ->
        if (requestCode == REQUEST_PERMISSION_CODE) {
            val granted = (grantResult == PackageManager.PERMISSION_GRANTED)
            pendingPermissionPromise?.let {
                val map = Arguments.createMap().apply {
                    putBoolean("granted", granted)
                    putInt("grantResult", grantResult)
                }
                it.resolve(map)
                pendingPermissionPromise = null
            }
        }
    }

    init {
        try {
            Shizuku.addRequestPermissionResultListener(permissionListener)
        } catch (e: Exception) {
            // Shizuku binder may not be loaded yet
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            Shizuku.removeRequestPermissionResultListener(permissionListener)
        } catch (e: Exception) {
            // ignore
        }
    }

    override fun getName(): String = "ShizukuExecutor"

    @ReactMethod
    fun checkShizukuPermission(promise: Promise) {
        try {
            val isAvailable = Shizuku.pingBinder()
            if (!isAvailable) {
                val map = Arguments.createMap().apply {
                    putBoolean("available", false)
                    putBoolean("granted", false)
                    putString("message", "Shizuku service is not running. Start via Wireless Debugging.")
                }
                promise.resolve(map)
                return
            }

            val hasPermission = (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED)
            val isRoot = Shizuku.isPreV11() || Shizuku.getUid() == 0
            val version = Shizuku.getVersion()
            val uid = Shizuku.getUid()

            val map = Arguments.createMap().apply {
                putBoolean("available", true)
                putBoolean("granted", hasPermission)
                putBoolean("isRoot", isRoot)
                putInt("version", version)
                putInt("uid", uid)
                putString("message", if (hasPermission) "Permission granted" else "Permission required")
            }
            promise.resolve(map)
        } catch (e: Exception) {
            val map = Arguments.createMap().apply {
                putBoolean("available", false)
                putBoolean("granted", false)
                putString("message", e.message ?: "Unknown Shizuku check error")
            }
            promise.resolve(map)
        }
    }

    @ReactMethod
    fun requestShizukuPermission(promise: Promise) {
        try {
            if (!Shizuku.pingBinder()) {
                promise.reject("ERR_SHIZUKU_DOWN", "Shizuku service is not running. Please start it via Wireless Debugging.")
                return
            }

            if (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
                val map = Arguments.createMap().apply {
                    putBoolean("granted", true)
                    putInt("grantResult", PackageManager.PERMISSION_GRANTED)
                }
                promise.resolve(map)
                return
            }

            pendingPermissionPromise = promise
            Shizuku.requestPermission(REQUEST_PERMISSION_CODE)
        } catch (e: Exception) {
            promise.reject("ERR_REQ_PERMISSION", e.message ?: "Failed to request Shizuku permission")
        }
    }

    @ReactMethod
    fun executeShizukuCommand(cmd: String, promise: Promise) {
        Thread {
            try {
                if (!Shizuku.pingBinder()) {
                    promise.reject("ERR_SHIZUKU_DOWN", "Shizuku service is not running. Start via Wireless Debugging.")
                    return@Thread
                }
                if (Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
                    promise.reject("ERR_NO_PERMISSION", "Shizuku permission has not been granted by user.")
                    return@Thread
                }

                // Execute privileged shell command via Shizuku binder IPC
                val process: ShizukuRemoteProcess = Shizuku.newProcess(arrayOf("sh", "-c", cmd), null, null)
                val outReader = BufferedReader(InputStreamReader(process.inputStream))
                val errReader = BufferedReader(InputStreamReader(process.errorStream))
                
                val output = StringBuilder()
                val errorOutput = StringBuilder()

                var line: String?
                while (outReader.readLine().also { line = it } != null) {
                    output.append(line).append("\n")
                }
                while (errReader.readLine().also { line = it } != null) {
                    errorOutput.append(line).append("\n")
                }

                val exitCode = process.waitFor()
                val outStr = output.toString().trim()
                val errStr = errorOutput.toString().trim()

                val result = Arguments.createMap().apply {
                    putBoolean("success", exitCode == 0)
                    putInt("exitCode", exitCode)
                    putString("output", outStr)
                    putString("error", errStr)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("ERR_EXEC", e.message ?: "Exception executing shell command")
            }
        }.start()
    }
}