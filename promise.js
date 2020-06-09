/**
 * Promise
 */
const isFunction = (v) => (typeof v === 'function');
const isObject = (v) => (Object.prototype.toString.call(v) === '[object Object]');
const isThenable = (v) => ((isFunction(v) || isObject(v)) && ('then' in v));
const isPromise = (v) => (v instanceof Promise);
const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';
const toAsync = (fn) => (...args) => {
  setTimeout(() => {
    fn(...args);
  });
};

function Promise(executor) {
  this.state = PENDING;
  this.value = null;
  this.reason = null;
  this.onFulfilledCallbacks = [];
  this.onRejectedCallbacks = [];
  let isResolved = false;

  const resolve = (value) => {
    if (isResolved) return;
    isResolved = true;

    if (this.state === PENDING) {
      resolvePromise(this, value, (v) => {
        this.state = FULFILLED;
        this.value = v;
        this.onFulfilledCallbacks.forEach(fn => fn());
      }, (r) => {
        this.state = REJECTED;
        this.reason = r;
        this.onRejectedCallbacks.forEach(fn => fn());
      });
    }
  };
  const reject = (reason) => {
    if (isResolved) return;
    isResolved = true;

    if (this.state === PENDING) {
      this.state = REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach(fn => fn());
    }
  };

  try {
    executor(resolve, reject);
  } catch(err) {
    reject(err);
  }
}

function resolvePromise (promise, value, resolve, reject) {
  if (value === promise) {
    reject(new TypeError('promise and value refer to the same object'));
  } else if (isPromise(value)) {
    value.then((value2) => {
      resolvePromise(promise, value2, resolve, reject);
    }, reject);
  } else if (isThenable(value)) {
    try {
      let then = value.then;
      if (isFunction(then)) {
        new Promise(then.bind(value)).then((value2) => {
          resolvePromise(promise, value2, resolve, reject);
        }, reject);
      } else {
        resolve(value);
      }
    } catch(err) {
      reject(err);
    }
  } else {
    resolve(value);
  }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
  onFulfilled = isFunction(onFulfilled) ? onFulfilled : (val => val);
  onRejected = isFunction(onRejected) ? onRejected : (reason => { throw reason; });
  return new Promise((resolve, reject) => {
    switch (this.state) {
      case FULFILLED:
        toAsync(() => {
          try {
            let value = onFulfilled(this.value);
            resolve(value);
          } catch (reason) {
            reject(reason);
          }
        })();
        break;
      case REJECTED:
        toAsync(() => {
          try {
            let value = onRejected(this.reason);
            resolve(value);
          } catch (reason) {
            reject(reason);
          }
        })();
        break;
      case PENDING:
        this.onFulfilledCallbacks.push(toAsync(() => {
          try {
            let value = onFulfilled(this.value);
            resolve(value);
          } catch (reason) {
            reject(reason);
          }
        }));
        this.onRejectedCallbacks.push(toAsync(() => {
          try {
            let value = onRejected(this.reason);
            resolve(value);
          } catch (reason) {
            reject(reason);
          }
        }));
        break;
    }
  });
};

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.finally = function (fn) {
  return this.then((value) => {
    isFunction(fn) && fn();
    return value;
  }, (reason) => {
    isFunction(fn) && fn();
    throw reason;
  });
};

Promise.resolve = function (value) {
  return new Promise((resolve) => {
    resolve(value);
  });
};

Promise.reject = function (reason) {
  return new Promise((resolve, reject) => {
    reject(reason);
  });
};

Promise.all = function (promises) {
  if (!Array.isArray(promises)) throw new TypeError('expect promises to be an array');

  return new Promise((resolve, reject) => {
    if (!promises.length) {
      resolve([]);
    } else {
      let result = [];
      let resolvedCount = 0;
      promises.forEach((p, i) => {
        p.then((value) => {
          result[i] = value;
          resolvedCount++;

          if (resolvedCount === promises.length) {
            resolve(result);
          }
        }, (reason) => {
          reject(reason);
        });
      });
    }
  });
};

Promise.race = function (promises) {
  if (!Array.isArray(promises)) throw new TypeError('expect promises to be an array');

  return new Promise((resolve, reject) => {
    promises.forEach((p) => {
      p.then((value) => {
        resolve(value);
      }, (reason) => {
        reject(reason);
      });
    });
  });
};

module.exports = Promise;