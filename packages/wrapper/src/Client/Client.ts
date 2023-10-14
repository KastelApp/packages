/* eslint-disable no-restricted-globals */
/* eslint-disable unicorn/prefer-node-protocol */
import EventEmitter from 'events';
import Rest from '../Rest/Rest.js';
import { DefaultWebsocketSettings } from '../Utils/Constants.js';
import { Endpoints } from '../Utils/R&E.js';
import StringFormatter from '../Utils/StringFormatter.js';
import Websocket from '../Websocket/Ws.js';
import type { ClientOptions, RegisterAndLogin } from '../types/Client';
import type { LoginOptions, RegisterAccountOptions } from '../types/Client/Options.js';
import type { RegisterResponse } from '../types/Rest/Responses/RegisterAndLoggingIn.js';
import BanStore from './Stores/Guild/BanStore.js';
import GuildMemberStore from './Stores/Guild/GuildMemberStore.js';
import InviteStore from './Stores/Guild/InviteStore.js';
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

	private UnAuthed: boolean; // UnAuthed, you may be questioning what its for, and its simple! We only care about rest stuff when we are unauthed, mainly for the login / register / etc. stuff.

	private readonly Worker: Worker | null;

	public readonly channels: ChannelStore;

	public readonly guilds: GuildStore;

	public readonly roles: RoleStore;

	public readonly users: UserStore;

	public readonly guildMembers: GuildMemberStore;

	public PasswordRegex: RegExp;

	public EmailRegex: RegExp;

	public UsernameRegex: RegExp;

	public invites: InviteStore;

	public bans: BanStore;

	public constructor(options: ClientOptions) {
		super();

		this.Token = options.token ?? null;

		this.Version = options.version ?? null;

		this.ApiUrl = options.apiUrl ?? null;

		this.WsUrl = options.wsUrl ?? null;

		this.UnAuthed = options.unAuthed ?? false;

		this.Worker = options.worker ?? null;

		if (!options.unAuthed && !options.Websocket) {
			this.Websocket = new Websocket(DefaultWebsocketSettings, this)
				.setToken(options.token)
				.setVersion(this.Version.replace('v', ''))
				.setUrl(this.WsUrl)
				.setWorker(this.Worker);
		} else if (!options.unAuthed && options.Websocket) {
			this.Websocket = options.Websocket;
		} else {
			this.Websocket = new Websocket(DefaultWebsocketSettings, this);
		}

		if (!options.Rest && !options.unAuthed) {
			this.Rest = new Rest().setToken(options.token).setVersion(this.Version).setUrl(this.ApiUrl);
		} else if (options.Rest) {
			this.Rest = options.Rest;
		} else {
			this.Rest = new Rest().setVersion(this.Version).setUrl(this.ApiUrl);
		}

		this.channels = new ChannelStore(this);

		this.guilds = new GuildStore(this);

		this.roles = new RoleStore(this);

		this.users = new UserStore(this);

		this.guildMembers = new GuildMemberStore(this);

		this.invites = new InviteStore(this);

		this.bans = new BanStore(this);

		this.PasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()-=_+{};:<>,.?/~]{6,72}$/; // eslint-disable-line unicorn/better-regex

		this.EmailRegex = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;

		this.UsernameRegex =
			/^(?=.*[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD])[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD]{2,30}$/; // eslint-disable-line unicorn/better-regex
	}

	public setToken(token: string): void {
		this.Token = token;

		if (this.Websocket) this.Websocket.setToken(this.Token);
		if (this.Rest) this.Rest.setToken(this.Token);
	}

	public get user(): BaseUser {
		return this.users.getCurrentUser() as BaseUser;
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

	public async registerAccount({
		email,
		password,
		username,
		resetClient,
	}: RegisterAccountOptions): Promise<RegisterAndLogin | null> {
		const TestedEmail = this.EmailRegex.test(email);
		const TestedPassword = this.PasswordRegex.test(password);
		const TestedUsername = this.UsernameRegex.test(username);

		if (!TestedEmail || !TestedPassword || !TestedUsername) {
			return {
				success: false,
				errors: {
					email: !TestedEmail,
					password: !TestedPassword,
					username: !TestedUsername,
				},
			};
		}

		const { statusCode, json } = await this.Rest.post<RegisterResponse>(Endpoints.Register(), {
			body: {
				Email: email,
				Password: password,
				Username: username,
			},
			noApi: true,
		});

		if (json.Code || statusCode !== 200) {
			const EmailError = json.Errors?.Email;
			const PasswordError = json.Errors?.Password;
			const UsernameError = json.Errors?.Username;

			return {
				success: false,
				errors: {
					email: EmailError?.Code === 'InvalidEmail',
					password: PasswordError?.Code === 'InvalidPassword',
					username: UsernameError?.Code === 'InvalidUsername',
					maxUsernames: UsernameError?.Code === 'MaxUsernames',
					unknown: Object.fromEntries(
						Object.entries(json.Errors ?? {}).filter(([key]) => !['Email', 'Password', 'Username'].includes(key)),
					),
				},
			};
		}

		if (json.Token) {
			if (resetClient) {
				this.UnAuthed = false;

				this.setToken(json.Token);

				this.Rest.setToken(json.Token);

				this.Websocket.setToken(json.Token)
					.setVersion(this.Version?.replace('v', '') as string)
					.setUrl(this.WsUrl as string)
					.setWorker(this.Worker);
			}

			return {
				success: true,
				token: json.Token,
				userData: {
					avatar: json.User.Avatar,
					email: json.User.Email,
					id: json.User.Id,
					publicFlags: json.User.PublicFlags,
					tag: json.User.Tag,
					username: json.User.Username,
				},
			};
		}

		return null;
	}

	public async loginAccount({ email, password, resetClient }: LoginOptions): Promise<RegisterAndLogin | null> {
		const { statusCode, json } = await this.Rest.post<RegisterResponse>(Endpoints.Login(), {
			body: {
				Email: email,
				Password: password,
			},
			noApi: true,
		});

		if (json.Code || statusCode !== 200) {
			const EmailError = json.Errors?.Email;
			const PasswordError = json.Errors?.Password;

			return {
				success: false,
				errors: {
					email: EmailError?.Code === 'InvalidEmail',
					password: PasswordError?.Code === 'InvalidPassword',
					unknown: Object.fromEntries(
						Object.entries(json.Errors ?? {}).filter(([key]) => !['Email', 'Password'].includes(key)),
					),
				},
			};
		}

		if (json.Token) {
			if (resetClient) {
				this.UnAuthed = false;

				this.setToken(json.Token);

				this.Rest.setToken(json.Token);

				this.Websocket.setToken(json.Token)
					.setVersion(this.Version?.replace('v', '') as string)
					.setUrl(this.WsUrl as string)
					.setWorker(this.Worker);
			}

			return {
				success: true,
				token: json.Token,
			};
		}

		return null;
	}

	public async logout(): Promise<boolean> {
		const { statusCode } = await this.Rest.delete(Endpoints.Logout(), {
			noApi: true,
		});

		return statusCode === 204;
	}
}

export default Client;

export { Client };
