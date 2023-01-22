/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import User from './User';

class Events {
  name: string;
  authRequired: boolean;
  op: number;

  constructor() {
    this.name = '';

    this.authRequired = false;

    this.op = 0;
  }

  execute(user: User, data: any, users?: Map<string, User>) {
    throw new Error('Event.execute() is not implemented');
  }
}

export default Events;
