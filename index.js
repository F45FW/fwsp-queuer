'use strict';

const Promise = require('bluebird');
const redis = require('redis');
const utils = require('fwsp-jsutils');

class Queuer {
  constructor() {
    this.config = null;
    this.db = null;
  }

  /**
  * @name open
  * @summary open redis database
  * @param {object} config - configuration
  * @return {promise} promise - returns a promise
  */
  open(config) {
    return new Promise((resolve, reject) => {
      this.config = Object.assign({
        db: 1
      }, config);

      this.db = redis.createClient(
        this.config.port,
        this.config.url,
        null);
      this.db.select(this.config.db, (err, reply) => {
        (err) ? reject(err) : resolve(this.db);
      });
    });
  }

  /**
  * @name close
  * @summary close Redis db
  */
  close() {
    this.db.quit();
    this.db = null;
  }

  /**
  * @name enqueue
  * @summary Push a job into a job queue
  * @param {string} queueName - name of queue to use
  * @param {object} obj - object which will be queued
  * @return {promise} promise - returns a promise
  */
  enqueue(queueName, obj) {
    return new Promise((resolve, reject) => {
      let js = utils.safeJSONStringify(obj);
      if (!js) {
        reject(new Error('unable to stringify object'));
        return;
      }
      this.db.rpush(`${queueName}:queued`, js, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
  * @name dequeue
  * @summary Removes a job from the job queue and moves it into the in-processing queue
  * @param {string} queueName - name of queue to use
  * @return {promise} promise - returns a promise resolving to the dequeued job.
  */
  dequeue(queueName) {
    return new Promise((resolve, reject) => {
      this.db.rpoplpush(`${queueName}:queued`, `${queueName}:processing`, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(utils.safeJSONParse(data));
        }
      });
    });
  }

  /**
  * @name complete
  * @summary mark an obj as completed, by removing it from the in-processing queue
  * @param {string} queueName - name of queue to use
  * @param {object} obj - obj which will be marked as completed
  * @return {promise} promise - returns a promise resolving to the completed job.
  */
  complete(queueName, obj) {
    return new Promise((resolve, reject) => {
      this.db.lrem(`${queueName}:processing`, -1, utils.safeJSONStringify(obj), (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(utils.safeJSONParse(data));
        }
      });
    });
  }
}

module.exports = Queuer;
