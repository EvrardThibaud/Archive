const mockVerifyIdToken = jest.fn();
const mockGetAuth = jest.fn(() => ({verifyIdToken: mockVerifyIdToken}));
const mockGetFirebaseApp = jest.fn(() => 'firebase-app');

jest.mock('firebase-admin/auth', () => ({getAuth: mockGetAuth}));
jest.mock('../../app/firebase_app', () => ({
  getFirebaseApp: mockGetFirebaseApp
}));

const firebaseAuth = require('../../app/firebase_auth');

describe('requireFirebaseAuth()', () => {
  let request;
  let response;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    request = {get: jest.fn()};
    response = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  test('should reject a request without a bearer token', () => {
    request.get.mockReturnValue(undefined);

    firebaseAuth.requireFirebaseAuth(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledWith({
      error: 'Authentication required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should pass the decoded Firebase user to the route', () => {
    const decodedToken = {uid: 'firebase-user'};
    request.get.mockReturnValue('Bearer valid-token');
    mockVerifyIdToken.mockResolvedValue(decodedToken);

    return firebaseAuth
      .requireFirebaseAuth(request, response, next)
      .then(() => {
        expect(mockGetAuth).toHaveBeenCalledWith('firebase-app');
        expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
        expect(request.user).toBe(decodedToken);
        expect(next).toHaveBeenCalledTimes(1);
      });
  });

  test('should reject an invalid Firebase token', () => {
    request.get.mockReturnValue('Bearer invalid-token');
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    return firebaseAuth
      .requireFirebaseAuth(request, response, next)
      .then(() => {
        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.send).toHaveBeenCalledWith({
          error: 'Invalid authentication token'
        });
        expect(next).not.toHaveBeenCalled();
      });
  });
});
