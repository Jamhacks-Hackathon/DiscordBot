import { Discord } from './index';
import { mongo } from './database';
import path from 'path';
import fs from 'fs';

class Bot {
  public CLIENT: Discord.Client;
  private _TOKEN: string;
  public COMMAND_MAP = new Map();
  constructor(TOKEN: string) {
    this.CLIENT = new Discord.Client({
      intents: [Discord.GatewayIntentBits.Guilds]
    });
    this._TOKEN = TOKEN;
  }
  /**
   * Creates a connection with mongo
   */
  public async connectDB(): Promise<void> {
    mongo(); // Connecting to database
  }
  /**
   *
   */
  public async registerCommands(): Promise<void> {
    const COMMANDS_PATH = path.join(__dirname, './commands');
    const COMMAND_FILES = fs
      .readdirSync(COMMANDS_PATH)
      .filter((file) => file.endsWith('.ts'));
    for (const FILE of COMMAND_FILES) {
      const FILE_PATH = path.join(COMMANDS_PATH, FILE);
      const COMMAND = await import(FILE_PATH);
      if ('data' in COMMAND || 'execute' in COMMAND) {
        this.COMMAND_MAP.set(COMMAND.data.name, COMMAND);
        console.log(`${COMMAND} registered in ${COMMANDS_PATH}`);
      } else {
        console.log(
          `[WARNING] The command at ${FILE_PATH} is missing a required "data" or "execute" property.`
        );
      }
    }
  }

  public async registerEvents(): Promise<void> {
    const EVENTS_PATH = path.join(__dirname, 'events');
    const EVENTS_FILE = fs
      .readdirSync(EVENTS_PATH)
      .filter((file) => file.endsWith('.ts'));

    for (const FILE of EVENTS_FILE) {
      const FILE_PATH = path.join(EVENTS_PATH, FILE);
      const EVENT = await import(FILE_PATH);
      if (EVENT.once) {
        this.CLIENT.once(EVENT.name, (...args) => EVENT.execute(...args));
      } else {
        this.CLIENT.on(EVENT.name, (...args) => EVENT.execute(...args));
      }
    }
  }

  /**
   * Connects to the Discord Client
   */
  public connectClient(): void {
    this.CLIENT.login(this._TOKEN);
  }
}

export default Bot;
