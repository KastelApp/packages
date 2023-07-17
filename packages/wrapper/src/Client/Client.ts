/* eslint-disable no-restricted-globals */
/* eslint-disable unicorn/prefer-node-protocol */
import EventEmitter from 'events';
import Rest from '../Rest/Rest.js';
import { DefaultWebsocketSettings } from '../Utils/Constants.js';
import StringFormatter from '../Utils/StringFormatter.js';
import Websocket from '../Websocket/Ws.js';
import type { ClientOptions } from '../types/Client';
// import type { BasedUser } from '../types/Client/Structures/Users/index.js';
import { ChannelStore, GuildStore, RoleStore, UserStore } from './Stores/index.js';
import BaseUser from './Structures/Users/BaseUser.js';

interface Client {
	emit(event: 'ready' | 'unready'): boolean;
	on(event: 'ready' | 'unready', listener: () => void): this;
}

class Client extends EventEmitter {
	public readonly Rest: Rest | null;

	private readonly Websocket: Websocket | null;

	private Token: string | null;

	private readonly Version: string | null;

	private readonly ApiUrl: string | null;

	private readonly WsUrl: string | null;

	private readonly UnAuthed: boolean; // UnAuthed, you may be questioning what its for, and its simple! We only care about rest stuff when we are unauthed, mainly for the login / register / etc. stuff.

	private readonly Worker: Worker | null;

	public readonly channels: ChannelStore;

	public readonly guilds: GuildStore;

	public readonly roles: RoleStore<string, unknown>;

	public readonly users: UserStore;

	public constructor(options: ClientOptions) {
		super();
		this.Rest = options.Rest ?? null;

		this.Websocket = options.Websocket ?? null;

		this.Token = options.token ?? null;

		this.Version = options.version ?? null;

		this.ApiUrl = options.apiUrl ?? null;

		this.WsUrl = options.wsUrl ?? null;

		this.UnAuthed = options.unAuthed ?? false;

		this.Worker = options.worker ?? null;

		if (this.Websocket?.Status === 'Ready') {
			console.warn(
				`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.cyan(
					'[Client]',
				)} Websocket is already ready, we will be reconnecting...`,
			);
		}

		if (!this.UnAuthed && !this.Websocket) {
			this.Websocket = new Websocket(DefaultWebsocketSettings, this)
				.setToken(this.Token)
				.setVersion(this.Version.replace('v', ''))
				.setUrl(this.WsUrl)
				.setWorker(this.Worker);
		}

		if (!this.Rest) {
			this.Rest = new Rest().setToken(this.Token).setVersion(this.Version).setUrl(this.ApiUrl);
		}

		this.channels = new ChannelStore(this);

		this.guilds = new GuildStore(this);

		this.roles = new RoleStore();

		this.users = new UserStore(this);
	}

	public setToken(token: string): void {
		this.Token = token;

		if (this.Websocket) this.Websocket.setToken(this.Token);
		if (this.Rest) this.Rest.setToken(this.Token);
	}

	public connect(token?: string): void {
		if (token) this.setToken(token);

		if (this.UnAuthed) return;

		if (this.Websocket) this.Websocket.connect();

		if (!this.Websocket) throw new Error('[Wrapper] [Client] Websocket is not defined, did you forget to set it?');

		this.Websocket.on('authed', (data) => {
			this.users.set(data.User.Id, new BaseUser(this, data.User, true));

			this.emit('ready');
		});

		this.Websocket.on('unauthed', () => {
			this.emit('unready');
		});
	}

	public disconnect(): void {
		console.log('disconnecting');
	}
}

export default Client;

export { Client };
