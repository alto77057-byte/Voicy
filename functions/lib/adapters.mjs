// Small adapters so the same app code runs on Netlify Blobs (instead of Cloudflare R2 / KV).
import { getStore } from '@netlify/blobs';

const getEnv = k => (typeof Netlify !== 'undefined' ? Netlify.env.get(k) : process.env[k]);

const toArrayBuffer = async body => {
  if (body instanceof ArrayBuffer) return body;
  if (typeof body === 'string') return new TextEncoder().encode(body).buffer;
  if (ArrayBuffer.isView(body)) return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  return new Response(body).arrayBuffer();
};

const parseRange = (header, size) => {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start, end;
  if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (start > end || start >= size) return null;
  return { offset: start, length: end - start + 1 };
};

export function makeAdapters(getStoreFn = getStore) {
  const blobs = getStoreFn({ name: 'audio', consistency: 'strong' });
  const data = getStoreFn({ name: 'data', consistency: 'strong' });

  const BUCKET = {
    async put(key, body, o = {}) {
      await blobs.set(key, await toArrayBuffer(body), {
        metadata: { ct: (o.httpMetadata && o.httpMetadata.contentType) || 'application/octet-stream', md: o.customMetadata || {} },
      });
    },
    async head(key) {
      const r = await blobs.getMetadata(key);
      return r ? { customMetadata: (r.metadata && r.metadata.md) || {} } : null;
    },
    async get(key, opts = {}) {
      const r = await blobs.getWithMetadata(key, { type: 'arrayBuffer' });
      if (!r) return null;
      const ab = r.data, size = ab.byteLength, meta = r.metadata || {};
      const range = opts.range && opts.range.get ? parseRange(opts.range.get('range'), size) : null;
      return {
        body: range ? ab.slice(range.offset, range.offset + range.length) : ab,
        size, range: range || undefined,
        customMetadata: meta.md || {},
        httpMetadata: { contentType: meta.ct },
        httpEtag: '"' + String(r.etag || 'x').replace(/"/g, '') + '"',
        writeHttpMetadata(h) { if (meta.ct) h.set('content-type', meta.ct); },
        async json() { return JSON.parse(new TextDecoder().decode(ab)); },
        async arrayBuffer() { return ab; },
      };
    },
    async list(o = {}) {
      const { blobs: items } = await blobs.list({ prefix: o.prefix || '' });
      const objects = [];
      for (const b of items) {
        const m = await blobs.getMetadata(b.key);
        const md = (m && m.metadata && m.metadata.md) || {};
        objects.push({ key: b.key, customMetadata: md, uploaded: new Date(md.created || Date.now()) });
      }
      return { objects, truncated: false };
    },
    async delete(keys) { for (const k of [].concat(keys)) await blobs.delete(k); },
  };

  const DATA = {
    async get(k) {
      const r = await data.getWithMetadata(k);
      if (!r) return null;
      const exp = r.metadata && r.metadata.exp;
      return exp && exp < Date.now() ? null : r.data;
    },
    async put(k, v, o = {}) {
      await data.set(k, String(v), o.expirationTtl ? { metadata: { exp: Date.now() + o.expirationTtl * 1000 } } : {});
    },
  };

  // Simple per-minute limiter (10 uploads / minute / IP)
  const LIMITER = {
    async limit({ key }) {
      const k = 'r:' + key + ':' + Math.floor(Date.now() / 60000);
      const n = Number(await DATA.get(k)) || 0;
      if (n >= 10) return { success: false };
      await DATA.put(k, String(n + 1), { expirationTtl: 120 });
      return { success: true };
    },
  };
  return { BUCKET, DATA, LIMITER, dataStore: data };
}

export function makeEnv(getStoreFn) {
  const a = makeAdapters(getStoreFn);
  return new Proxy({}, {
    get: (_, k) => (k === 'BUCKET' ? a.BUCKET : k === 'DATA' ? a.DATA : k === 'LIMITER' ? a.LIMITER : typeof k === 'string' ? getEnv(k) : undefined),
  });
}
