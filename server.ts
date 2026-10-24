import express, { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to make outgoing HTTP/HTTPS request with redirects
function fetchWithRedirect(urlStr: string, headers: Record<string, string>, maxRedirects = 5): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects'));
    }
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, { headers, timeout: 8000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, urlStr).toString();
        res.resume(); // discard
        return fetchWithRedirect(nextUrl, headers, maxRedirects - 1).then(resolve).catch(reject);
      }
      resolve(res);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// 1. ICY Metadata Reader API
app.get('/api/icy', async (req: Request, res: Response) => {
  const streamUrl = req.query.url as string;
  if (!streamUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const upstreamRes = await fetchWithRedirect(streamUrl, {
      'Icy-MetaData': '1',
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18 RadioPlayer/1.0',
      'Accept': '*/*',
    });

    const icyMetaInt = upstreamRes.headers['icy-metaint'];
    const icyName = (upstreamRes.headers['icy-name'] as string) || '';
    const icyGenre = (upstreamRes.headers['icy-genre'] as string) || '';

    if (!icyMetaInt) {
      upstreamRes.destroy();
      return res.json({
        ok: true,
        title: '',
        stationName: icyName,
        genre: icyGenre,
        hasIcy: false,
      });
    }

    const metaInt = parseInt(icyMetaInt as string, 10);
    if (isNaN(metaInt) || metaInt <= 0 || metaInt > 65536) {
      upstreamRes.destroy();
      return res.json({
        ok: true,
        title: '',
        stationName: icyName,
        genre: icyGenre,
        hasIcy: false,
      });
    }

    let audioBytesRead = 0;
    let metaLength = -1;
    let metaBuffer = Buffer.alloc(0);
    let done = false;

    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        upstreamRes.destroy();
        res.json({ ok: true, title: '', stationName: icyName });
      }
    }, 6000);

    upstreamRes.on('data', (chunk: Buffer) => {
      if (done) return;

      let offset = 0;
      while (offset < chunk.length && !done) {
        if (audioBytesRead < metaInt) {
          const needed = metaInt - audioBytesRead;
          const available = chunk.length - offset;
          const toSkip = Math.min(needed, available);
          audioBytesRead += toSkip;
          offset += toSkip;
        } else if (metaLength === -1) {
          // Read metadata length byte: length = byte * 16
          const lenByte = chunk[offset];
          offset += 1;
          metaLength = lenByte * 16;
          if (metaLength === 0) {
            // No metadata in this interval, reset counter
            audioBytesRead = 0;
            metaLength = -1;
          }
        } else {
          // Reading metadata string
          const needed = metaLength - metaBuffer.length;
          const available = chunk.length - offset;
          const toRead = Math.min(needed, available);
          metaBuffer = Buffer.concat([metaBuffer, chunk.slice(offset, offset + toRead)]);
          offset += toRead;

          if (metaBuffer.length >= metaLength) {
            done = true;
            clearTimeout(timeout);
            upstreamRes.destroy();

            const rawString = metaBuffer.toString('utf8');
            // Parse StreamTitle='...';
            const match = rawString.match(/StreamTitle='([^']*)'/);
            const title = match ? match[1].trim() : '';

            return res.json({
              ok: true,
              title,
              stationName: icyName,
              genre: icyGenre,
              hasIcy: true,
            });
          }
        }
      }
    });

    upstreamRes.on('error', (err) => {
      if (!done) {
        done = true;
        clearTimeout(timeout);
        res.json({ ok: false, error: err.message, title: '', stationName: icyName });
      }
    });

    upstreamRes.on('end', () => {
      if (!done) {
        done = true;
        clearTimeout(timeout);
        res.json({ ok: true, title: '', stationName: icyName });
      }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: errorMsg, title: '' });
  }
});

// 2. Stream Proxy to allow cleartext HTTP streams on HTTPS and avoid CORS blocks
app.get('/api/proxy-stream', async (req: Request, res: Response) => {
  const streamUrl = req.query.url as string;
  if (!streamUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const upstreamRes = await fetchWithRedirect(streamUrl, {
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18 RadioClient/1.0',
      'Accept': '*/*',
    });

    const contentType = upstreamRes.headers['content-type'] || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');

    upstreamRes.pipe(res);

    req.on('close', () => {
      upstreamRes.destroy();
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).send('Error streaming upstream: ' + msg);
  }
});

// 3. Radio Browser search proxy with mirror fallback
const RADIO_BROWSER_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

app.get('/api/radio-browser/search', async (req: Request, res: Response) => {
  const { name, countrycode, tag, order = 'votes', limit = '60' } = req.query;

  for (const mirror of RADIO_BROWSER_MIRRORS) {
    try {
      const params = new URLSearchParams();
      if (name) params.append('name', name as string);
      if (countrycode) params.append('countrycode', countrycode as string);
      if (tag) params.append('tag', tag as string);
      params.append('order', order as string);
      params.append('reverse', 'true');
      params.append('limit', limit as string);
      params.append('hidebroken', 'true');

      const url = `${mirror}/json/stations/search?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SlovenianInternetRadioApp/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch {
      // Try next mirror
    }
  }

  return res.status(503).json({ error: 'Radio Browser API currently unavailable' });
});

// 4. Explicit Manifest Endpoint for PWABuilder, Lighthouse, and crawlers
app.get(['/manifest.json', '/manifest.webmanifest'], (_req: Request, res: Response) => {
  const manifestPath = path.resolve(__dirname, 'public', 'manifest.json');
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(manifestPath);
});

// 5. Download complete project ZIP archive for GitHub / local build
app.get(['/api/download-zip', '/radio-android.zip'], (_req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'public', 'radio-android.zip');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="radio-android.zip"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(zipPath);
});

// 6. Download complete project archive (.tar.gz)
app.get('/api/download-project', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="internetni-radio-android.tar.gz"');

  const tar = spawn('tar', [
    '--exclude=node_modules',
    '--exclude=.git',
    '--exclude=dist',
    '-czf',
    '-',
    '.'
  ], { cwd: path.resolve(__dirname) });

  tar.stdout.pipe(res);
  tar.stderr.on('data', (data) => console.error('Tar error:', data.toString()));
});

// Setup Vite for development or static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
