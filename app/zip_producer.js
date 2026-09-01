const {PubSub} = require('@google-cloud/pubsub');

const PROJECT_ID = 'ecni2-2026';
const TOPIC_NAME = 'ecni2-9';

const pubSubClient = new PubSub({projectId: PROJECT_ID});
const topic = pubSubClient.topic(TOPIC_NAME);

function publishTags(tags) {
  const data = Buffer.from(JSON.stringify({tags}));
  return topic.publishMessage({data});
}

module.exports = {
  publishTags
};
