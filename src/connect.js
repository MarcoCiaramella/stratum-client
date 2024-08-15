const { subscribe } = require('./messageContants');

module.exports = (client, { userAgent, port, server, onConnect }) => {
  client.connect(port, server, () => {
    client.write(subscribe.replace("<user agent/version>", userAgent));
    if (onConnect) {
      onConnect();
    }
  });
};
