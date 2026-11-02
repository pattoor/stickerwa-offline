package com.stickerswpp.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StickerBridge")
public class StickerBridgePlugin extends Plugin {
    @PluginMethod
    public void importPack(PluginCall call) {
        String packId = call.getString("packId");
        if (packId == null) {
            call.reject("packId is required");
            return;
        }
        call.resolve();
    }
}
