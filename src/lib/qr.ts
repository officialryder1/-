export function createMemberQrPayload(memberId: string, passToken: string): string {
	return `gymhouse-member:${memberId}:${passToken}`;
}

export function parseMemberQrPayload(payload: string): { memberId: string; passToken: string } | null {
	const match = payload.match(/^gymhouse-member:([^:]+):(.+)$/);
	if (!match) return null;

	const [, memberId, passToken] = match;
	if (!memberId || !passToken) return null;

	return { memberId, passToken };
}
