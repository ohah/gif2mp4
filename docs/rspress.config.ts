import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

const config = {
  root: path.join(__dirname, 'docs'),
  base: '/gif2mp4/',
  builderConfig: {
    output: {
      distPath: { root: 'doc_build' },
      assetPrefix: '/gif2mp4/',
    },
  },
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
      { lang: 'ko', label: '한국어', outlineTitle: '이 페이지에서' },
      { lang: 'en', label: 'English', outlineTitle: 'On this page' },
    ],
    socialLinks: [
      {
        icon: 'github' as const,
        mode: 'link' as const,
        content: 'https://github.com/ohah/gif2mp4',
      },
    ],
  },
};

export default defineConfig(config);
