package pe.innovacontratistas.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Imprimir desde la app de Android: el WebView de Android no implementa window.print(),
 * así que la web manda aquí el HTML ya armado (con estilos e imágenes incrustados) y se
 * abre el diálogo de impresión del sistema (impresoras o "Guardar como PDF").
 */
@CapacitorPlugin(name = "Imprimir")
public class ImprimirPlugin extends Plugin {
    private WebView vista; // se guarda para que no se libere antes de imprimir

    @PluginMethod
    public void html(PluginCall call) {
        final String html = call.getString("html", "");
        final String titulo = call.getString("titulo", "InnovApp");
        final String tamano = call.getString("tamano", "A4");
        final boolean horizontal = "landscape".equals(call.getString("orientacion", "portrait"));
        if (html == null || html.isEmpty()) { call.reject("Nada que imprimir"); return; }
        getActivity().runOnUiThread(() -> {
            try {
                WebView wv = new WebView(getContext());
                wv.getSettings().setJavaScriptEnabled(false);
                vista = wv;
                wv.setWebViewClient(new WebViewClient() {
                    private boolean listo = false;
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (listo) return;
                        listo = true;
                        PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                        PrintDocumentAdapter adaptador = view.createPrintDocumentAdapter(titulo);
                        PrintAttributes.MediaSize medida = medida(tamano);
                        if (horizontal) medida = medida.asLandscape();
                        PrintAttributes atributos = new PrintAttributes.Builder().setMediaSize(medida).build();
                        pm.print(titulo, adaptador, atributos);
                        call.resolve();
                    }
                });
                wv.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
            } catch (Exception e) {
                call.reject("No se pudo imprimir: " + e.getMessage());
            }
        });
    }

    private static PrintAttributes.MediaSize medida(String t) {
        switch (t) {
            case "A3": return PrintAttributes.MediaSize.ISO_A3;
            case "A2": return PrintAttributes.MediaSize.ISO_A2;
            case "A1": return PrintAttributes.MediaSize.ISO_A1;
            case "A0": return PrintAttributes.MediaSize.ISO_A0;
            case "Carta": return PrintAttributes.MediaSize.NA_LETTER;
            case "Oficio": return PrintAttributes.MediaSize.NA_LEGAL;
            default: return PrintAttributes.MediaSize.ISO_A4;
        }
    }
}
