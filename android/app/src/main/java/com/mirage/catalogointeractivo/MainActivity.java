package com.mirage.catalogointeractivo;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * Modo kiosco: pantalla siempre encendida, immersive fullscreen, pantalla
 * fija (Lock Task) y boton atras deshabilitado. Ver seccion 10 del brief -
 * el endurecimiento visual (sin seleccion de texto, sin menu contextual,
 * sin doble-tap-zoom) ya lo cubre useKioskGuards + reset.css en el lado web;
 * aqui solo lo que necesita configuracion nativa del WebView.
 */
public class MainActivity extends BridgeActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    applyImmersiveMode();

    WebView webView = getBridge().getWebView();
    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    webView.getSettings().setSupportZoom(false);
    webView.getSettings().setBuiltInZoomControls(false);
    webView.getSettings().setDisplayZoomControls(false);
    webView.setOnLongClickListener(view -> true);

    startLockTask();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      applyImmersiveMode();
    }
  }

  private void applyImmersiveMode() {
    View decorView = getWindow().getDecorView();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getWindow().setDecorFitsSystemWindows(false);
    } else {
      decorView.setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          | View.SYSTEM_UI_FLAG_FULLSCREEN
          | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      );
    }
  }

  @Override
  public void onBackPressed() {
    // Sin salida por boton atras - la unica navegacion es el flujo propio de
    // la tablet (o Settings via el gesto oculto en el logo).
  }
}
