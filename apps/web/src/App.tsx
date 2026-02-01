import { useState, useCallback, useEffect, useMemo } from 'react';
import { gifToMp4, initDecode } from '@gif2mp4/core';

const SAMPLE_GIF_PATH = '/cmd.gif';

export default function App() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState<number | null>(null);

  const mp4Url = useMemo(() => (mp4Blob ? URL.createObjectURL(mp4Blob) : null), [mp4Blob]);
  useEffect(() => () => { if (mp4Url) URL.revokeObjectURL(mp4Url); }, [mp4Url]);

  const initWasm = useCallback(async () => {
    setError(null);
    try {
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';
      const decodePkg = `${base}/pkg-decode-v5`;
      const decodeMod = await import(/* @vite-ignore */ `${decodePkg}/gif2mp4_decode.js`);
      const decodeInit = decodeMod?.default;
      if (typeof decodeInit !== 'function') throw new Error('Decode WASM init not loaded');

      const decodeUrl = `${decodePkg}/gif2mp4_decode_bg.wasm`;
      const decodeInstance = await decodeInit({ module_or_path: decodeUrl });
      const decodeGifWrapper = decodeMod.decode_gif;
      if (!decodeInstance || typeof decodeGifWrapper !== 'function') {
        throw new Error('Decode WASM instance invalid');
      }
      initDecode({ ...decodeInstance, decode_gif: decodeGifWrapper });
      setReady(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      console.error('[gif2mp4] WASM init failed:', e);
    }
  }, []);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !ready) return;
      setLoading(true);
      setError(null);
      setMp4Blob(null);
      setFrameCount(null);
      try {
        const buf = new Uint8Array(await file.arrayBuffer());
        const mp4 = await gifToMp4(buf);
        setMp4Blob(new Blob([mp4], { type: 'video/mp4' }));
        setFrameCount(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[gif2mp4] Convert failed:', err);
      } finally {
        setLoading(false);
      }
    },
    [ready],
  );

  const runSample = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    setMp4Blob(null);
    try {
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';
      const res = await fetch(`${base}${SAMPLE_GIF_PATH}`);
      if (!res.ok) throw new Error(`sample.gif fetch: ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const mp4 = await gifToMp4(buf);
      setMp4Blob(new Blob([mp4], { type: 'video/mp4' }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[gif2mp4] Sample convert failed:', err);
    } finally {
      setLoading(false);
    }
  }, [ready]);

  useEffect(() => {
    initWasm();
  }, [initWasm]);

  useEffect(() => {
    if (ready) runSample();
  }, [ready, runSample]);

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>GIF → MP4</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>
        gif(Rust) → video(WebCodecs) → mp4(TS)
      </p>

      {!ready && !error && (
        <p style={{ color: '#94a3b8' }}>WASM 로딩 중…</p>
      )}
      {!ready && error && (
        <button
          type="button"
          onClick={initWasm}
          style={{
            padding: '12px 20px',
            fontSize: 16,
            background: '#4361ee',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          WASM 다시 로드
        </button>
      )}
      {ready && (
        <>
          <label
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              fontSize: 16,
              background: '#4361ee',
              color: '#fff',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            GIF 선택
            <input
              type="file"
              accept=".gif"
              onChange={onFile}
              disabled={loading}
              style={{ display: 'none' }}
            />
          </label>
          {frameCount != null && (
            <p style={{ color: '#888', marginTop: 8 }}>프레임: {frameCount}</p>
          )}
        </>
      )}

      {error && (
        <p data-testid="error-message" style={{ color: '#f87171', marginTop: 16 }} title={error}>
          {error}
        </p>
      )}
      {loading && <p style={{ color: '#94a3b8', marginTop: 16 }}>변환 중…</p>}
      {videoError && (
        <p data-testid="video-error" style={{ color: '#fbbf24', marginTop: 8 }} title={videoError}>
          비디오 로드: {videoError}
        </p>
      )}
      {mp4Blob && mp4Url && (
        <div style={{ marginTop: 24 }}>
          <video
            key={mp4Url}
            src={mp4Url}
            controls
            style={{ width: '100%', borderRadius: 8 }}
            onLoadedMetadata={() => setVideoError(null)}
            onCanPlay={() => setVideoError(null)}
            onError={(e) => {
              const el = e.currentTarget;
              const msg = el.error?.message ?? `code ${el.error?.code ?? 'unknown'}`;
              setVideoError(msg);
              console.error('[gif2mp4] Video error:', el.error);
            }}
          />
          <a
            href={mp4Url}
            download="out.mp4"
            style={{
              display: 'inline-block',
              marginTop: 12,
              color: '#60a5fa',
            }}
          >
            MP4 다운로드
          </a>
        </div>
      )}
    </div>
  );
}
