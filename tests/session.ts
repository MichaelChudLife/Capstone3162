const holder = globalThis as unknown as { ccaHubCookieJar?: Map<string, string> };

export const cookieJar: Map<string, string> = (holder.ccaHubCookieJar ??= new Map());
