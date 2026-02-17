import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Default data directory: ~/.local/share/demeter2/
 */
export const DEFAULT_DATA_DIR = join(homedir(), '.local', 'share', 'demeter2')

/**
 * Default database path: ~/.local/share/demeter2/demeter2.db
 */
export const DEFAULT_DB_PATH = join(DEFAULT_DATA_DIR, 'demeter2.db')
