/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import type User from './User';
import Utils from './Utils';

class Events {
  name: string;
  authRequired: boolean;
  op: number;
  allowedAuthTypes: number;
  strictCheck: boolean;
  version: number;

  constructor() {
    this.name = '';

    this.authRequired = false;

    this.op = 0;

    this.allowedAuthTypes = Utils.AUTH_CODES.BOT | Utils.AUTH_CODES.USER;

    // strictCheck is for if it checks allowedTypes or not
    // mainly useful for like a identify event
    this.strictCheck = true;

    this.version = -1;
  }

  execute(user: User, data: any, users?: Map<string, User>) {
    throw new Error('Event.execute() is not implemented');
  }
}

export default Events;
