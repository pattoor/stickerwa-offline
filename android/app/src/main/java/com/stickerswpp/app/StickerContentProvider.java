package com.stickerswpp.app;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

/**
 * WhatsApp Stickers Content Provider.
 * Authority must match AndroidManifest.xml and be unique.
 *
 * PLAN A (read-only): WhatsApp does not expose an API to read stickers from
 * other apps. This provider only serves stickers created by this app.
 * To "read" existing stickers, the user imports image files manually via
 * the app's "Imagen" button, which creates a copy in the app's storage.
 */
public class StickerContentProvider extends ContentProvider {
    public static final String AUTHORITY = "com.stickerswpp.stickercontentprovider";

    @Override
    public boolean onCreate() { return true; }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection,
                        String[] selectionArgs, String sortOrder) {
        MatrixCursor cursor = new MatrixCursor(new String[]{
            "sticker_pack_identifier", "sticker_pack_name", "sticker_pack_publisher",
            "sticker_pack_icon", "android_app_download_link", "ios_app_download_link",
            "publisher_email", "publisher_website", "privacy_policy_website",
            "license_agreement_website", "image_data_version", "avoid_cache"
        });
        // TODO: populate from app's local DB
        return cursor;
    }

    @Override
    public String getType(Uri uri) { return "image/webp"; }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) {
        // TODO: resolve sticker file from local storage by uri path
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) { return null; }
    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
}