/* eslint-disable no-unused-vars */ // disabled for interfaces

import User from './User';

interface Event {
  name: string;
  op: number;
  execute: (user: User, data: any, users: Map<string, User>) => void;
  authRequired?: boolean;
}

const setEvents: Map<string, Event> = new Map();

class EventsHandler {
  events: any[];
  constructor(
    ...events: {
      name: string;
      execute: (user: User, data: any, users: Map<string, User>) => void;
      op: number;
      authRequired?: boolean;
    }[]
  ) {
    this.events = events;

    for (const event of events) {
      if (typeof event !== 'object') throw new TypeError('Event must be an object');
      if (typeof event.name !== 'string') throw new TypeError('Event name must be a string');
      if (typeof event.execute !== 'function') throw new TypeError('Event execute must be a function');

      setEvents.set(event.name, event);
    }
  }

  // each event is a class with three methods (name, execute, inject)
  // name is the name of the event (guilds, indentify, etc)
  // execute (or init) is the function that is called when the ws recieves the event
  // it takes the ws, data, and the connectedUsers map

  /**
   * @returns {Event[]}
   */
  static get Events(): Map<string, Event> {
    return setEvents;
  }

  static getEventName(name: string) {
    return setEvents.get(name);
  }

  static getEventCode(code: number): Event | null {
    if (!code) return null;

    for (const event of setEvents.values()) {
      if (event.op === code) return event;
    }

    return null;
  }
}

export default EventsHandler;
