package pe.innovacontratistas.app;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin propio: guardar descargas (videos 3D, DXF, PDF…) en Descargas/InnovApp
        // y recibir archivos que se comparten con la app.
        registerPlugin(ArchivosPlugin.class);
        super.onCreate(savedInstanceState);
        // Que se comporte como app y no como navegador: sin zoom con dos dedos
        // ni doble toque, y sin que el tamaño de letra del sistema agrande la interfaz.
        WebSettings s = getBridge().getWebView().getSettings();
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        recibirArchivo(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        recibirArchivo(intent);
    }

    /** Un .json (o texto) compartido con InnovApp: se guarda para que la web lo abra. */
    private void recibirArchivo(Intent intent) {
        if (intent == null) return;
        String accion = intent.getAction();
        try {
            Uri uri = null;
            String texto = null;
            if (Intent.ACTION_SEND.equals(accion)) {
                uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                if (uri == null) texto = intent.getStringExtra(Intent.EXTRA_TEXT);
            } else if (Intent.ACTION_VIEW.equals(accion)) {
                uri = intent.getData();
            } else {
                return;
            }
            String nombre = "archivo.json";
            if (uri != null) {
                try (Cursor c = getContentResolver().query(uri, null, null, null, null)) {
                    if (c != null && c.moveToFirst()) {
                        int i = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                        if (i >= 0 && c.getString(i) != null) nombre = c.getString(i);
                    }
                } catch (Exception ignorado) { /* sin nombre */ }
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    if (in == null) return;
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    byte[] buf = new byte[65536];
                    int n, total = 0;
                    while ((n = in.read(buf)) > 0) {
                        total += n;
                        if (total > 30 * 1024 * 1024) return; // demasiado grande para un diseño
                        out.write(buf, 0, n);
                    }
                    texto = out.toString("UTF-8");
                }
            }
            if (texto == null || texto.trim().isEmpty()) return;
            JSObject r = new JSObject();
            r.put("nombre", nombre);
            r.put("texto", texto);
            ArchivosPlugin.compartidoPendiente = r;
            intent.setAction(Intent.ACTION_MAIN); // que no se vuelva a abrir al girar la pantalla
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('innova_archivo_compartido'))", null));
            }
        } catch (Exception e) {
            // Archivo que no se pudo leer: se ignora sin cerrar la app.
        }
    }
}
