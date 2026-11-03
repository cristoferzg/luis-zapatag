package pe.innovacontratistas.app;

import android.app.DownloadManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Guarda en el celular (Descargas/InnovApp) lo que la web descarga: videos grabados
 * del 3D, planos DXF, respaldos, PDF y adjuntos de Recursos. El WebView de Android no
 * guarda descargas por sí solo.
 */
@CapacitorPlugin(name = "Archivos")
public class ArchivosPlugin extends Plugin {

    private void aviso(final String txt) {
        getActivity().runOnUiThread(() -> Toast.makeText(getContext(), txt, Toast.LENGTH_LONG).show());
    }

    private static String limpio(String nombre) {
        String n = nombre == null ? "" : nombre.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return n.isEmpty() ? "archivo" : n;
    }

    /** Archivo creado por la app (blob/data) en base64: { nombre, mime, datos }. */
    @PluginMethod
    public void guardar(PluginCall call) {
        String n = limpio(call.getString("nombre"));
        String m = call.getString("mime", "application/octet-stream");
        String b64 = call.getString("datos", "");
        try {
            byte[] datos = Base64.decode(b64, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= 29) {
                ContentResolver r = getContext().getContentResolver();
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, n);
                v.put(MediaStore.Downloads.MIME_TYPE, m);
                v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/InnovApp");
                Uri uri = r.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) throw new Exception("sin destino");
                try (OutputStream os = r.openOutputStream(uri)) { os.write(datos); }
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "InnovApp");
                if (!dir.exists()) dir.mkdirs();
                File f = new File(dir, n);
                try (FileOutputStream os = new FileOutputStream(f)) { os.write(datos); }
                MediaScannerConnection.scanFile(getContext(), new String[]{f.getAbsolutePath()}, new String[]{m}, null);
            }
            aviso("Guardado en Descargas/InnovApp: " + n);
            JSObject ret = new JSObject(); ret.put("ok", true); call.resolve(ret);
        } catch (Throwable e) {
            aviso("No se pudo guardar el archivo");
            call.reject("No se pudo guardar el archivo", e instanceof Exception ? (Exception) e : null);
        }
    }

    /** Archivo en internet: lo baja el sistema con su aviso. { url, nombre, mime } */
    @PluginMethod
    public void descargar(PluginCall call) {
        String url = call.getString("url", "");
        String mime = call.getString("mime", null);
        try {
            String n = limpio(call.getString("nombre", URLUtil.guessFileName(url, null, mime)));
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
            if (mime != null && !mime.isEmpty()) req.setMimeType(mime);
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) req.addRequestHeader("cookie", cookies);
            req.setTitle(n);
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "InnovApp/" + n);
            ((DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(req);
            aviso("Descargando " + n + "…");
            JSObject ret = new JSObject(); ret.put("ok", true); call.resolve(ret);
        } catch (Throwable e) {
            aviso("No se pudo descargar el archivo");
            call.reject("No se pudo descargar", e instanceof Exception ? (Exception) e : null);
        }
    }
}
