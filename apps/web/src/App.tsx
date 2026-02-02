import { useState, useCallback, useEffect, useMemo } from 'react';
import { gifToMp4, initDecode, initMux, decodeGifToFrames, encodeAndMuxToMp4 } from '@gif2mp4/core';
import { decodeGifWithGifuct } from './decodeGifWithGifuct';

/** 예제/벤치마크용 GIF (로컬 움짤.gif → public/umjjal.gif) */
const SAMPLE_GIF_PATH = '/umjjal.gif';

export interface BenchmarkResult {
  wasm: { decodeMs: number; encodeMs: number; totalMs: number };
  gifuct: { decodeMs: number; encodeMs: number; totalMs: number };
  frameCount: number;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState<number | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);

  const mp4Url = useMemo(() => (mp4Blob ? URL.createObjectURL(mp4Blob) : null), [mp4Blob]);
  useEffect(
    () => () => {
      if (mp4Url) URL.revokeObjectURL(mp4Url);
    },
    [mp4Url]
  );

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

      const muxPkg = `${base}/pkg-mux-v5`;
      const muxMod = await import(/* @vite-ignore */ `${muxPkg}/gif2mp4_mux.js`);
      const muxInit = muxMod?.default;
      if (typeof muxInit !== 'function') throw new Error('Mux WASM init not loaded');
      const muxUrl = `${muxPkg}/gif2mp4_mux_bg.wasm`;
      const muxInstance = await muxInit({ module_or_path: muxUrl });
      if (!muxInstance?.mux_mp4) throw new Error('Mux WASM instance invalid');
      initMux({ mux_mp4: muxInstance.mux_mp4 });

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
        setMp4Blob(new Blob([mp4 as BlobPart], { type: 'video/mp4' }));
        setFrameCount(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[gif2mp4] Convert failed:', err);
      } finally {
        setLoading(false);
      }
    },
    [ready]
  );

  const runSample = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    setMp4Blob(null);
    try {
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';
      const res = await fetch(`${base}${SAMPLE_GIF_PATH}`);
      if (!res.ok) throw new Error(`sample GIF fetch: ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const mp4 = await gifToMp4(buf);
      setMp4Blob(new Blob([mp4 as BlobPart], { type: 'video/mp4' }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[gif2mp4] Sample convert failed:', err);
    } finally {
      setLoading(false);
    }
  }, [ready]);

  const runBenchmark = useCallback(
    async (gifBuffer: Uint8Array) => {
      if (!ready) return;
      setBenchmarking(true);
      setBenchmarkResult(null);
      setError(null);
      let frameCount = 0;
      const errors: string[] = [];

      try {
        frameCount = decodeGifToFrames(gifBuffer).frames.length;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setBenchmarking(false);
        return;
      }

      let w: BenchmarkResult['wasm'] | null = null;
      try {
        const t0w = performance.now();
        const decodedWasm = decodeGifToFrames(gifBuffer);
        const t1w = performance.now();
        await encodeAndMuxToMp4(decodedWasm);
        const t2w = performance.now();
        w = {
          decodeMs: Math.round((t1w - t0w) * 100) / 100,
          encodeMs: Math.round((t2w - t1w) * 100) / 100,
          totalMs: Math.round((t2w - t0w) * 100) / 100,
        };
      } catch (e) {
        errors.push(`WASM: ${e instanceof Error ? e.message : String(e)}`);
      }

      await new Promise((r) => setTimeout(r, 500));

      let g: BenchmarkResult['gifuct'] | null = null;
      try {
        const t0g = performance.now();
        const decodedGifuct = decodeGifWithGifuct(gifBuffer);
        const t1g = performance.now();
        await encodeAndMuxToMp4(decodedGifuct);
        const t2g = performance.now();
        g = {
          decodeMs: Math.round((t1g - t0g) * 100) / 100,
          encodeMs: Math.round((t2g - t1g) * 100) / 100,
          totalMs: Math.round((t2g - t0g) * 100) / 100,
        };
      } catch (e) {
        errors.push(`gifuct: ${e instanceof Error ? e.message : String(e)}`);
      }

      setBenchmarkResult({
        wasm: w ?? { decodeMs: 0, encodeMs: 0, totalMs: 0 },
        gifuct: g ?? { decodeMs: 0, encodeMs: 0, totalMs: 0 },
        frameCount,
      });
      if (errors.length) setError(errors.join(' / '));
      setBenchmarking(false);
    },
    [ready]
  );

  const onBenchmarkSample = useCallback(async () => {
    if (!ready) return;
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';
    const res = await fetch(`${base}${SAMPLE_GIF_PATH}`);
    if (!res.ok) throw new Error(`benchmark GIF fetch: ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    await runBenchmark(buf);
  }, [ready, runBenchmark]);

  useEffect(() => {
    initWasm();
  }, [initWasm]);

  useEffect(() => {
    if (ready) runSample();
  }, [ready, runSample]);

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>GIF → MP4</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>gif(Rust) → video(WebCodecs) → mp4(TS)</p>

      {!ready && !error && <p style={{ color: '#94a3b8' }}>WASM 로딩 중…</p>}
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
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              data-testid="benchmark-button"
              onClick={onBenchmarkSample}
              disabled={benchmarking}
              style={{
                padding: '10px 16px',
                fontSize: 14,
                background: '#64748b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: benchmarking ? 'not-allowed' : 'pointer',
              }}
            >
              {benchmarking ? '벤치마크 중…' : '벤치마크 (움짤.gif)'}
            </button>
          </div>
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
      {benchmarkResult && (
        <div
          data-testid="benchmark-result"
          style={{
            marginTop: 24,
            padding: 16,
            background: '#1e293b',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
            벤치마크 결과 (프레임: {benchmarkResult.frameCount})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>구분</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>디코드 (ms)</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>인코드+뮤스 (ms)</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>총 (ms)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '8px 0' }}>Rust WASM</td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  {benchmarkResult.wasm.totalMs ? benchmarkResult.wasm.decodeMs : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  {benchmarkResult.wasm.totalMs ? benchmarkResult.wasm.encodeMs : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  {benchmarkResult.wasm.totalMs ? benchmarkResult.wasm.totalMs : '실패'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '8px 0' }}>gifuct-js</td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  {benchmarkResult.gifuct.totalMs ? benchmarkResult.gifuct.decodeMs : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  {benchmarkResult.gifuct.totalMs ? benchmarkResult.gifuct.encodeMs : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  {benchmarkResult.gifuct.totalMs ? benchmarkResult.gifuct.totalMs : '실패'}
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 12, marginBottom: 0, color: '#94a3b8' }}>
            {benchmarkResult.wasm.totalMs && benchmarkResult.gifuct.totalMs ? (
              <>
                총 시간:{' '}
                {benchmarkResult.wasm.totalMs <= benchmarkResult.gifuct.totalMs ? (
                  <>
                    WASM이{' '}
                    <strong style={{ color: '#86efac' }}>
                      {(benchmarkResult.gifuct.totalMs / benchmarkResult.wasm.totalMs).toFixed(2)}배
                    </strong>{' '}
                    빠름
                  </>
                ) : (
                  <>
                    gifuct-js가{' '}
                    <strong style={{ color: '#fcd34d' }}>
                      {(benchmarkResult.wasm.totalMs / benchmarkResult.gifuct.totalMs).toFixed(2)}배
                    </strong>{' '}
                    빠름
                  </>
                )}
              </>
            ) : (
              <>한쪽만 성공해 비교 불가. 위 에러 메시지 확인.</>
            )}
          </p>
        </div>
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
