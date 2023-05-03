import { EventEmitter } from 'node:events';
import process from 'node:process';
import { setInterval } from 'node:timers';
import { CannotUseCommand, DeprecatedError } from '@kastelll/internal';
import { Redis } from 'ioredis';

interface CacheManager {
	emit(event: 'Error', err: Error | unknown): boolean;
	emit(event: 'MissedPing', Date: Date, Error?: Error | unknown): boolean;
	emit(event: 'Connected', Redis: Redis): boolean;
	on(event: 'Error', listener: (err: Error | unknown) => void): this;
	on(event: 'MissedPing', listener: (Date: Date, Error?: Error | unknown) => void): this;
	on(event: 'Connected', listener: (Redis: Redis) => void): this;
}

class CacheManager extends EventEmitter {
	private readonly Host: string;

	private readonly Port: number;

	private readonly Username: string;

	private readonly Password: string;

	private readonly DB: number;

	private RedisClient: Redis | null = null;

	private PingInterval: NodeJS.Timeout | null = null;

	private LastPing: Date | null = null;

	private readonly PingIntervalNumber: number;

	private readonly AllowForDangerousCommands: boolean;

	public constructor(
		Host:
			| string
			| {
					AllowForDangerousCommands?: boolean; // if its false it will not allow for flushdb and deleting keys with a *
					DB: number;
					Host: string;
					Password: string;
					Port: number;
					Username: string;
			  },
		Port?: number,
		Username?: string,
		Password?: string,
		DB?: number,
		AllowForDangerousCommands?: boolean,
	) {
		super();

		if (typeof Host === 'string') {
			if (typeof Port !== 'number') throw new Error('Port must be a number');
			if (typeof Username !== 'string') throw new Error('Username must be a string');
			if (typeof Password !== 'string') throw new Error('Password must be a string');
			if (typeof DB !== 'number') throw new Error('DB must be a number');

			this.Host = Host;
			this.Port = Port;
			this.Username = Username;
			this.Password = Password;
			this.DB = DB;
			this.AllowForDangerousCommands = AllowForDangerousCommands ?? false;
		} else {
			this.Host = Host.Host;
			this.Port = Host.Port;
			this.Username = Host.Username;
			this.Password = Host.Password;
			this.DB = Host.DB;
			this.AllowForDangerousCommands = Host.AllowForDangerousCommands ?? false;
		}

		this.RedisClient = null;

		this.PingInterval = null;

		this.LastPing = null;

		// every 5 seconds we ping the redis server
		this.PingIntervalNumber = 1_000 * 5;
	}

	public async connect(): Promise<void> {
		if (this.RedisClient) return; // Already connected

		this.RedisClient = new Redis({
			host: this.Host,
			port: this.Port,
			username: this.Username,
			password: this.Password,
			db: this.DB,
		});

		this.RedisClient.on('error', (err) => this.emit('Error', err));

		this.RedisClient.on('connect', () => {
			this.emit('Connected', this.RedisClient as Redis);

			if (this.PingInterval) return; // Should never happen tbh

			this.PingInterval = setInterval(async () => {
				// now if its been 15-30 seconds since the last ping, we emit a missed ping event
				if (this.LastPing && Date.now() - this.LastPing.getTime() > this.PingIntervalNumber * 2) {
					this.emit('MissedPing', this.LastPing);
				} else {
					// alright so now we *try* to ping it, if we catch an error then we emit missed ping but with the error we caught
					try {
						await this.RedisClient?.ping();

						this.LastPing = new Date();
					} catch (error) {
						this.emit('MissedPing', this.LastPing ?? new Date(), error);
					}
				}
			}, this.PingIntervalNumber);
		});
	}

	public async disconnect(Reconnect?: boolean): Promise<void> {
		if (!this.RedisClient) return; // Already disconnected

		this.RedisClient.disconnect(Reconnect ?? false);

		if (!Reconnect) this.RedisClient = null;
	}

	public async get<T>(Key: string): Promise<T | null> {
		if (!this.RedisClient) throw new Error('Not connected to Redis');

		const Value = await this.RedisClient.get(Key);

		if (!Value) return null;

		try {
			return JSON.parse(Value) as T;
		} catch (error) {
			this.emit('Error', error); // emit the error incase the user wants to do something with it

			return Value as unknown as T; // Just return the value as is
		}
	}

	public async set<T>(Key: string, Value: T): Promise<void> {
		if (!this.RedisClient) throw new Error('Not connected to Redis');

		await this.RedisClient.set(Key, JSON.stringify(Value));
	}

	public async delete(Key: string): Promise<void> {
		if (!this.RedisClient) throw new Error('Not connected to Redis');

		if (!this.AllowForDangerousCommands && Key.includes('*'))
			throw new CannotUseCommand('Not allowed to use this command');

		await this.RedisClient.del(Key);
	}

	// this is just for backwards compatibility
	public async del(Key: string): Promise<void> {
		if (!process.argv.includes('--allow-deprecated-functions')) {
			DeprecatedError.warning(
				"You are using a deprecated function, please use delete instead of del, if you would like to ignore this warning use the '--allow-deprecated-functions' flag",
			);
		}

		await this.delete(Key);
	}

	public async exists(Key: string): Promise<boolean> {
		if (!this.RedisClient) throw new Error('Not connected to Redis');

		return (await this.RedisClient.exists(Key)) === 1;
	}

	public async keys(Pattern: string): Promise<string[]> {
		if (!this.RedisClient) throw new Error('Not connected to Redis');

		return this.RedisClient.keys(Pattern);
	}

	public async flush(key?: string): Promise<void> {
		if (!this.RedisClient) throw new Error('Not connected to Redis');
		if (!this.AllowForDangerousCommands) throw new CannotUseCommand('Not allowed to use this command');

		if (!key || typeof key !== 'string') {
			await this.RedisClient.flushall();

			return;
		}

		// so we ofc don't got key, so we want to append :* to the end of the key ONLY if it doesn't already have it then we want to flush that key
		if (!key.endsWith(':*')) await this.RedisClient.del(`${key}:*`);

		await this.RedisClient.del(key);
	}
}

export default CacheManager;

export { CacheManager };
