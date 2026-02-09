use gif::DecodeOptions;
use js_sys::Array;
use wasm_bindgen::prelude::*;

/// Per-frame metadata; pixel data is in the shared buffer.
#[wasm_bindgen]
#[derive(Clone)]
pub struct FrameMeta {
    offset: u32,
    length: u32,
    width: u32,
    height: u32,
    delay_centisecs: u16,
}

#[wasm_bindgen]
impl FrameMeta {
    #[wasm_bindgen(getter)]
    pub fn offset(&self) -> u32 {
        self.offset
    }
    #[wasm_bindgen(getter)]
    pub fn length(&self) -> u32 {
        self.length
    }
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.width
    }
    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }
    #[wasm_bindgen(getter)]
    pub fn delay_centisecs(&self) -> u16 {
        self.delay_centisecs
    }
}

/// Decode result: one contiguous RGBA buffer + frame metadata.
#[wasm_bindgen]
pub struct DecodeResult {
    buffer: Vec<u8>,
    frames: Vec<FrameMeta>,
}

#[wasm_bindgen]
impl DecodeResult {
    /// Single RGBA buffer (all frames concatenated). Copy from WASM once.
    #[wasm_bindgen(getter)]
    pub fn buffer(&self) -> js_sys::Uint8Array {
        js_sys::Uint8Array::from(&self.buffer[..])
    }
    /// Array of { offset, length, width, height, delay_centisecs }.
    #[wasm_bindgen(getter)]
    pub fn frames(&self) -> Array {
        let arr = Array::new();
        for m in &self.frames {
            let val: JsValue = m.clone().into();
            arr.push(&val);
        }
        arr
    }
}

/// Decode GIF bytes into one buffer + frame metadata.
/// Uses gif-dispose so disposal (restore to background / previous) is applied; each frame is the correct full image.
#[wasm_bindgen]
pub fn decode_gif(gif_bytes: &[u8]) -> Result<DecodeResult, JsValue> {
    let mut options = DecodeOptions::new();
    options.set_color_output(gif::ColorOutput::Indexed);

    let mut decoder = options
        .read_info(std::io::Cursor::new(gif_bytes))
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let width = decoder.width() as u32;
    let height = decoder.height() as u32;
    let frame_len = (width as usize) * (height as usize) * 4;

    let mut buffer = Vec::new();
    let mut frames = Vec::new();
    let mut screen = gif_dispose::Screen::new_decoder(&decoder);

    while let Some(frame) = decoder
        .read_next_frame()
        .map_err(|e| JsValue::from_str(&e.to_string()))?
    {
        screen
            .blit_frame(&frame)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let img = screen.pixels_rgba();
        let mut rgba = Vec::with_capacity(frame_len);
        for p in img.buf().iter() {
            rgba.push(p.r);
            rgba.push(p.g);
            rgba.push(p.b);
            rgba.push(p.a);
        }
        let offset = buffer.len() as u32;
        buffer.extend_from_slice(&rgba);
        frames.push(FrameMeta {
            offset,
            length: frame_len as u32,
            width,
            height,
            delay_centisecs: frame.delay,
        });
    }

    Ok(DecodeResult { buffer, frames })
}
