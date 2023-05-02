import { statSync, readdirSync } from 'node:fs';
import NodePath from 'node:path';
import process from 'node:process';
import { RouteError, RoutesNotFound } from '@kastelll/internal';
import type { Application, Response, Request } from 'express';
import type { Methods, Middleware, RouteItem, Run } from '../types/Http';

const Routes: RouteItem[] = [];

const allowedExtensions = ['.js'];

class Route {
	public Dir: string | null;

	public Path: string;

	public Route: string;

	public Method: Methods;

	public Middleware: Middleware[];

	public Run: Run;

	private readonly ErrorToCut: Error | string[];

	public constructor(Path: string, Method: Methods, Middleware: Middleware[], Run: Run) {
		this.Dir = null;

		this.ErrorToCut = new Error('Error to cut');

		if (!this.ErrorToCut.stack) throw new RouteError('Stack not found');

		this.ErrorToCut = this.ErrorToCut.stack.split('at');

		if (this.ErrorToCut) {
			const route = this.ErrorToCut.find((line) => line.includes('routes'));

			if (!route) throw new RoutesNotFound('The Route Directory was not found, is it called routes?');

			const routeArray = route.split('(').pop();

			if (!routeArray) throw new RouteError('Route array was not able to be found');

			let routeArray2 = null;

			if (process.platform === 'win32') {
				const routeArraySplit = routeArray.split(':');

				routeArraySplit.shift();

				const joined = routeArraySplit.join(':').replaceAll('\\', '/');

				routeArray2 = joined.split(':').shift();
			} else {
				routeArray2 = routeArray.split(':').shift();
			}

			if (!routeArray2) throw new RouteError('Route array was not able to be found');

			this.Dir = routeArray2;
		}

		if (!this.Dir) throw new RouteError('Route Directory was not found');

		this.Path = Path;

		this.Route = this.Cutter(this.Dir, this.Path).replaceAll(/\[([^\]]+)]/g, ':$1'); // eslint-disable-line prefer-named-capture-group

		this.Method = Method;

		this.Middleware = Middleware;

		this.Run = Run;

		Routes.push({
			method: this.Method,
			path: this.Path,
			route: this.Route,
			run: this.Run,
			middleware: this.Middleware,
			Route: this,
		});
	}

	public Cutter(FilePath: string, ExportPath: string) {
		if (!FilePath) throw new RouteError('File Path not found (External Error)');
		if (!ExportPath) throw new RouteError('Export Path not found (External Error)');

		const SplitPath = FilePath.split('/routes') || FilePath.split('/Routes');

		if (!SplitPath) throw new RouteError('Split Path not found (Internal Error)');

		if (SplitPath.length === 1) throw new RouteError('Split Path length is 1 (Internal Error)');

		const Popped = SplitPath.pop();

		if (!Popped) throw new RouteError('Popped not found (Internal Error)');

		const Split = Popped.split('/').slice(0, -1).join('/');

		return `${Split}${ExportPath.startsWith('/') ? ExportPath : '/' + ExportPath}`;
	}

	public static SetRoutes(App: Application) {
		if (!App) {
			throw new RouteError('Please provide the Express Server (External Error)');
		}

		for (const Route of Routes) {
			console.log(`[Express] Setting Route: ${Route.method} ${Route.route}`);

			// @ts-expect-error - This is a valid method
			App[Route.method.toLowerCase()](Route.route, ...Route.middleware, async (req: Request, res: Response): void => {
				try {
					// eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
					await Route.run(req, res, App);
					return;
				} catch (error) {
					if (res.headersSent) {
						console.error(error);
					} else {
						try {
							res.status(500).send('Internal Server Error');
							console.error(error);
						} catch (error_) {
							// failed to send the error so we just will log it
							console.error(error_);
						}
					}
				}
			});
		}

		return Routes;
	}

	public static Mover(FiPath: string, Arr: string[]): string[] {
		const dirArray = Arr || [];

		const filePath = FiPath;

		const fileInfo = statSync(filePath);

		if (fileInfo.isDirectory()) {
			const files = readdirSync(filePath);

			for (let index = 0; index < files.length; index++) {
				const fi = statSync(NodePath.join(filePath, files[index as number] as string));

				if (fi.isDirectory()) {
					Route.Mover(NodePath.join(filePath, files[index as number] as string), dirArray);
				} else {
					if (
						!allowedExtensions.includes(NodePath.extname(NodePath.join(filePath, files[index as number] as string)))
					) {
						continue;
					}

					dirArray.push(NodePath.join(filePath, files[index] as string));
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

	public static LoadRoutes(routePath: string) {
		const FiPaths = Route.Mover(routePath, []);

		for (const FiPath of FiPaths) {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			require(FiPath as string);
		}

		return FiPaths;
	}

	public readonly [Symbol.toStringTag] = 'Route';

	public static get Routes() {
		return Routes;
	}
}

export default Route;

export { Route };
