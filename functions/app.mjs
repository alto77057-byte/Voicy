import core from './lib/core.mjs';
import { makeEnv } from './lib/adapters.mjs';

let env;
export default async (request) => {
  env = env || makeEnv();
  return core.fetch(request, env);
};

export const config = {
  path: ['/', '/a/*', '/f/*', '/v/*', '/api/*', '/redeem', '/share-target', '/og.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/sw.js'],
};
