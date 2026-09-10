import fs from 'fs';
import path from 'path';
import { GameItem } from '../../src/types';
import { INITIAL_GAMES } from '../../src/data/mockTopupGames';

const STORAGE_DIR = path.join(process.cwd(), 'server', 'data');
const GAMES_FILE = path.join(STORAGE_DIR, 'games_catalog.json');

export class GameStorageService {
  private static ensureDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  public static loadGames(): GameItem[] {
    try {
      this.ensureDir();
      if (fs.existsSync(GAMES_FILE)) {
        const raw = fs.readFileSync(GAMES_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[GameStorageService] Failed to read games_catalog.json, using defaults:', err);
    }

    // Seed default games if file doesn't exist or is invalid
    const defaultGames = JSON.parse(JSON.stringify(INITIAL_GAMES));
    this.saveGames(defaultGames);
    return defaultGames;
  }

  public static saveGames(games: GameItem[]): void {
    try {
      this.ensureDir();
      const tempPath = `${GAMES_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(games, null, 2), 'utf-8');
      fs.renameSync(tempPath, GAMES_FILE);
    } catch (err) {
      console.error('[GameStorageService] Error saving games_catalog.json:', err);
    }
  }

  public static resetToDefaults(): GameItem[] {
    const defaultGames = JSON.parse(JSON.stringify(INITIAL_GAMES));
    this.saveGames(defaultGames);
    return defaultGames;
  }
}
