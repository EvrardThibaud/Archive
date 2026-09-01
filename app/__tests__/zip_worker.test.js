const mockOn = jest.fn();
const mockSubscription = {on: mockOn};
const mockGetSubscription = jest.fn(() => mockSubscription);
const mockPubSub = jest.fn(() => ({subscription: mockGetSubscription}));

jest.mock('@google-cloud/pubsub', () => ({PubSub: mockPubSub}));

const zipWorker = require('../../app/zip_worker');

describe('listenForMessages()', () => {
  beforeEach(() => {
    mockOn.mockClear();
  });

  test('should configure the expected project and subscription', () => {
    expect(mockPubSub).toHaveBeenCalledWith({projectId: 'ecni2-2026'});
    expect(mockGetSubscription).toHaveBeenCalledWith('ecni2-9');
  });

  test('should listen for messages and acknowledge them', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const ack = jest.fn();

    expect(zipWorker.listenForMessages()).toBe(mockSubscription);

    const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')[1];
    messageHandler({
      id: 'message-id',
      data: Buffer.from(JSON.stringify({tags: 'california'})),
      ack
    });

    expect(log).toHaveBeenCalledWith('Received zip request message-id', {
      tags: 'california'
    });
    expect(ack).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  test('should listen for subscriber errors', () => {
    const logError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const error = new Error('Subscriber error');

    zipWorker.listenForMessages();

    const errorHandler = mockOn.mock.calls.find(call => call[0] === 'error')[1];
    errorHandler(error);

    expect(logError).toHaveBeenCalledWith('Pub/Sub subscriber error', error);
    logError.mockRestore();
  });
});
