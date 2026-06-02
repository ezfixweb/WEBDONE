package com.ezfixweb.mobile;

import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;
import org.json.JSONObject;
import android.content.Intent;
import androidx.annotation.Nullable;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "ezfix_mobile_prefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER = "http://192.168.0.100:3000";

    private EditText serverUrlInput;
    private Button openButton;
    private WebView webView;
    private ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        serverUrlInput = findViewById(R.id.serverUrlInput);
        openButton = findViewById(R.id.openButton);
        webView = findViewById(R.id.inventoryWebView);
        progressBar = findViewById(R.id.progressBar);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER);
        serverUrlInput.setText(savedUrl);

        setupWebView();

        openButton.setOnClickListener(v -> {
            String serverUrl = serverUrlInput.getText().toString().trim();
            if (serverUrl.isEmpty()) {
                Toast.makeText(this, "Zadej URL serveru.", Toast.LENGTH_SHORT).show();
                return;
            }

            serverUrl = normalizeServerUrl(serverUrl);
            prefs.edit().putString(KEY_SERVER_URL, serverUrl).apply();
            serverUrlInput.setText(serverUrl);
            loadInventoryPage(serverUrl);
        });

        // Start scanner button integration: long-press server url input to open native scanner
        serverUrlInput.setOnLongClickListener(v -> {
            // launch scanner activity
            Intent intent = new Intent(this, ScannerActivity.class);
            startActivityForResult(intent, 1234);
            return true;
        });
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
                progressBar.setProgress(newProgress);
            }
        });
    }

    private void loadInventoryPage(String serverUrl) {
        String inventoryUrl = serverUrl;
        if (!inventoryUrl.endsWith("/mobile-inventory.html")) {
            inventoryUrl = inventoryUrl.replaceAll("/+$", "");
            inventoryUrl += "/mobile-inventory.html";
        }

        if (!Uri.parse(inventoryUrl).isAbsolute()) {
            Toast.makeText(this, "Neplatné URL.", Toast.LENGTH_SHORT).show();
            return;
        }

        webView.loadUrl(inventoryUrl);
    }

    private String normalizeServerUrl(String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://" + url;
        }
        return url;
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1234 && resultCode == RESULT_OK && data != null) {
            String barcode = data.getStringExtra("barcode");
            if (barcode != null) {
                final String esc = JSONObject.quote(barcode);
                final String js = "(function(){try{const code=" + esc + ";const input=document.getElementById('searchInput'); if(input){input.value=code; input.dispatchEvent(new Event('input')); const ev=new KeyboardEvent('keydown',{key:'Enter'}); input.dispatchEvent(ev);} if(window.filterInventory){window.filterInventory(code);} }catch(e){} })();";
                runOnUiThread(() -> webView.evaluateJavascript(js, null));
            }
        }
    }
}
