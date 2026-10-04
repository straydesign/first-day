#!/usr/bin/env node
/**
 * Prints the Sign in with Apple client secret Supabase needs (Auth → Providers
 * → Apple → Secret Key). Apple caps it at 6 months, so this must be re-run and
 * re-pasted before it expires — the expiry date is printed to stderr.
 *
 * Usage: node scripts/apple-client-secret.mjs ~/.private_keys/AuthKey_DK99K6BAZA.p8
 */
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const TEAM_ID = "YR6JAV8G6B";
const KEY_ID = "DK99K6BAZA";
const SERVICES_ID = "life.firstday.signin";
const MAX_AGE_S = 180 * 24 * 60 * 60;

const keyPath = process.argv[2];
if (!keyPath) throw new Error("Pass the path to the .p8 key");

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const header = { alg: "ES256", kid: KEY_ID };
const payload = { iss: TEAM_ID, iat: now, exp: now + MAX_AGE_S, aud: "https://appleid.apple.com", sub: SERVICES_ID };

const input = `${b64url(header)}.${b64url(payload)}`;
const key = createPrivateKey(readFileSync(keyPath));
const signature = sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");

process.stdout.write(`${input}.${signature}\n`);
console.error(`Expires ${new Date(payload.exp * 1000).toISOString().slice(0, 10)} — regenerate before then.`);
