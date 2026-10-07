import { describe, expect, it } from 'vitest';
import { createMemberQrPayload, parseMemberQrPayload } from './qr';

describe('member QR payloads', () => {
	it('creates a stable payload for a member pass', () => {
		const payload = createMemberQrPayload('member-1', 'demo-member-1-pass');
		expect(payload).toBe('gymhouse-member:member-1:demo-member-1-pass');
	});

	it('parses a valid payload back to the member and token', () => {
		const payload = createMemberQrPayload('member-2', 'demo-member-2-pass');
		expect(parseMemberQrPayload(payload)).toEqual({
			memberId: 'member-2',
			passToken: 'demo-member-2-pass'
		});
	});

	it('rejects malformed values', () => {
		expect(parseMemberQrPayload('not-a-qr')).toBeNull();
	});
});
