package pe.innovacontratistas.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Que se comporte como app y no como navegador: sin zoom con dos dedos
        // ni doble toque, y sin que el tamaño de letra del sistema agrande la interfaz.
        WebSettings s = getBridge().getWebView().getSettings();
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
    }
}
