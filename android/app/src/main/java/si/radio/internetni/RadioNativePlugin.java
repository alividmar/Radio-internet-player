package si.radio.internetni;

import android.content.Context;
import android.content.Intent;
import android.database.ContentObserver;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.net.ssl.SSLSocketFactory;

/**
 * Native pomocnik za RadioKlic:
 *  - getIcy: prebere ICY naslov ("StreamTitle") neposredno iz toka (brez CORS omejitev)
 *  - setSystemVolume: nastavi sistemsko glasnost medija (0..1)
 */
@CapacitorPlugin(name = "RadioNative")
public class RadioNativePlugin extends Plugin {

    private static final int TIMEOUT_MS = 8000;
    private static final int MAX_REDIRECTS = 5;
    private static final Pattern TITLE = Pattern.compile("StreamTitle='(.*?)';", Pattern.DOTALL);

    @PluginMethod
    public void getIcy(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url manjka");
            return;
        }
        new Thread(() -> {
            JSObject ret = new JSObject();
            String title = "";
            try {
                title = readIcyTitle(url);
            } catch (Throwable ignored) {
                // tiho: JS obdrži prejšnji naslov
            }
            ret.put("title", title == null ? "" : title);
            call.resolve(ret);
        }, "icy-reader").start();
    }

    // ───────────────── Sistemska glasnost medija ─────────────────

    private AudioManager audio;
    private ContentObserver volumeObserver;
    private int lastIndex = -1;

    @Override
    public void load() {
        audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        lastIndex = audio.getStreamVolume(AudioManager.STREAM_MUSIC);
        volumeObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
            @Override
            public void onChange(boolean selfChange) {
                int cur = audio.getStreamVolume(AudioManager.STREAM_MUSIC);
                if (cur == lastIndex) return; // naša lastna sprememba ali brez spremembe
                lastIndex = cur;
                JSObject o = new JSObject();
                o.put("level", levelOf(cur));
                notifyListeners("volumeChanged", o);
            }
        };
        getContext().getContentResolver().registerContentObserver(Settings.System.CONTENT_URI, true, volumeObserver);
    }

    @Override
    protected void handleOnDestroy() {
        if (volumeObserver != null) {
            getContext().getContentResolver().unregisterContentObserver(volumeObserver);
        }
    }

    private double levelOf(int index) {
        int max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        return max <= 0 ? 0 : (double) index / max;
    }

    @PluginMethod
    public void getSystemVolume(PluginCall call) {
        JSObject o = new JSObject();
        o.put("level", levelOf(audio.getStreamVolume(AudioManager.STREAM_MUSIC)));
        call.resolve(o);
    }

    @PluginMethod
    public void setSystemVolume(PluginCall call) {
        try {
            Double level = call.getDouble("level", 0.5);
            double l = level == null ? 0.5 : Math.max(0.0, Math.min(1.0, level));
            int max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int idx = (int) Math.round(l * max);
            lastIndex = idx; // da observer tega ne javi kot spremembo uporabnika
            audio.setStreamVolume(AudioManager.STREAM_MUSIC, idx, 0);
            call.resolve();
        } catch (Throwable t) {
            // npr. SecurityException v načinu Ne moti
            call.reject("setSystemVolume: " + t.getMessage());
        }
    }

    // ───────────────── Storitev v ospredju (predvajanje ob ugasnjenem zaslonu) ─────────────────

    @PluginMethod
    public void startService(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), RadioService.class);
            i.putExtra("station", call.getString("station", "RadioKlic"));
            ContextCompat.startForegroundService(getContext(), i);
            call.resolve();
        } catch (Throwable t) {
            call.reject("startService: " + t.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            getContext().stopService(new Intent(getContext(), RadioService.class));
            call.resolve();
        } catch (Throwable t) {
            call.reject("stopService: " + t.getMessage());
        }
    }

    // ───────────────────────── ICY branje ─────────────────────────

    private String readIcyTitle(String startUrl) throws IOException {
        String current = startUrl;
        for (int hop = 0; hop <= MAX_REDIRECTS; hop++) {
            URL u = new URL(current);
            boolean https = "https".equalsIgnoreCase(u.getProtocol());
            int port = u.getPort() > 0 ? u.getPort() : (https ? 443 : 80);
            String path = u.getFile();
            if (path == null || path.isEmpty()) path = "/";

            Socket socket = new Socket();
            try {
                socket.connect(new InetSocketAddress(u.getHost(), port), TIMEOUT_MS);
                socket.setSoTimeout(TIMEOUT_MS);
                if (https) {
                    socket = ((SSLSocketFactory) SSLSocketFactory.getDefault())
                            .createSocket(socket, u.getHost(), port, true);
                    socket.setSoTimeout(TIMEOUT_MS);
                }
                OutputStream out = socket.getOutputStream();
                String req = "GET " + path + " HTTP/1.0\r\n"
                        + "Host: " + u.getHost() + "\r\n"
                        + "User-Agent: Mozilla/5.0 RadioKlic\r\n"
                        + "Icy-MetaData: 1\r\n"
                        + "Accept: */*\r\n"
                        + "Connection: close\r\n\r\n";
                out.write(req.getBytes("ISO-8859-1"));
                out.flush();

                InputStream in = socket.getInputStream();
                String statusLine = readLine(in);
                if (statusLine == null) return "";
                int status = parseStatus(statusLine);

                Map<String, String> headers = new HashMap<>();
                String line;
                while ((line = readLine(in)) != null && !line.isEmpty()) {
                    int c = line.indexOf(':');
                    if (c > 0) {
                        headers.put(line.substring(0, c).trim().toLowerCase(), line.substring(c + 1).trim());
                    }
                }

                if (status >= 300 && status < 400) {
                    String loc = headers.get("location");
                    if (loc == null) return "";
                    current = new URL(u, loc).toString();
                    continue;
                }

                String metaint = headers.get("icy-metaint");
                if (metaint == null) return ""; // tok brez ICY metapodatkov
                int interval = Integer.parseInt(metaint.trim());
                if (interval <= 0 || interval > 1_000_000) return "";

                skipFully(in, interval);
                int lenByte = in.read();
                if (lenByte <= 0) return ""; // prazen blok = ni spremembe
                byte[] meta = new byte[lenByte * 16];
                readFully(in, meta);
                String text = decode(meta);
                Matcher m = TITLE.matcher(text);
                return m.find() ? m.group(1).trim() : "";
            } finally {
                try { socket.close(); } catch (IOException ignored) { }
            }
        }
        return "";
    }

    private static int parseStatus(String line) {
        // "HTTP/1.1 200 OK" ali "ICY 200 OK"
        String[] p = line.split(" ");
        if (p.length >= 2) {
            try { return Integer.parseInt(p[1].trim()); } catch (NumberFormatException ignored) { }
        }
        return 200;
    }

    private static String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\n') break;
            if (b != '\r') bo.write(b);
            if (bo.size() > 8192) break;
        }
        if (b == -1 && bo.size() == 0) return null;
        return bo.toString("ISO-8859-1");
    }

    private static void skipFully(InputStream in, int n) throws IOException {
        byte[] buf = new byte[4096];
        int left = n;
        while (left > 0) {
            int r = in.read(buf, 0, Math.min(buf.length, left));
            if (r < 0) throw new IOException("konec toka");
            left -= r;
        }
    }

    private static void readFully(InputStream in, byte[] dst) throws IOException {
        int off = 0;
        while (off < dst.length) {
            int r = in.read(dst, off, dst.length - off);
            if (r < 0) throw new IOException("konec toka");
            off += r;
        }
    }

    private static String decode(byte[] data) {
        // Najprej strogi UTF-8, sicer windows-1250 (SLO/CE znaki)
        try {
            return Charset.forName("UTF-8").newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(data)).toString();
        } catch (CharacterCodingException e) {
            try {
                return new String(data, "windows-1250");
            } catch (Exception ex) {
                return new String(data);
            }
        }
    }
}
