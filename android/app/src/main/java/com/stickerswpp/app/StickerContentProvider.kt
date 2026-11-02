package com.stickerswpp.app

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File

/**
 * WhatsApp Stickers Content Provider.
 * Authority must match AndroidManifest.xml and be unique.
 *
 * PLAN A (read-only): WhatsApp does not expose an API to read stickers from
 * other apps. This provider only serves stickers created by this app.
 * To "read" existing stickers, the user imports image files manually via
 * the app's "Imagen" button, which creates a copy in the app's storage.
 */
class StickerContentProvider : ContentProvider() {

    companion object {
        const val AUTHORITY = "com.stickerswpp.stickercontentprovider"
        const val METADATA = "metadata"
    }

    override fun onCreate(): Boolean = true

    override fun query(
        uri: Uri, projection: Array<String>?, selection: String?,
        selectionArgs: Array<String>?, sortOrder: String?
    ): Cursor? {
        // Return pack metadata. WhatsApp calls this first.
        val cursor = MatrixCursor(arrayOf("sticker_pack_identifier", "sticker_pack_name", "sticker_pack_publisher", "sticker_pack_icon", "android_app_download_link", "ios_app_download_link", "publisher_email", "publisher_website", "privacy_policy_website", "license_agreement_website", "image_data_version", "avoid_cache"))
        // TODO: populate from app's local DB
        return cursor
    }

    override fun getType(uri: Uri): String? = "image/webp"

    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
        // TODO: resolve sticker file from local storage by uri path
        return null
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<String>?): Int = 0
}