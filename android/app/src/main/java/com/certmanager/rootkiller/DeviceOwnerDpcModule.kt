package com.certmanager.rootkiller

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.ByteArrayInputStream
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate

class DeviceOwnerDpcModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val dpm: DevicePolicyManager = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent = ComponentName(reactContext, DeviceAdminReceiver::class.java)

    override fun getName(): String = "DeviceOwnerDpc"

    @ReactMethod
    fun isDeviceOwner(promise: Promise) {
        val isOwner = dpm.isDeviceOwnerApp(reactApplicationContext.packageName)
        promise.resolve(isOwner)
    }

    @ReactMethod
    fun uninstallCaCertificate(certDerBase64: String, promise: Promise) {
        try {
            val certBytes = android.util.Base64.decode(certDerBase64, android.util.Base64.DEFAULT)
            val certFactory = CertificateFactory.getInstance("X.509")
            val cert = certFactory.generateCertificate(ByteArrayInputStream(certBytes)) as X509Certificate

            // DPM allows uninstalling or overriding trusted CAs without root
            dpm.uninstallCaCert(adminComponent, cert.encoded)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_DPM", e.message)
        }
    }
}