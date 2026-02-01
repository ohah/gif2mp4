import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'ko',
  locales: [
    {
      lang: 'ko',
      label: '한국어',
      title: 'GIF → MP4',
      description: 'gif(Rust WASM) → video(WebCodecs) → mp4(TS) 문서',
    },
    {
      lang: 'en',
      label: 'English',
      title: 'GIF → MP4',
      description: 'gif(Rust WASM) → video(WebCodecs) → mp4(TS) docs',
    },
  ],
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  themeConfig: {
    locales: [
      { lang: 'ko', outlineTitle: '이 페이지에서' },
      { lang: 'en', outlineTitle: 'On this page' },
    ],
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/ohah/gif2mp4',
      },
    ],
  },
});
