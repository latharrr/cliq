package com.lpu.cliq;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Force Maximum Refresh Rate (120Hz/144Hz) for smoother scrolling
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Display.Mode[] modes = getWindow().getWindowManager().getDefaultDisplay().getSupportedModes();
            Display.Mode maxMode = null;
            float maxFPS = 0f;
            for (Display.Mode mode : modes) {
                if (mode.getRefreshRate() > maxFPS) {
                    maxFPS = mode.getRefreshRate();
                    maxMode = mode;
                }
            }
            if (maxMode != null) {
                WindowManager.LayoutParams layoutParams = getWindow().getAttributes();
                layoutParams.preferredDisplayModeId = maxMode.getModeId();
                getWindow().setAttributes(layoutParams);
            }
        }
    }
}
