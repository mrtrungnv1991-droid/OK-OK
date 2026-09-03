// ==============================================================================
// CYBERPOOL: BROWSER SESSION & PROFILE MANAGER
// ==============================================================================
import path from 'path';
import fs from 'fs';
import { SourceAccount, SourceAccountHealth } from './types';
import { maskSecret } from './encryptionUtils';

export interface BrowserProfileData {
  profileId: string;
  accountId: string;
  cookies: Array<{ name: string; value: string; domain?: string; expires?: number }>;
  localStorage: Record<string, string>;
  userAgent: string;
  viewport: { width: number; height: number };
  lastActiveAt: string;
  sessionValid: boolean;
  requiresMfaOrCaptcha: boolean;
}

const PROFILES_BASE_DIR = path.join(process.cwd(), 'runtime_data', 'browser_profiles');

// Ensure profile dir exists
if (!fs.existsSync(PROFILES_BASE_DIR)) {
  fs.mkdirSync(PROFILES_BASE_DIR, { recursive: true });
}

export class BrowserSessionManager {
  private inMemoryProfiles: Map<string, BrowserProfileData> = new Map();

  /**
   * Get or initialize a dedicated browser profile for a source account
   */
  public getOrCreateProfile(account: SourceAccount): BrowserProfileData {
    const profileDir = path.join(PROFILES_BASE_DIR, `profile_${account.id}`);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    if (this.inMemoryProfiles.has(account.id)) {
      return this.inMemoryProfiles.get(account.id)!;
    }

    const sessionFile = path.join(profileDir, 'session.json');
    if (fs.existsSync(sessionFile)) {
      try {
        const raw = fs.readFileSync(sessionFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.inMemoryProfiles.set(account.id, parsed);
        return parsed;
      } catch {
        // Fallback to fresh profile
      }
    }

    const defaultProfile: BrowserProfileData = {
      profileId: account.browser_profile_id || `prof_${account.id}`,
      accountId: account.id,
      cookies: [
        { name: 'session_id', value: `sess_auto_${account.id}_${Date.now()}`, domain: account.domain }
      ],
      localStorage: {
        'last_login_account': account.username || 'user',
        'theme_mode': 'dark'
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      lastActiveAt: new Date().toISOString(),
      sessionValid: account.status === 'ONLINE',
      requiresMfaOrCaptcha: account.status === 'REAUTH_REQUIRED'
    };

    this.saveProfile(account.id, defaultProfile);
    this.inMemoryProfiles.set(account.id, defaultProfile);
    return defaultProfile;
  }

  /**
   * Persist browser profile without storing plaintext passwords
   */
  public saveProfile(accountId: string, profile: BrowserProfileData): void {
    const profileDir = path.join(PROFILES_BASE_DIR, `profile_${accountId}`);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    const sessionFile = path.join(profileDir, 'session.json');
    fs.writeFileSync(sessionFile, JSON.stringify(profile, null, 2), 'utf8');
    this.inMemoryProfiles.set(accountId, profile);
  }

  /**
   * Check session status & validate health
   */
  public validateSession(account: SourceAccount): {
    isValid: boolean;
    health: SourceAccountHealth;
    reason?: string;
  } {
    const profile = this.getOrCreateProfile(account);

    if (profile.requiresMfaOrCaptcha) {
      return {
        isValid: false,
        health: 'REAUTH_REQUIRED',
        reason: 'CAPTCHA / 2FA Challenge detected on website'
      };
    }

    if (!profile.sessionValid) {
      return {
        isValid: false,
        health: 'SESSION_EXPIRED',
        reason: 'Session cookie expired or invalidated by source website'
      };
    }

    return {
      isValid: true,
      health: 'ONLINE'
    };
  }

  /**
   * Invalidate and trigger re-auth required
   */
  public invalidateSession(accountId: string, reason: string): void {
    const profile = this.inMemoryProfiles.get(accountId);
    if (profile) {
      profile.sessionValid = false;
      this.saveProfile(accountId, profile);
    }
    console.warn(`[BrowserSessionManager] Invalided session for account ${accountId}: ${reason}`);
  }

  /**
   * Refresh and mark session valid
   */
  public refreshSession(accountId: string, newCookies?: Array<{ name: string; value: string }>): void {
    const profile = this.inMemoryProfiles.get(accountId);
    if (profile) {
      profile.sessionValid = true;
      profile.requiresMfaOrCaptcha = false;
      profile.lastActiveAt = new Date().toISOString();
      if (newCookies) {
        profile.cookies = newCookies;
      }
      this.saveProfile(accountId, profile);
    }
  }
}

export const browserSessionManager = new BrowserSessionManager();
