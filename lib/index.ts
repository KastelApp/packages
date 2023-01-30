import ws from 'ws';
import Route from './Routes';
import Snowflake from './Snowflake';
import Ws from './Ws';
import HTTPErrors from './Errors';

declare module '@kastelll/packages' {}

declare module 'ws' {
  export interface WebSocket extends ws {
    id: string;
  }
}

export default { Snowflake, Route, Ws, HTTPErrors };

export { Snowflake, Route, Ws, HTTPErrors };