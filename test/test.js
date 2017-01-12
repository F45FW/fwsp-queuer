const jobQueueName = 'workstuff';
const Queuer = require('../index'); // or require('fwsp-queuer') in your code.

const config = {
  url: 'localhost',
  port: 6379,
  db: 3
};

let queuer = new Queuer();
queuer.open(config)
  .then(() => {
    let itemToQueue = {
      stuffToDo: [1,2,3,4,5]
    };
    console.log(`Enqueuing: ${JSON.stringify(itemToQueue, null, 2)}`);
    return queuer.enqueue(jobQueueName, itemToQueue);
  })
  .then(()=>{
    return queuer.dequeue(jobQueueName);
  })
  .then((obj)=>{
    console.log(`Dequeuing: ${JSON.stringify(obj, null, 2)}`);
    return obj;
  })
  .then((obj) => {
    console.log(`Flag as complete: ${JSON.stringify(obj, null, 2)}`);
    return queuer.complete(jobQueueName, obj);
  })
  .then(() => {
    console.log('Closing usage of Redis');
    queuer.close();
  })
  .catch((err) => console.log(err));
