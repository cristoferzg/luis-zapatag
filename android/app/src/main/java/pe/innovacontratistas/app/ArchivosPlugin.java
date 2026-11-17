package pe.innovacontratistas.app;

import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
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

    /** Aviso en la barra de notificaciones: "Descarga lista" — al tocarlo se abre el archivo. */
    private void notificarListo(String nombre, Uri uri, String mime) {
        try {
            Context c = getContext();
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel("descargas") == null) {
                nm.createNotificationChannel(new NotificationChannel("descargas", "Descargas", NotificationManager.IMPORTANCE_DEFAULT));
            }
            Intent ver = new Intent(Intent.ACTION_VIEW);
            ver.setDataAndType(uri, mime);
            ver.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            int id = (int) (System.currentTimeMillis() & 0x7fffffff);
            PendingIntent pi = PendingIntent.getActivity(c, id, ver, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            NotificationCompat.Builder b = new NotificationCompat.Builder(c, "descargas")
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle("Descarga lista")
                .setContentText(nombre + " · Descargas/InnovApp")
                .setContentIntent(pi)
                .setAutoCancel(true);
            NotificationManagerCompat.from(c).notify(id, b.build());
        } catch (Throwable e) { /* sin permiso de avisos: queda el mensaje en pantalla */ }
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
            Uri destino;
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
                destino = uri;
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "InnovApp");
                if (!dir.exists()) dir.mkdirs();
                File f = new File(dir, n);
                try (FileOutputStream os = new FileOutputStream(f)) { os.write(datos); }
                MediaScannerConnection.scanFile(getContext(), new String[]{f.getAbsolutePath()}, new String[]{m}, null);
                destino = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            }
            aviso("Guardado en Descargas/InnovApp: " + n);
            notificarListo(n, destino, m);
            JSObject ret = new JSObject(); ret.put("ok", true); ret.put("uri", destino.toString()); ret.put("mime", m); call.resolve(ret);
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

    /** Abre un archivo ya guardado (botón «Abrir» del aviso de la app): { uri, mime }. */
    @PluginMethod
    public void abrir(PluginCall call) {
        try {
            Intent ver = new Intent(Intent.ACTION_VIEW);
            ver.setDataAndType(Uri.parse(call.getString("uri", "")), call.getString("mime", "*/*"));
            ver.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(Intent.createChooser(ver, "Abrir con").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            call.resolve();
        } catch (Throwable e) {
            aviso("No hay una aplicación para abrir este archivo. Búscalo en Archivos › Descargas › InnovApp");
            call.reject("sin app");
        }
    }

    // ── Archivos compartidos con InnovApp ("Compartir" / "Abrir con" de Android) ──
    static JSObject compartidoPendiente = null;

    /** La web lo pide al abrir o al volver a la app: entrega el archivo una sola vez. */
    @PluginMethod
    public void tomarCompartido(PluginCall call) {
        JSObject r = compartidoPendiente != null ? compartidoPendiente : new JSObject();
        compartidoPendiente = null;
        call.resolve(r);
    }
}
