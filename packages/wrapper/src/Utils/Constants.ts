import type { WebsocketSettings } from "../types/Misc/ConfigTypes";

export const DefaultWebsocketSettings: WebsocketSettings = {
  Version: 'v1',
  Url: 'wss://gateway.kastelapp.com',
  Encoding: 'json',
  Compress: true  
};
