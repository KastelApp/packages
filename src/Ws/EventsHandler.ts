/* eslint-disable no-unused-vars */ // disabled for interfaces

import User from './User';
import Utils from './Utils';

interface Event {
  name: string;
  op: number;
  execute: (user: User, data: any, users: Map<string, User>) => void;
  authRequired?: boolean;
  allowedAuthTypes: number;
  strictCheck: boolean;
  version: number;
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
      allowedAuthTypes: number;
      strictCheck: boolean;
      version: number;
    }[]
  ) {
    this.events = events;

    for (const event of events) {
      if (typeof event !== 'object') throw new TypeError('Event must be an object');
      if (typeof event.name !== 'string') throw new TypeError('Event name must be a string');
      if (typeof event.execute !== 'function') throw new TypeError('Event execute must be a function');
      if (typeof event.op !== 'number') throw new TypeError('Event op must be a number');
      if (event.version < 0) throw new TypeError('Event version must be a positive number');

      // using Session IDS to prevent duplicate events (Since we now can't use the event name)
      setEvents.set(Utils.generateSessionID(), event);
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

  static getEventName(name: string, version: number): Event | null {
    if (!name) return null;

    for (const event of setEvents.values()) {
      if (event.name === name && event.version == version) return event;
    }

    return null;
  }

  static getEventCode(code: number, version: number): Event | null {
    if (!code) return null;

    for (const event of setEvents.values()) {
      if (event.op === code && event.version == version) return event;
    }

    return null;
  }
}

export default EventsHandler;
