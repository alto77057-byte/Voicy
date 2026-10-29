import core from './lib/core.mjs';
import { makeEnv } from './lib/adapters.mjs';

// IMPORTANT: create the storage connection fresh for every request.
// Netlify gives each request a short-lived token; reusing an old connection causes "Token expired".
export default async (request) => {
  try {
    return await core.fetch(request, makeEnv());
  } catch (e) {
    console.error('Request failed:', e && e.stack || e);
    const isApi = new URL(request.url).pathname.startsWith('/api/');
    return isApi
      ? new Response(JSON.stringify({ error: 'Something went wrong on the server. Please try again.' }), { status: 500, headers: { 'content-type': 'application/json' } })
      : new Response('Something went wrong. Please try again in a moment.', { status: 500, headers: { 'content-type': 'text/plain' } });
  }
};

export const config = {
  path: ['/', '/a/*', '/f/*', '/v/*', '/api/*', '/redeem', '/share-target', '/og.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/sw.js'],
};
