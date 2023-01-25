/* eslint-disable no-unused-vars */
import { Request, Response, Application as Server, NextFunction } from 'express';

type Methods =
  | 'ws'
  | 'WS'
  | 'upgrade'
  | 'UPGRADE'
  | 'all'
  | 'ALL'
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE';

type Run = (req: Request, res: Response, app: Server) => void;

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type RouteItem = {
  path: string;
  route: string;
  method: Methods;
  run: Run;
  middleware: Run[] | Middleware[];
  Route: Route;
};

const routes: RouteItem[] = [];

import { statSync, readdirSync } from 'node:fs';
import NodePath from 'node:path';

const allowedExtensions = ['.js'];

export default class Route {
  dir: string | null;
  path: string;
  route: string;
  method: Methods;
  middleware: Middleware[];
  run: Run;
  private _error_to_cut: Error | string[];
  constructor(path: string, method: Methods, middleware: Middleware[], run: Run) {
    this.dir = null;

    this._error_to_cut = new Error();

    if (!this._error_to_cut.stack) throw new Error('Stack not found'); // this is funny idk why

    this._error_to_cut = this._error_to_cut.stack.split('at');

    if (this._error_to_cut) {
      const route = this._error_to_cut.find((line) => line.includes('routes'));

      if (!route) throw new Error('Route not found (Internal Error)');

      const routeArray = route.split('(').pop();

      if (!routeArray) throw new Error('Route Array not found (Internal Error)');

      let routeArray2 = null;

      if (process.platform === 'win32') {
        const routeArraySplit = routeArray.split(':');

        routeArraySplit.shift();

        const joined = routeArraySplit.join(':').replace(/\\/g, '/');

        routeArray2 = joined.split(':').shift();
      } else {
        routeArray2 = routeArray.split(':').shift();
      }

      if (!routeArray2) throw new Error('Route Array 2 not found');

      this.dir = routeArray2;
    }

    if (!this.dir) throw new Error('Dir not found (Internal Error)');

    this.path = path;

    this.route = this.cutter(this.dir, this.path).replace(/\[([^\]]+)\]/g, ':$1');

    this.method = method;

    this.middleware = middleware;

    this.run = run;

    routes.push({
      method: this.method,
      path: this.path,
      route: this.route,
      run: this.run,
      middleware: this.middleware,
      Route: this,
    });
  }

  cutter(filePath: string, exportPath: string) {
    if (!filePath) throw new Error('File Path not found (External Error)');
    if (!exportPath) throw new Error('Export Path not found (External Error)');

    const splitPath = filePath.split('/routes');

    if (!splitPath) throw new Error('Split Path not found (Internal Error)');

    if (splitPath.length === 1) throw new Error('Split Path length is 1 (Internal Error)');

    const popped = splitPath.pop();

    if (!popped) throw new Error('Popped not found (Internal Error)');

    const split = popped.split('/').slice(0, -1).join('/');

    return `${split}${exportPath.startsWith('/') ? exportPath : '/' + exportPath}`;
  }

  static setRoutes(app: Server) {
    if (!app) {
      throw new Error('Please provide the Express Server (External Error)');
    }

    for (const route of routes) {
      console.log(`[Express] Setting Route: ${route.method} ${route.route}`);

      // @ts-expect-error - This is a valid method for Express
      app[route.method.toLowerCase()](route.route, ...route.middleware, (req: Request, res: Response) => {
        route.run(req, res, app);
      });
    }

    return routes;
  }

  /**
   * Goes through each DIR and adds them to the Array.
   * @param {String} fipath
   * @param {string[]} arr
   * @returns {string[]}
   */
  static throughAndThrough(fipath: string, arr: string[]): string[] {
    const dirArray = arr || [];

    const filePath = fipath;

    const fileInfo = statSync(filePath);

    if (fileInfo.isDirectory()) {
      const files = readdirSync(filePath);

      for (let i = 0; i < files.length; i++) {
        const fi = statSync(NodePath.join(filePath, files[i as number] as string));

        if (fi.isDirectory()) {
          Route.throughAndThrough(NodePath.join(filePath, files[i as number] as string), dirArray);
        } else {
          if (!allowedExtensions.includes(NodePath.extname(NodePath.join(filePath, files[i as number] as string)))) {
            continue;
          }

          dirArray.push(NodePath.join(filePath, files[i] as string));
        }
      }
    } else {
      if (!allowedExtensions.includes(NodePath.extname(filePath))) {
        return dirArray;
      }

      dirArray.push(filePath);
    }

    return dirArray;
  }

  static loadRoutes(routePath: string) {
    const fipaths = Route.throughAndThrough(routePath, []);

    for (let i = 0; i < fipaths.length; i++) {
      require(fipaths[i] as string);
    }

    return fipaths;
  }

  get [Symbol.toStringTag]() {
    return 'Route';
  }

  static get routes() {
    return routes;
  }
}
