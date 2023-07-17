import type { Guild, GuildMember } from '../../All';

export type BasedGuild<HasOwner extends boolean = true> = Guild & {
	Owner: HasOwner extends true ? GuildMember : null;
};
