import Utils from './Utils';

class Errors {
  reason: string;
  op: number;
  constructor(reason: string, op?: number) {
    this.reason = reason;

    this.op = op || Utils.HARD_OP_CODES.ERROR;
  }

  toJSON() {
    return {
      op: this.op,
      d: {
        message: this.reason,
      },
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Errors;
