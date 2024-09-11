// stratum+tcp://stratum.antpool.com
const extend = require('lodash/extend');
const submitWork = require('./submitWork');
const validateConfig = require('./validateConfig');
const WorkObject = require('./workObject');
const net = require('node:net');
const tls = require('node:tls');
const { subscribe } = require('./messageContants');
const trim = require('lodash/trim');
const processData = require('./processData');



const defaultConfig = {
  "autoReconnectOnError": true
};

class Client {

  #client;

  constructor(options) {
    this.#start(options);
  }

  shutdown() {
    this.#client.end();
    this.#client.destroy();
  }

  submit(worker, job_id, extranonce2, ntime, nonce) {
    submitWork(worker, job_id, extranonce2, ntime, nonce, this.#client);
  }

  #connect(options) {
    this.#client = (this.#client ? this.#client : (options.ssl ? tls : net)).connect(options.port, options.server, () => {
      this.#client.write(subscribe.replace("<user agent/version>", options.userAgent));
      if (options.onConnect) {
        options.onConnect();
      }
    });
  }

  #start(options) {
    const updatedOptions = extend({}, defaultConfig, options);

    validateConfig(updatedOptions);

    const workObject = new WorkObject();

    this.#connect(updatedOptions);
    this.#client.setEncoding('utf8');

    this.#client.on('data', data => {
      data.split('\n').forEach(jsonDataStr => {
        if (trim(jsonDataStr).length) {
          try {
            processData(this.#client, updatedOptions, JSON.parse(trim(jsonDataStr)), workObject);
          } catch (e) {
            console.error(e.message);
          }
        }
      });
    });

    this.#client.on('error', error => {
      const { autoReconnectOnError, onError } = updatedOptions;
      if (onError) onError(error);

      if (autoReconnectOnError) {
        // FIXME
        this.#connect(updatedOptions);
      } else {
        this.#client.destroy(); // kill client after server's response
      }
    });

    this.#client.on('close', () => {
      if (updatedOptions.onClose) updatedOptions.onClose();
      /*
        For some reason, corrupted data keeps streaming. This is a hack.
        With this hack, I am ensuring that no more callbacks are called
        after closing the connection (closing from our end)
      */
      extend(updatedOptions, {
        onConnect: null,
        onClose: null,
        onError: null,
        onAuthorize: null,
        onAuthorizeSuccess: null,
        onAuthorizeFail: null,
        onNewDifficulty: null,
        onSubscribe: null,
        onNewMiningWork: null,
        onSubmitWorkSuccess: null,
        onSubmitWorkFail: null,
      });
    });
  }

};

module.exports = (options) => new Client(options);
