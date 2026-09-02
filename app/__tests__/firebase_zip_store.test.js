const mockSet = jest.fn();
const mockFilenameChild = {set: mockSet};
const mockFilename = jest.fn(() => mockFilenameChild);
const mockTimestampChild = {child: mockFilename};
const mockTimestamp = jest.fn(() => mockTimestampChild);
const mockRef = jest.fn(() => ({child: mockTimestamp}));
const mockGetDatabase = jest.fn(() => ({ref: mockRef}));
const mockGetFirebaseApp = jest.fn(() => 'firebase-app');

jest.mock('firebase-admin/database', () => ({getDatabase: mockGetDatabase}));
jest.mock('../../app/firebase_app', () => ({
  getFirebaseApp: mockGetFirebaseApp
}));

const firebaseZipStore = require('../../app/firebase_zip_store');

describe('saveSuccessfulZip()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FIREBASE_USER_PATH = 'thibaud';
    mockSet.mockResolvedValue();
  });

  test('should save the completed ZIP under the user, timestamp and filename', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1725271200000);
    const zip = {
      filename: 'public/zips/archive.zip',
      photoCount: 10
    };

    return firebaseZipStore
      .saveSuccessfulZip(
        'california',
        zip,
        'https://storage.example/archive.zip'
      )
      .then(savedZip => {
        expect(mockGetDatabase).toHaveBeenCalledWith('firebase-app');
        expect(mockRef).toHaveBeenCalledWith('thibaud');
        expect(mockTimestamp).toHaveBeenCalledWith('1725271200000');
        expect(mockFilename).toHaveBeenCalledWith('archive');
        expect(mockSet).toHaveBeenCalledWith({
          status: 'successful',
          tags: 'california',
          filename: 'public/zips/archive.zip',
          storagePath: 'public/zips/archive.zip',
          downloadUrl: 'https://storage.example/archive.zip',
          photoCount: 10,
          createdAt: 1725271200000
        });
        expect(savedZip.status).toBe('successful');
        now.mockRestore();
      });
  });
});
