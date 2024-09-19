// stratum+tcp://stratum.antpool.com
const extend = require('lodash/extend');
const submitWork = require('./submitWork');
const WorkObject = require('./workObject');
const net = require('node:net');
const tls = require('node:tls');
const { subscribe } = require('./methods');
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
    const workObject = new WorkObject();
    this.#client = (options.ssl ? tls : net).connect(options.port, options.server, () => {
      this.#client.write(subscribe.replace("<user agent/version>", options.userAgent));
      if (options.onConnect) {
        options.onConnect();
      }
    });
    this.#client.setEncoding('utf8');
    this.#client.on('data', data => {
      data.split('\n').forEach(jsonDataStr => {
        if (trim(jsonDataStr).length) {
          try {
            processData(this.#client, options, JSON.parse(trim(jsonDataStr)), workObject);
          } catch (e) {
            console.error(e.message);
          }
        }
      });
    });
    this.#client.on('error', error => {
      const { autoReconnectOnError, onError } = options;
      if (onError) onError(error);

      this.#client.destroy();

      if (autoReconnectOnError) {
        this.#connect(options);
      }
    });
    this.#client.on('close', () => {
      if (options.onClose) options.onClose();
    });
  }

  #start(options) {

    function validate(options) {
      if (!options.server) {
        throw new Error('[server] required');
      }
      if (!options.port) {
        throw new Error('[port] required');
      }
      if (!options.worker) {
        throw new Error('[worker] required');
      }
      return options;
    }

    this.#connect(validate(extend({}, defaultConfig, options)));
  }

};

module.exports = (options) => new Client(options);
