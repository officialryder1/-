#!/usr/bin/env node
// scripts/apply-migration.mjs <path-to-sql>
//
// Applies a .sql migration to a Supabase project via the Management API.
// Use this when /rest/v1/sql is disabled (it usually is — PostgREST treats
// `sql` as a table and returns 404 PGRST205).
//
// Requires in .env:
//   PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
//   SUPABASE_ACCESS_TOKEN=sbp_...     <- Personal Access Token (NOT service-role)
//
// The service-role key (sb_secret_...) is for the admin client INSIDE app code.
// The access token (sbp_...) is for THIS script. Do not substitute one for the other.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv(path) {
	const out = {};
	let raw;
	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		return out;
	}
	for (const line of raw.split(/\r?\n/)) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const i = t.indexOf('=');
		if (i === -1) continue;
		const key = t.slice(0, i).trim();
		let val = t.slice(i + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		out[key] = val;
	}
	return out;
}

const env = loadEnv(resolve(root, '.env'));
const url = env.PUBLIC_SUPABASE_URL;
const token = env.SUPABASE_ACCESS_TOKEN;

const missing = [];
if (!url) missing.push('PUBLIC_SUPABASE_URL');
if (!token) missing.push('SUPABASE_ACCESS_TOKEN');
if (missing.length) {
	console.error(`Missing in .env: ${missing.join(', ')}`);
	console.error('This project has NO Supabase instance yet (by design).');
	console.error('Provision one, add these keys, then re-run. See supabase/README.md.');
	process.exit(1);
}

const ref = url.replace(/\/$/, '').split('//')[1].split('.')[0];
const rel = process.argv[2];
if (!rel) {
	console.error('Usage: node scripts/apply-migration.mjs <path-to-sql>');
	process.exit(1);
}
const sql = readFileSync(resolve(root, rel), 'utf8');

console.log(`Applying ${rel} to project ${ref} ...`);

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	},
	body: JSON.stringify({ query: sql })
});

const text = await res.text();
if (!res.ok) {
	console.error(`FAILED ${res.status}:`, text.slice(0, 2000));
	process.exit(1);
}
console.log('OK:', text.slice(0, 500));
