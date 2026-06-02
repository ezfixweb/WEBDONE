package com.ezfixweb.mobile;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.Barcode;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.common.InputImage;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ScannerActivity extends AppCompatActivity {
    private static final String TAG = "ScannerActivity";
    private PreviewView previewView;
    private Button closeScannerBtn;
    private TextView scannerHint;
    private ListenableFuture<ProcessCameraProvider> cameraProviderFuture;
    private ExecutorService cameraExecutor;
    private BarcodeScanner barcodeScanner;

    private ActivityResultLauncher<String> requestPermissionLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scanner);

        previewView = findViewById(R.id.previewView);
        closeScannerBtn = findViewById(R.id.closeScannerBtn);
        scannerHint = findViewById(R.id.scannerHint);

        barcodeScanner = BarcodeScanning.getClient();
        cameraExecutor = Executors.newSingleThreadExecutor();

        requestPermissionLauncher = registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
            if (isGranted) startCamera();
            else finish();
        });

        closeScannerBtn.setOnClickListener(v -> finish());

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCamera();
        } else {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
    }

    private void startCamera() {
        cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                bindPreviewAndAnalysis(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                Log.e(TAG, "Camera provider failed", e);
                finish();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindPreviewAndAnalysis(@NonNull ProcessCameraProvider cameraProvider) {
        cameraProvider.unbindAll();

        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        ImageAnalysis analysis = new ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        analysis.setAnalyzer(cameraExecutor, imageProxy -> {
            processImageProxy(imageProxy);
        });

        CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;

        cameraProvider.bindToLifecycle(this, cameraSelector, preview, analysis);
    }

    private void processImageProxy(ImageProxy imageProxy) {
        try {
            @SuppressWarnings("ConstantConditions")
            final android.media.Image mediaImage = imageProxy.getImage();
            if (mediaImage != null) {
                InputImage image = InputImage.fromMediaImage(mediaImage, imageProxy.getImageInfo().getRotationDegrees());
                barcodeScanner.process(image)
                        .addOnSuccessListener(barcodes -> {
                            if (barcodes != null && !barcodes.isEmpty()) {
                                Barcode barcode = barcodes.get(0);
                                String value = barcode.getRawValue();
                                if (value != null && !value.isEmpty()) {
                                    onBarcodeDetected(value);
                                }
                            }
                        })
                        .addOnFailureListener(e -> {
                            // ignore
                        })
                        .addOnCompleteListener(task -> imageProxy.close());
            } else {
                imageProxy.close();
            }
        } catch (Exception e) {
            try { imageProxy.close(); } catch (Exception ignore) {}
        }
    }

    private void onBarcodeDetected(String value) {
        // Return result to caller
        Intent data = new Intent();
        data.putExtra("barcode", value);
        setResult(RESULT_OK, data);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (cameraExecutor != null) cameraExecutor.shutdown();
        if (barcodeScanner != null) barcodeScanner.close();
    }
}
