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

    /**
     * Probe device capabilities for cert management.
     * Returns a map with diagnostic info so the JS layer can decide
     * which approach to use (or whether to skip automation entirely).
     */
    @ReactMethod
    fun checkCertManagementCapability(promise: Promise) {
        Thread {
            try {
                if (!Shizuku.pingBinder()) {
                    promise.reject("ERR_SHIZUKU_DOWN", "Shizuku service is not running.")
                    return@Thread
                }
                if (Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
                    promise.reject("ERR_NO_PERMISSION", "Shizuku permission has not been granted.")
                    return@Thread
                }

                val sdkInt = android.os.Build.VERSION.SDK_INT
                val manufacturer = android.os.Build.MANUFACTURER ?: "unknown"
                val model = android.os.Build.MODEL ?: "unknown"

                // Build the probe script using regular strings to avoid Kotlin raw-string interpolation issues
                val d = "${'$'}d"  // shell variable reference
                val dq = "${'"'}${'$'}d${'"'}"  // quoted shell variable
                val drw = "${'$'}REMOVED_WRITABLE"
                val drp = "${'$'}REMOVED_PATH"
                val dcmd = "${'$'}CMD_DPC_OK"
                val dmount = "${'$'}MOUNT_RW"

                val testProbe =
                    "# Check cacerts-removed writability\n" +
                    "REMOVED_WRITABLE=0\n" +
                    "REMOVED_PATH=''\n" +
                    "for d in /data/misc/user/0/cacerts-removed /data/misc/keychain/cacerts-removed; do\n" +
                    "  if [ -d \"$d\" ] && [ -w \"$d\" ]; then\n" +
                    "    REMOVED_WRITABLE=1\n" +
                    "    REMOVED_PATH=\"$d\"\n" +
                    "    break\n" +
                    "  fi\n" +
                    "done\n" +
                    "if [ \"$drw\" = \"0\" ]; then\n" +
                    "  mkdir -p /data/misc/user/0/cacerts-removed 2>/dev/null\n" +
                    "  if [ -d /data/misc/user/0/cacerts-removed ] && [ -w /data/misc/user/0/cacerts-removed ]; then\n" +
                    "    REMOVED_WRITABLE=1\n" +
                    "    REMOVED_PATH=/data/misc/user/0/cacerts-removed\n" +
                    "  fi\n" +
                    "fi\n" +
                    "echo \"REMOVED_WRITABLE=$drw\"\n" +
                    "echo \"REMOVED_PATH=$drp\"\n" +
                    "CMD_DPC_OK=0\n" +
                    "if ! cmd device_policy set-ca-cert-enabled 2>&1 | grep -q 'Unknown command'; then\n" +
                    "  CMD_DPC_OK=1\n" +
                    "fi\n" +
                    "if ! cmd devicepolicy set-ca-cert-enabled 2>&1 | grep -q 'Unknown command'; then\n" +
                    "  CMD_DPC_OK=1\n" +
                    "fi\n" +
                    "echo \"CMD_DPC_OK=$dcmd\"\n" +
                    "MOUNT_RW=0\n" +
                    "if mount -o rw,remount / 2>/dev/null; then\n" +
                    "  mount -o ro,remount / 2>/dev/null\n" +
                    "  MOUNT_RW=1\n" +
                    "fi\n" +
                    "echo \"MOUNT_RW=$dmount\"\n"

                val process: ShizukuRemoteProcess = Shizuku.newProcess(arrayOf("sh", "-c", testProbe), null, null)
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
                process.waitFor()

                val outStr = output.toString().trim()
                val removedWritable = outStr.contains("REMOVED_WRITABLE=1")
                val removedPath = outStr.lines().firstOrNull { it.startsWith("REMOVED_PATH=") }?.removePrefix("REMOVED_PATH=") ?: ""
                val cmdDpcOk = outStr.contains("CMD_DPC_OK=1")
                val mountRw = outStr.contains("MOUNT_RW=1")

                val result = Arguments.createMap().apply {
                    putInt("sdkInt", sdkInt)
                    putString("manufacturer", manufacturer)
                    putString("model", model)
                    putBoolean("cacertsRemovedWritable", removedWritable)
                    putString("cacertsRemovedPath", removedPath)
                    putBoolean("cmdDevicePolicyAvailable", cmdDpcOk)
                    putBoolean("mountRemountCapable", mountRw)
                    putBoolean("canDisableCerts", removedWritable || cmdDpcOk || mountRw)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("ERR_PROBE", e.message ?: "Failed to check cert management capability")
            }
        }.start()
    }
}