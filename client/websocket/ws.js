const WS = require('ws');

module.exports = class WebSocket {
	constructor(client, options = { }) {
		if (!options.ip) throw new Error('No IP defined in WebSocket');
		if (!options.port) throw new Error('No port defined in WebSocket');
		if (!options.password) throw new Error('No password defined in WebSocket');

		this.ws;
		this.client = client;
		this.ip = options.ip;
		this.port = options.port;
		this.password = options.password;
		this.reconnectTimeout = options.reconnectTimeout;
	}

	connect() {
		this.ws = new WS(`ws://${this.ip}:${this.port}/${this.password}`);
		this.ws.onopen = this.onOpen.bind(this);
		this.ws.onerror = this.onError.bind(this);
		this.ws.onclose = this.onClose.bind(this);
		this.ws.onmessage = this.onMessage.bind(this);
	}

	onOpen(e) {
		this.client.emit('connected', e);
	}

	onError(err) {
		this.client.emit('error', err);
	}

	onClose(e) {
		this.client.emit('disconnect', e);

		if (this.reconnectTimeout) {
			setTimeout(() => connect(), this.reconnectTimeout);
		}
	}

	onMessage(e) {
		const data = JSON.parse(e.data);

		let content;

		// Attempt to parse the body as JSON, 
		// and catch if it fails and just set it as a string

		try       { content = JSON.parse(data.Message); } 
		catch (e) { content = data.Message; }

		let payload = {
			Content: content,
			Identifier: data.Identifier,
			Type: data.Type,
			Stacktrace: data.Stacktrace
		}

		this.client.emit('message', payload);
	}

	sendMessage(message, name, identifier) {
		let data = JSON.stringify({
			Identifier: identifier,
			Message: message,
			Name: name
		});

		this.ws.send(data);
	}

	close() {
		if (!this.ws) {
			return;
		}

		this.ws.close();
		this.ws = undefined;
	}
}