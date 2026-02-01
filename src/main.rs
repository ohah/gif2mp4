
use std::fs::File;

use x264::*;

use regex::Regex;

use std::env;
use std::fs::File;
use std::io::{Write, Read};


fn main() {
  println!("Hello, world!");
  let input = File::open("cmd.gif").unwrap();
  // Configure the decoder such that it will expand the image to RGBA.
  let mut options = gif::DecodeOptions::new();
  options.set_color_output(gif::ColorOutput::RGBA);
  // Read the file header
  let mut decoder = options.read_info(input).unwrap();
  while let Some(frame) = decoder.read_next_frame().unwrap() {
      // Process every frame
  }
  let args: Vec<String> = env::args().collect();
  let re = Regex::new(r"(\d+)x(\d+)").unwrap();
  if args.len() < 3 {
      panic!("Missing argument:\nUsage:\n{} 640x480 in.yuv out.h264\n",
             args[0]);
  }
  let caps = re.captures(args[1].as_str()).unwrap();
  let w: usize = caps[1].parse().unwrap();
  let h: usize = caps[2].parse().unwrap();

  let mut par = Param::default_preset("medium", None).unwrap();

  par = par.set_dimension(h, w);
  par = par.param_parse("repeat_headers", "1").unwrap();
  par = par.param_parse("annexb", "1").unwrap();
  par = par.apply_profile("high").unwrap();

  let mut pic = Picture::from_param(&par).unwrap();

  let mut enc = Encoder::open(&mut par).unwrap();
  let mut input = File::open(args[2].as_str()).unwrap();
  let mut output = File::create(args[3].as_str()).unwrap();
  let mut timestamp = 0;

  'out: loop {
      // TODO read by line, the stride could be different from width
      for plane in 0..3 {
          let mut buf = pic.as_mut_slice(plane).unwrap();
          if input.read_exact(&mut buf).is_err() {
              break 'out;
          }
      }

      pic = pic.set_timestamp(timestamp);
      timestamp += 1;
      if let Some((nal, _, _)) = enc.encode(&pic).unwrap() {
          let buf = nal.as_bytes();
          output.write(buf).unwrap();
      }
  }

  while enc.delayed_frames() {
      if let Some((nal, _, _)) = enc.encode(None).unwrap() {
          let buf = nal.as_bytes();
          output.write(buf).unwrap();
      }
  }
}
