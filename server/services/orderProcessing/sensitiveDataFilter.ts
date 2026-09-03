// ==============================================================================
// CYBERPOOL: SENSITIVE DATA DETECTION & 1-CLICK REDACTION FILTER
// ==============================================================================

export interface RedactionResult {
  containsSensitive: boolean;
  types: string[];
  redactedText: string;
  matchesCount: number;
}

export class SensitiveDataFilter {
  // Regex patterns for sensitive credentials
  private static readonly PATTERNS = [
    {
      type: 'PASSWORD',
      regex: /(?:password|pass|mat\s*khau|mật\s*khẩu|mk)\s*[:=]\s*([^\s,;]+)/gi,
      mask: (match: string, val: string) => match.replace(val, '[REDACTED_PASSWORD]')
    },
    {
      type: 'OTP',
      regex: /(?:otp|mã\s*xác\s*thực|ma\s*xac\s*thuc|verification\s*code|mã\s*otp)\s*[:=]?\s*(\b\d{4,8}\b)/gi,
      mask: (match: string, val: string) => match.replace(val, '[REDACTED_OTP]')
    },
    {
      type: '2FA_BACKUP_CODE',
      regex: /(?:2fa|two[- ]factor|backup\s*code|mã\s*khôi\s*phục)\s*[:=]?\s*([a-zA-Z0-9]{4,8}(?:-[a-zA-Z0-9]{4,8})+|\b\d{6,8}\b)/gi,
      mask: (match: string, val: string) => match.replace(val, '[REDACTED_2FA_CODE]')
    },
    {
      type: 'SESSION_TOKEN',
      regex: /(?:token|session|bearer|cookie|sess_id|jwt)\s*[:=]\s*([a-zA-Z0-9_\-\.]{16,})/gi,
      mask: (match: string, val: string) => match.replace(val, '[REDACTED_SESSION_TOKEN]')
    },
    {
      type: 'EMAIL_PASSWORD_COMBO',
      regex: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*[:|]\s*([^\s,;]+)/g,
      mask: (match: string, email: string, pass: string) => `${email}:[REDACTED_CREDENTIAL]`
    }
  ];

  /**
   * Scans a message for sensitive information and returns masked content
   */
  public static scanAndRedact(text: string): RedactionResult {
    if (!text || typeof text !== 'string') {
      return { containsSensitive: false, types: [], redactedText: text || '', matchesCount: 0 };
    }

    let redacted = text;
    const detectedTypes = new Set<string>();
    let totalMatches = 0;

    for (const p of this.PATTERNS) {
      const matches = text.match(p.regex);
      if (matches && matches.length > 0) {
        detectedTypes.add(p.type);
        totalMatches += matches.length;
        redacted = redacted.replace(p.regex, (substring, ...args) => {
          return p.mask(substring, args[0], args[1]);
        });
      }
    }

    return {
      containsSensitive: detectedTypes.size > 0,
      types: Array.from(detectedTypes),
      redactedText: redacted,
      matchesCount: totalMatches
    };
  }
}
