const mockGetSignedUrl = jest.fn();
const mockFile = jest.fn(() => ({getSignedUrl: mockGetSignedUrl}));
const mockBucket = jest.fn(() => ({file: mockFile}));
const mockStorage = jest.fn(() => ({bucket: mockBucket}));
const mockUnix = jest.fn(() => 1234);
const mockAdd = jest.fn(() => ({unix: mockUnix}));
const mockMoment = jest.fn(() => ({add: mockAdd}));

jest.mock('@google-cloud/storage', () => ({Storage: mockStorage}));
jest.mock('moment', () => mockMoment);

const zipStorage = require('../../app/zip_storage');

describe('getSignedDownloadUrl(filename)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STORAGE_BUCKET = 'ecni22026bucket';
    mockGetSignedUrl.mockResolvedValue(['https://storage.example/signed.zip']);
  });

  test('should generate a read URL valid for two days', () => {
    return zipStorage
      .getSignedDownloadUrl('public/zips/archive.zip')
      .then(url => {
        expect(mockBucket).toHaveBeenCalledWith('ecni22026bucket');
        expect(mockFile).toHaveBeenCalledWith('public/zips/archive.zip');
        expect(mockAdd).toHaveBeenCalledWith(2, 'days');
        expect(mockGetSignedUrl).toHaveBeenCalledWith({
          action: 'read',
          expires: 1234000
        });
        expect(url).toBe('https://storage.example/signed.zip');
      });
  });
});
