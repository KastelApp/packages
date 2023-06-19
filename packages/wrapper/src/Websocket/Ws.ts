import Ws from 'ws';
import type Client from '../Client/Client.js';
import { DefaultWebsocketSettings } from '../Utils/Constants.js';
import type { WebsocketSettings } from "../types/Misc/ConfigTypes";

export default class Websocket {
    public Compression: boolean;
    
    public Encoding: 'json';
    
    public Url: string;
    
    public Version: string;
    
    private Token: string | null;

    private Gateway: Ws.WebSocket | null = null;
    
    public ConnectionType: 'client' | 'system'; // obv only use client
    
    // After Connection Stuff
    
    private LastHeartbeatAck: number;
    
    private LastHeartbeatSent: number;
    
    private HeartbeatInterval: number;
    
    private Ready: boolean;
    
    private SessionId: string;
    
    private Sequence: number;
    
    public Status: 'ready' | 'connecting' | 'reconnecting' | 'disconnected';
    
    private Client: Client | null; // soon
    
    public constructor(options: WebsocketSettings = DefaultWebsocketSettings, client?: Client) {
        this.Compression = options.Compress;
        
        this.Encoding = options.Encoding;
        
        this.Url = options.Url;
        
        this.Version = options.Version;
        
        this.Token = null;
        
        this.Gateway = null;
        
        this.ConnectionType = 'client';
        
        this.LastHeartbeatAck = -1;
        
        this.LastHeartbeatSent = -1;
        
        this.HeartbeatInterval = -1;
        
        this.Ready = false;
        
        this.SessionId = '';
        
        this.Sequence = -1;
        
        this.Status = 'disconnected';
        
        this.Client = client ?? null;
    }
    
    public setToken(token: string) {
        this.Token = token;
    }
    
    public connect(token?: string) {
        if (token) {
            this.Token = token;
        }
        
        if (!this.Token) {
            throw new Error('[Wrapper] [Websocket] No token provided');
        }
        
        this.Gateway = new Ws.WebSocket(`${this.Url}/${this.ConnectionType}?v=${this.Version}&encoding=${this.Encoding}`);
    }
    
    public disconnect() {}
    
    public setClient(client: Client) {
        this.Client = client;
    }
}
