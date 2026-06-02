package com.ezfixweb.mobile;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

import com.honeywell.aidc.AidcManager;
import com.honeywell.aidc.BarcodeReader;
import com.honeywell.aidc.BarcodeReadEvent;
import com.honeywell.aidc.BarcodeFailureEvent;
import com.honeywell.aidc.ScannerUnavailableException;

public class ScannerActivity extends AppCompatActivity {
    private static final String TAG = "ScannerActivity";
    private AidcManager aidcManager;
    private BarcodeReader barcodeReader;
    private Button closeScannerBtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scanner);

        closeScannerBtn = findViewById(R.id.closeScannerBtn);
        closeScannerBtn.setOnClickListener(v -> finish());

        // Initialize AIDC manager and barcode reader
        AidcManager.create(this, new AidcManager.CreatedCallback() {
            @Override
            public void onCreated(AidcManager manager) {
                aidcManager = manager;
                barcodeReader = aidcManager.createBarcodeReader();

                barcodeReader.addBarcodeListener(new BarcodeReader.BarcodeListener() {
                    @Override
                    public void onBarcodeEvent(BarcodeReadEvent event) {
                        String code = event.getBarcodeData();
                        if (code != null && !code.isEmpty()) {
                            onDetected(code);
                        }
                    }

                    @Override
                    public void onFailureEvent(BarcodeFailureEvent event) {
                        // ignore
                    }
                });

                try {
                    barcodeReader.claim();
                } catch (ScannerUnavailableException e) {
                    Log.e(TAG, "Scanner unavailable", e);
                    finish();
                }
            }
        });
    }

    private void onDetected(String value) {
        Intent data = new Intent();
        data.putExtra("barcode", value);
        setResult(RESULT_OK, data);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            if (barcodeReader != null) {
                try { barcodeReader.release(); } catch (Exception ignored) {}
                barcodeReader = null;
            }
            if (aidcManager != null) {
                try { aidcManager.close(); } catch (Exception ignored) {}
                aidcManager = null;
            }
        } catch (Exception e) {
            // ignore
        }
    }
}
