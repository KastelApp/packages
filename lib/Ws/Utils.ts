import crypto from 'crypto';

// yea yea, utils inside a utils package haha so funny

class Utils {
  static generateHeartbeatInterval(min = 30000, max = 60000): number {
    const generatedBits = crypto.randomBytes(15);

    if (generatedBits[0] === undefined) {
      // if its undefined, we'll just try again (it will probably never be undefined but just in case)
      return this.generateHeartbeatInterval(min, max);
    }

    return min + Math.floor((generatedBits[0] / 255) * (max - min + 1));
  }

  static generateSessionID() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * @description The "hard" error codes are errors that are not recoverable, and will cause the client to disconnect and be unresumeable
   */
  static get HARD_CLOSE_CODES() {
    return {
      UNKNOWN_ERROR: 4000, // Unknown error
      UNKNOWN_OPCODE: 4001, // Unknown opcode
      DECODE_ERROR: 4002, // Failed to decode payload
      NOT_AUTHENTICATED: 4003, // Not authenticated (no IDENTIFY payload sent)
      AUTHENTICATION_FAILED: 4004, // Authentication failed (wrong password or just an error)
      ALREADY_AUTHENTICATED: 4005, // Already authenticated (why are you sending another IDENTIFY payload?)
      INVALID_SEQ: 4007, // Invalid sequence sent when resuming (seq is 5 but the resume payload provided a seq of 4)
      RATE_LIMITED: 4008, // User spammed the gateway (not used yet)
      SESSION_TIMED_OUT: 4009, // session timed out
      INVALID_REQUEST: 4010, // Invalid request (E/O)
      SERVER_SHUTDOWN: 4011, // Server is shutting down
    };
  }

  /**
   * @description Like HARD_ERROR_CODES, but for op codes unrecoverable op codes
   */
  static get HARD_OP_CODES() {
    return {
      ERROR: 15,
    };
  }

  /**
   * @description The "soft" error codes are errors that are recoverable, and will cause the client to disconnect and be resumeable
   */
  static get SOFT_CLOSE_CODES() {
    return {
      UNKNOWN_ERROR: 1000, // Unknown error
      MISSED_HEARTBEAT: 1001, // Missed heartbeat
    };
  }
}

export default Utils;