// import preprocess from "svelte-preprocess";
// import adapter from '@sveltejs/adapter-vercel';
// import { vitePreprocess } from '@sveltejs/kit/vite';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
//   preprocess: [
//     vitePreprocess({ target: 'esnext' }),
//     preprocess({ postcss: true })
//   ],

//   kit: {
//     adapter: adapter({
//       runtime: 'nodejs18.x'
//     })
//   },

//   rollupOptions: {
//     external: ['stream', 'fs', 'https', 'url', 'util', 'http2', 'zlib', 'process', 'querystring', 'net', 'tls', 'assert', 'events', 'os', 'child_process', 'path', 'buffer', 'crypto'],
//   }
// };

// export default config;


// import preprocess from "svelte-preprocess";
// import adapter from '@sveltejs/adapter-vercel';
// import { vitePreprocess } from '@sveltejs/kit/vite';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
// 	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
// 	// for more information about preprocessors
// 	preprocess: [vitePreprocess(), preprocess({
//         postcss: true
//     })],

// 	kit: {
// 		adapter: adapter({
//             runtime: 'nodejs18.x'
//         })
// 	}
// };

// export default config;

import preprocess from "svelte-preprocess";
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    vitePreprocess({ target: 'esnext' }),
    preprocess({ postcss: true })
  ],

  kit: {
    adapter: adapter({
      runtime: 'nodejs18.x'
    }),
    vite: {
      resolve: {
        alias: {
          fs: false,
          path: false,
          https: false,
          url: false,
          util: false,
          http2: false,
          zlib: false,
          process: false,
          querystring: false,
          net: false,
          tls: false,
          assert: false,
          events: false,
          os: false,
          child_process: false,
          buffer: false,
          crypto: false,
        }
      }
    }
  },

  rollupOptions: {
    external: ['stream', 'fs', 'https', 'url', 'util', 'http2', 'zlib', 'process', 'querystring', 'net', 'tls', 'assert', 'events', 'os', 'child_process', 'path', 'buffer', 'crypto'],
  }
};

export default config;