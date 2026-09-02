const mockOn = jest.fn();
const mockSubscription = {on: mockOn};
const mockGetSubscription = jest.fn(() => mockSubscription);
const mockPubSub = jest.fn(() => ({subscription: mockGetSubscription}));
const mockProcessZipJob = jest.fn();
const mockMarkSuccessful = jest.fn();

jest.mock('@google-cloud/pubsub', () => ({PubSub: mockPubSub}));
jest.mock('../../app/zip_job', () => ({processZipJob: mockProcessZipJob}));
jest.mock('../../app/job_store', () => ({markSuccessful: mockMarkSuccessful}));

const zipWorker = require('../../app/zip_worker');

describe('listenForMessages()', () => {
  beforeEach(() => {
    mockOn.mockClear();
    mockProcessZipJob.mockReset();
    mockProcessZipJob.mockResolvedValue({
      filename: 'public/zips/archive.zip'
    });
    mockMarkSuccessful.mockClear();
  });

  test('should configure the expected project and subscription', () => {
    expect(mockPubSub).toHaveBeenCalledWith({projectId: 'ecni2-2026'});
    expect(mockGetSubscription).toHaveBeenCalledWith('ecni2-9');
  });

  test('should listen for messages and acknowledge them', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const ack = jest.fn();
    const nack = jest.fn();

    expect(zipWorker.listenForMessages()).toBe(mockSubscription);

    const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')[1];
    const handling = messageHandler({
      id: 'message-id',
      data: Buffer.from(JSON.stringify({tags: 'california'})),
      ack,
      nack
    });

    return handling.then(() => {
      expect(mockProcessZipJob).toHaveBeenCalledWith('california');
      expect(mockMarkSuccessful).toHaveBeenCalledWith(
        'california',
        'public/zips/archive.zip'
      );
      expect(ack).toHaveBeenCalledTimes(1);
      expect(nack).not.toHaveBeenCalled();
      log.mockRestore();
    });
  });

  test('should nack a message when the zip job fails', () => {
    const logError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const ack = jest.fn();
    const nack = jest.fn();
    mockProcessZipJob.mockRejectedValue(new Error('Upload failed'));

    zipWorker.listenForMessages();
    const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')[1];

    return messageHandler({
      id: 'message-id',
      data: Buffer.from(JSON.stringify({tags: 'california'})),
      ack,
      nack
    }).then(() => {
      expect(ack).not.toHaveBeenCalled();
      expect(nack).toHaveBeenCalledTimes(1);
      expect(mockMarkSuccessful).not.toHaveBeenCalled();
      logError.mockRestore();
    });
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
