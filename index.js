const debug = require('debug')('livery');
const { Gaze } = require('gaze');
const { Server } = require('tiny-lr');

function debounce(fn, ms, timer) {
	return (...args) => {
		timer = clearTimeout(timer);
		timer = setTimeout(fn, ms, ...args);
	};
}

function normalizeGlob(glob) {
	glob = glob && glob.length ? glob : '**/*';

	return [].concat(glob, '!**/node_modules/**');
}

function normalizeOptions(options) {
	return Object.assign(
		{
			delay: 100,
			port: 35729,
		},
		options,
		{
			serverOptions: Object.assign(
				{
					liveCSS: false,
					liveImg: false,
				},
				options.serverOptions
			),
			watcherOptions: Object.assign({}, options.watcherOptions),
		}
	);
}

function livery(glob, options) {
	glob = normalizeGlob(glob);
	options = normalizeOptions(options);

	const { delay, port, serverOptions, watcherOptions } = options;
	const server = new Server(serverOptions);
	const watcher = new Gaze(glob, watcherOptions);

	function reload() {
		Object.keys(server.clients).forEach((id) =>
			server.clients[id].reload(['*'])
		);
	}

	server.listen(port, () => {
		watcher.on('all', debounce(reload, delay));
	});

	watcher.on('error', (error) => {
		if (process.env.DEBUG) {
			debug(error);
		}
	});

	return {
		server,
		watcher,
	};
}

module.exports = livery;
