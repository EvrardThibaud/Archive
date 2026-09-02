const {PubSub} = require('@google-cloud/pubsub');
const jobStore = require('./job_store');
const zipJob = require('./zip_job');

const PROJECT_ID = 'ecni2-2026';
const SUBSCRIPTION_NAME = 'ecni2-9';

const pubSubClient = new PubSub({projectId: PROJECT_ID});
const subscription = pubSubClient.subscription(SUBSCRIPTION_NAME);

function listenForMessages() {
  const messageHandler = message => {
    const data = JSON.parse(message.data.toString());
    console.log(`Received zip request ${message.id}`, data);

    return zipJob
      .processZipJob(data.tags)
      .then(result => {
        jobStore.markSuccessful(data.tags, result.filename);
        console.log(`Completed zip request ${message.id}`, result.filename);
        message.ack();
      })
      .catch(error => {
        console.error(`Failed zip request ${message.id}`, error);
        message.nack();
      });
  };

  const errorHandler = error => {
    console.error('Pub/Sub subscriber error', error);
  };

  subscription.on('message', messageHandler);
  subscription.on('error', errorHandler);

  return subscription;
}

module.exports = {
  listenForMessages
};
