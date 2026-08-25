package com.certmanager.noroot

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayInputStream
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate

class DeviceOwnerDpcModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val dpm: DevicePolicyManager? = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager

    override fun getName(): String = "DeviceOwnerDpc"

    @ReactMethod
    fun isDeviceOwner(promise: Promise) {
        try {
            val isOwner = dpm?.isDeviceOwnerApp(reactApplicationContext.packageName) ?: false
            promise.resolve(isOwner)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun uninstallCaCertificate(certDerBase64: String, promise: Promise) {
        try {
            val dpm = this.dpm
            if (dpm == null) {
                promise.reject("ERR_DPM_NULL", "DevicePolicyManager service not available")
                return
            }
            val certBytes = android.util.Base64.decode(certDerBase64, android.util.Base64.DEFAULT)
            val certFactory = CertificateFactory.getInstance("X.509")
            val cert = certFactory.generateCertificate(ByteArrayInputStream(certBytes)) as X509Certificate

            val adminComponent = ComponentName(reactApplicationContext, "${reactApplicationContext.packageName}.DeviceAdminReceiver")
            dpm.uninstallCaCert(adminComponent, cert.encoded)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_DPM", e.message ?: "Failed to uninstall CA certificate via DPC")
        }
    }
}