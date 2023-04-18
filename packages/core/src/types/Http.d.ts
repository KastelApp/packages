import type { Request, Response, Application, NextFunction } from 'express';
import type { Route } from '../HTTP/Route';

export type Methods =
	| 'ALL'
	| 'all'
	| 'DELETE'
	| 'delete'
	| 'GET'
	| 'get'
	| 'HEAD'
	| 'head'
	| 'OPTIONS'
	| 'options'
	| 'PATCH'
	| 'patch'
	| 'POST'
	| 'post'
	| 'PURGE'
	| 'purge'
	| 'PUT'
	| 'put'
	| 'UPGRADE'
	| 'upgrade'
	| 'WS'
	| 'ws';

export type Run = (req: Request, res: Response, app: Application) => void;

export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export interface RouteItem {
	Route: Route;
	method: Methods;
	middleware: Middleware[] | Run[];
	path: string;
	route: string;
	run: Run;
}
