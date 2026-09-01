const mockPublishMessage = jest.fn();
const mockTopic = jest.fn(() => ({publishMessage: mockPublishMessage}));
const mockPubSub = jest.fn(() => ({topic: mockTopic}));

jest.mock('@google-cloud/pubsub', () => ({PubSub: mockPubSub}));

const zipProducer = require('../../app/zip_producer');

describe('publishTags(tags)', () => {
  beforeEach(() => {
    mockPublishMessage.mockClear();
    mockPublishMessage.mockResolvedValue('message-id');
  });

  test('should configure the expected Google Cloud project and topic', () => {
    expect(mockPubSub).toHaveBeenCalledWith({projectId: 'ecni2-2026'});
    expect(mockTopic).toHaveBeenCalledWith('ecni2-9');
  });

  test('should publish the tags as a JSON message', () => {
    return zipProducer.publishTags('california,sunset').then(messageId => {
      expect(messageId).toBe('message-id');
      expect(mockPublishMessage).toHaveBeenCalledTimes(1);
      const message = mockPublishMessage.mock.calls[0][0];
      expect(JSON.parse(message.data.toString())).toEqual({
        tags: 'california,sunset'
      });
    });
  });
});
