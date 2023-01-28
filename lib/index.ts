import ws from 'ws';
import Route from './Routes';
import Snowflake from './Snowflake';
import Ws from './Ws';

declare module '@kastelll/packages' {}

declare module 'ws' {
  export interface WebSocket extends ws {
    id: string;
  }
}

export { Snowflake, Route, Ws };
