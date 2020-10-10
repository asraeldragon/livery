import http from 'http';
import chokidar from 'chokidar';
import ip from 'ip';
import send from 'send';
import tiny from 'tiny-lr';

export default function livery(options) {
	const address = ip.address();
	const cwd = process.cwd();
	const { glob = '**/*.*', port = 3000, lr = 35729 } = options;

	const httpServer = http.createServer((req, res) => {
		console.log(req.method, req.url);
		send(req, req.url, { root: cwd }).pipe(res);
	});

	httpServer.on('error', console.error);
	httpServer.listen(port, () => {
		console.log(`http://${address}:${port}`);
	});

	const tinyServer = new tiny.Server({
		liveCSS: false,
		liveImg: false,
	});

	tinyServer.on('error', console.error);
	tinyServer.listen(lr, () => {
		console.log(`ws://${address}:${lr}`);
	});

	const watchServer = chokidar.watch(glob, {
		ignored: '**/node_modules/**',
		ignoreInitial: true,
		persistent: true,
	});

	watchServer.on('error', console.error);
	watchServer.on('all', () => {
		console.log('RELOAD');
		Object.keys(tinyServer.clients).forEach((id) =>
			tinyServer.clients[id].reload(['*'])
		);
	});
}
