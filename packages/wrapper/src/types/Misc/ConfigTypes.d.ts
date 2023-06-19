export interface WebsocketSettings {
    Compress: boolean;
    // only json is supported for now
    Encoding: 'json';
    Url: string; 
    Version: string;
}
