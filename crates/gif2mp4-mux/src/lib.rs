use js_sys::{Array, Reflect, Uint8Array};
use muxide::api::{MuxerBuilder, VideoCodec};
use std::cell::RefCell;
use std::io::Write;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

/// Shared buffer so we can get bytes after muxer is consumed.
struct SharedBuf(Rc<RefCell<Vec<u8>>>);

impl Write for SharedBuf {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.0.borrow_mut().extend_from_slice(buf);
        Ok(buf.len())
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

/// Mux H.264 chunks into MP4.
/// chunks: JS array of { data: Uint8Array, timestamp: number (µs), duration: number (µs), keyFrame: boolean }
/// Returns MP4 file bytes.
#[wasm_bindgen]
pub fn mux_mp4(
    width: u32,
    height: u32,
    framerate: f64,
    chunks: JsValue,
) -> Result<Vec<u8>, JsValue> {
    let arr = Array::from(&chunks);
    let buf = Rc::new(RefCell::new(Vec::new()));
    let writer = SharedBuf(Rc::clone(&buf));

    let mut muxer = MuxerBuilder::new(writer)
        .video(VideoCodec::H264, width, height, framerate)
        .with_fast_start(false)
        .build()
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    for i in 0..arr.length() {
        let el = arr.get(i);
        let data_js = Reflect::get(&el, &JsValue::from_str("data"))
            .map_err(|_| JsValue::from_str("chunk.data"))?;
        let data = Uint8Array::new(&data_js).to_vec();
        let timestamp_us = Reflect::get(&el, &JsValue::from_str("timestamp"))
            .ok()
            .and_then(|v| v.as_f64())
            .ok_or_else(|| JsValue::from_str("chunk.timestamp"))? as u64;
        let key_frame = Reflect::get(&el, &JsValue::from_str("keyFrame"))
            .map(|v| v.as_bool().unwrap_or(false))
            .unwrap_or(false);
        let pts_secs = timestamp_us as f64 / 1_000_000.0;
        muxer
            .write_video(pts_secs, &data, key_frame)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    }

    muxer
        .finish_with_stats()
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let out = buf.borrow().clone();
    Ok(out)
}
