module.exports = {
  authorizeMethod: "mining.authorize",
  authorize: '{"id":"mining.authorize","method":"mining.authorize","params":["<worker.name>","<worker.pass>"]}\n',
  subscribeMethod: "mining.subscribe",
  subscribe: '{"id": "mining.subscribe", "method": "mining.subscribe", "params": ["<user agent/version>"]}\n',
  setDifficultyMethod: "mining.set_difficulty",
  notifyMethod: "mining.notify",
  submitMethod: "mining.submit",
  submit: '{"params": ["<worker.name>", "<jobID>", "<ExtraNonce2>", "<ntime>", "<nonce>"], "id": "mining.submit", "method": "mining.submit"}\n'
};