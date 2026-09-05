import * as cheerio from 'cheerio';

export interface CookieItem {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  text: string;
  url: string;
  cookies: Record<string, string>;
  isHtml: boolean;
  isJson: boolean;
  $?: cheerio.CheerioAPI;
  durationMs: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  authHeader?: string;
}

export class CookieJar {
  private cookies: Map<string, CookieItem> = new Map();

  public setCookiesFromHeader(setCookieHeader: string | string[] | null | undefined, requestUrl: string) {
    if (!setCookieHeader) return;
    const headerList = Array.isArray(setCookieHeader) 
      ? setCookieHeader 
      : setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_\-]+=[^;])/);

    const urlObj = new URL(requestUrl);

    for (const raw of headerList) {
      const parts = raw.split(';').map(p => p.trim());
      if (parts.length === 0) continue;
      const [nameVal, ...attrs] = parts;
      const eqIdx = nameVal.indexOf('=');
      if (eqIdx <= 0) continue;

      const name = nameVal.substring(0, eqIdx).trim();
      const value = nameVal.substring(eqIdx + 1).trim();

      const item: CookieItem = {
        name,
        value,
        domain: urlObj.hostname,
        path: '/'
      };

      for (const attr of attrs) {
        const [k, v] = attr.split('=').map(s => s.trim());
        const lowerK = k.toLowerCase();
        if (lowerK === 'domain' && v) item.domain = v.replace(/^\./, '');
        if (lowerK === 'path' && v) item.path = v;
        if (lowerK === 'expires' && v) item.expires = new Date(v);
        if (lowerK === 'httponly') item.httpOnly = true;
        if (lowerK === 'secure') item.secure = true;
      }

      this.cookies.set(name, item);
    }
  }

  public getCookieHeaderString(targetUrl: string): string {
    const pairs: string[] = [];
    for (const [name, item] of this.cookies.entries()) {
      if (item.expires && item.expires.getTime() < Date.now()) {
        this.cookies.delete(name);
        continue;
      }
      pairs.push(`${name}=${item.value}`);
    }
    return pairs.join('; ');
  }

  public getCookiesObject(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [name, item] of this.cookies.entries()) {
      obj[name] = item.value;
    }
    return obj;
  }

  public clear() {
    this.cookies.clear();
  }
}

export class HttpSessionClient {
  public cookieJar = new CookieJar();
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

  constructor(userAgent?: string) {
    if (userAgent) this.userAgent = userAgent;
  }

  public async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<HttpResponse> {
    const start = Date.now();
    const timeoutMs = options.timeoutMs || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
        ...options.headers
      };

      const cookieHeader = this.cookieJar.getCookieHeaderString(url);
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }

      if (options.authHeader) {
        headers['Authorization'] = options.authHeader;
      }

      let reqBody: any = undefined;
      if (body) {
        if (typeof body === 'string') {
          reqBody = body;
        } else if (body instanceof URLSearchParams) {
          reqBody = body.toString();
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
          }
        } else if (headers['Content-Type'] && headers['Content-Type'].includes('urlencoded')) {
          reqBody = new URLSearchParams(body).toString();
        } else {
          reqBody = JSON.stringify(body);
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
          }
        }
      }

      const res = await fetch(url, {
        method,
        headers,
        body: reqBody,
        signal: controller.signal,
        redirect: options.followRedirects === false ? 'manual' : 'follow'
      });

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key.toLowerCase()] = val;
      });

      // Save Set-Cookie (support getSetCookie in modern Node/Fetch)
      if (typeof (res.headers as any).getSetCookie === 'function') {
        const rawCookies: string[] = (res.headers as any).getSetCookie();
        for (const c of rawCookies) {
          this.cookieJar.setCookiesFromHeader(c, url);
        }
      } else {
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
          this.cookieJar.setCookiesFromHeader(setCookie, url);
        }
      }

      const text = await res.text();
      let data: any = text;
      let isJson = false;
      const contentType = resHeaders['content-type'] || '';

      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
          isJson = true;
        } catch {
          // not strictly valid JSON
        }
      } else {
        // Try parsing JSON even if content-type is missing/different
        const trimmed = text.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            data = JSON.parse(trimmed);
            isJson = true;
          } catch {
            // treat as text
          }
        }
      }

      const isHtml = contentType.includes('text/html') || text.includes('<html') || text.includes('<!DOCTYPE');
      let $: cheerio.CheerioAPI | undefined = undefined;
      if (isHtml) {
        try {
          $ = cheerio.load(text);
        } catch {
          // failed to load HTML
        }
      }

      return {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        data,
        text,
        url: res.url || url,
        cookies: this.cookieJar.getCookiesObject(),
        isHtml,
        isJson,
        $,
        durationMs: Date.now() - start
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async get(url: string, options?: RequestOptions): Promise<HttpResponse> {
    return this.request('GET', url, undefined, options);
  }

  public async post(url: string, body?: any, options?: RequestOptions): Promise<HttpResponse> {
    return this.request('POST', url, body, options);
  }

  /**
   * Helper to detect bot challenge / CAPTCHA / 2FA in HTML response
   */
  public detectSecurityControls(response: HttpResponse): {
    requiresAction: boolean;
    reason?: string;
  } {
    const textLower = response.text.toLowerCase();

    // 1. Cloudflare / Bot checks
    if (
      response.status === 403 && (
        textLower.includes('cf-turnstile') ||
        textLower.includes('cf-ray') ||
        textLower.includes('cloudflare') ||
        textLower.includes('just a moment...') ||
        textLower.includes('verify you are human')
      )
    ) {
      return {
        requiresAction: true,
        reason: 'Website nguồn kích hoạt bảo vệ chống Bot / Cloudflare Turnstile. Cần xác minh thủ công.'
      };
    }

    // 2. CAPTCHA elements
    if (
      textLower.includes('g-recaptcha') ||
      textLower.includes('h-captcha') ||
      textLower.includes('recaptcha/api.js') ||
      textLower.includes('geetest')
    ) {
      return {
        requiresAction: true,
        reason: 'Website yêu cầu giải mã CAPTCHA để tiếp tục.'
      };
    }

    // 3. 2FA / OTP verification
    if (
      textLower.includes('two-factor authentication') ||
      textLower.includes('mã xác thực 2fa') ||
      textLower.includes('nhập mã otp') ||
      textLower.includes('verify your login')
    ) {
      return {
        requiresAction: true,
        reason: 'Tài khoản nguồn yêu cầu mã xác thực 2FA / OTP điện thoại.'
      };
    }

    return { requiresAction: false };
  }
}
