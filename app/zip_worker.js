const {PubSub} = require('@google-cloud/pubsub');

const PROJECT_ID = 'ecni2-2026';
const SUBSCRIPTION_NAME = 'ecni2-9';

const pubSubClient = new PubSub({projectId: PROJECT_ID});
const subscription = pubSubClient.subscription(SUBSCRIPTION_NAME);

function listenForMessages() {
  const messageHandler = message => {
    const data = JSON.parse(message.data.toString());
    console.log(`Received zip request ${message.id}`, data);
    message.ack();
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
