const Promise  = require('./promise');

const resolved = (value) => {
  return new Promise((resolve, reject) => {
    resolve(value);
  });
};
const rejected = (reason) => {
  return new Promise((resolve, reject) => {
    reject(reason);
  });
};
const deferred = () => {
  let promise, resolve, reject;
  promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
};

module.exports = {
  resolved,
  rejected,
  deferred
};