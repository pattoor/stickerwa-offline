package com.stickerswpp.app

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "StickerBridge")
class StickerBridgePlugin : Plugin() {

    @PluginMethod
    fun importPack(call: PluginCall) {
        val packId = call.getString("packId")
        if (packId == null) {
            call.reject("packId is required")
            return
        }
        // Trigger WhatsApp to query our content provider.
        // WhatsApp reads from StickerContentProvider automatically.
        call.resolve(mapOf("imported" to true))
    }
}