/* eslint-disable no-restricted-globals */
/* eslint-disable unicorn/prefer-node-protocol */
import EventEmitter from 'events';
import Rest from '../Rest/Rest.js';
import { DefaultWebsocketSettings } from '../Utils/Constants.js';
import StringFormatter from '../Utils/StringFormatter.js';
import Websocket from '../Websocket/Ws.js';
import type { ClientOptions } from '../types/Client';
import GuildMemberStore from './Stores/Guild/GuildMemberStore.js';
import { ChannelStore, GuildStore, RoleStore, UserStore } from './Stores/index.js';
import BaseGuild from './Structures/Guilds/BaseGuild.js';
import BaseUser from './Structures/Users/BaseUser.js';

interface Client {
	emit(event: 'ready' | 'unAuthed' | 'unReady'): boolean;
	on(event: 'ready' | 'unAuthed' | 'unReady', listener: () => void): this;
}

class Client extends EventEmitter {
	public readonly Rest: Rest;

	private readonly Websocket: Websocket;

	private Token: string | null;

	private readonly Version: string | null;

	private readonly ApiUrl: string | null;

	private readonly WsUrl: string | null;

	private readonly UnAuthed: boolean; // UnAuthed, you may be questioning what its for, and its simple! We only care about rest stuff when we are unauthed, mainly for the login / register / etc. stuff.

	private readonly Worker: Worker | null;

	public readonly channels: ChannelStore;

	public readonly guilds: GuildStore;

	public readonly roles: RoleStore;

	public readonly users: UserStore;

	public readonly guildMembers: GuildMemberStore;

	public constructor(options: ClientOptions) {
		super();

		this.Token = options.token ?? null;

		this.Version = options.version ?? null;

		this.ApiUrl = options.apiUrl ?? null;

		this.WsUrl = options.wsUrl ?? null;

		this.UnAuthed = options.unAuthed ?? false;

		this.Worker = options.worker ?? null;

		if (!this.UnAuthed && !options.Websocket) {
			this.Websocket = new Websocket(DefaultWebsocketSettings, this)
				.setToken(this.Token)
				.setVersion(this.Version.replace('v', ''))
				.setUrl(this.WsUrl)
				.setWorker(this.Worker);
		} else if (!this.UnAuthed && options.Websocket) {
			this.Websocket = options.Websocket;
		} else {
			this.Websocket = new Websocket(DefaultWebsocketSettings, this);
		}

		if (!options.Rest) {
			this.Rest = new Rest().setToken(this.Token).setVersion(this.Version).setUrl(this.ApiUrl);
		} else if (options.Rest) {
			this.Rest = options.Rest;
		} else {
			this.Rest = new Rest();
		}

		this.channels = new ChannelStore(this);

		this.guilds = new GuildStore(this);

		this.roles = new RoleStore(this);

		this.users = new UserStore(this);

		this.guildMembers = new GuildMemberStore(this);
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

			for (const guild of data.Guilds) {
				console.log(
					`${StringFormatter.purple('[Wrapper]')} ${StringFormatter.orange('[Client')} Adding guild ${guild.Name} (${
						guild.Id
					})`,
					guild,
				);

				this.guilds.set(guild.Id, new BaseGuild(this, guild));
			}

			this.emit('ready');
		});

		this.Websocket.on('unAuthed', () => {
			this.emit('unAuthed');
		});

		this.Websocket.on('closed', () => {
			this.emit('unReady');
		});
	}

	public disconnect(): void {
		console.log('disconnecting');
	}
}

export default Client;

export { Client };
