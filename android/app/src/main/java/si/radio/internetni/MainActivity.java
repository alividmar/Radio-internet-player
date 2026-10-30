package si.radio.internetni;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin mora biti registriran PRED super.onCreate
        registerPlugin(RadioNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
