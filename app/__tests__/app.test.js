const request = require('supertest');

process.env.PORT = '0';

jest.mock('../../app/photo_model');
jest.mock('../../app/firebase_auth', () => ({
  requireFirebaseAuth: (req, res, next) => next()
}));
jest.mock('../../app/job_store');
jest.mock('../../app/zip_producer');
jest.mock('../../app/zip_storage');
jest.mock('../../app/zip_worker');
const jobStore = require('../../app/job_store');
const zipProducer = require('../../app/zip_producer');
const zipStorage = require('../../app/zip_storage');
const app = require('../../app/server');

describe('index route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jobStore.getJob.mockReturnValue(undefined);
    zipProducer.publishTags.mockResolvedValue('message-id');
    zipStorage.getSignedDownloadUrl.mockResolvedValue(
      'https://storage.example/download.zip'
    );
  });

  afterEach(() => {
    app.server.close();
  });

  test('should respond with a 200 with no query parameters', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .then(response => {
        expect(response.text).toMatch(
          /<title>Express App Testing Demo<\/title>/
        );
      });
  });

  test('should respond with a 200 with valid query parameters', () => {
    return request(app)
      .get('/?tags=california&tagmode=all')
      .expect('Content-Type', /html/)
      .expect(200)
      .then(response => {
        expect(response.text).toMatch(
          /<div class="panel panel-default search-results">/
        );
      });
  });

  test('should respond with a 200 with invalid query parameters', () => {
    return request(app)
      .get('/?tags=california123&tagmode=all')
      .expect('Content-Type', /html/)
      .expect(200)
      .then(response => {
        expect(response.text).toMatch(/<div class="alert alert-danger">/);
      });
  });

  test('should respond with a 500 error due to bad jsonp data', () => {
    return request(app)
      .get('/?tags=error&tagmode=all')
      .expect('Content-Type', /json/)
      .expect(500)
      .then(response => {
        expect(response.body).toEqual({ error: 'Internal server error' });
      });
  });

  test('should display the zip button with the search tags', () => {
    return request(app)
      .get('/?tags=california,sunset&tagmode=all')
      .expect(200)
      .then(response => {
        expect(response.text).toMatch(
          /action="\/zip\?tags=california%2Csunset"/
        );
      });
  });

  test('should display a signed download link for a completed job', () => {
    jobStore.getJob.mockReturnValue({
      status: 'successful',
      filename: 'public/zips/archive.zip'
    });

    return request(app)
      .get('/?tags=california&tagmode=all')
      .expect(200)
      .then(response => {
        expect(zipStorage.getSignedDownloadUrl).toHaveBeenCalledWith(
          'public/zips/archive.zip'
        );
        expect(response.text).toMatch(
          /href="https:\/\/storage.example\/download.zip"/
        );
        expect(response.text).toMatch(/>Download ZIP<\/a>/);
      });
  });

  test('should queue the tags to zip', () => {
    return request(app)
      .post('/zip?tags=california,sunset')
      .expect('Content-Type', /json/)
      .expect(202)
      .then(response => {
        expect(zipProducer.publishTags).toHaveBeenCalledWith(
          'california,sunset'
        );
        expect(response.body).toEqual({messageId: 'message-id'});
      });
  });

  test('should return a pending status while the ZIP is being created', () => {
    return request(app)
      .get('/zip/status?tags=california')
      .expect('Content-Type', /json/)
      .expect(202)
      .then(response => {
        expect(response.body).toEqual({status: 'pending'});
      });
  });

  test('should return the signed URL of a completed ZIP', () => {
    jobStore.getJob.mockReturnValue({
      status: 'successful',
      filename: 'public/zips/archive.zip'
    });

    return request(app)
      .get('/zip/status?tags=california')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(response => {
        expect(zipStorage.getSignedDownloadUrl).toHaveBeenCalledWith(
          'public/zips/archive.zip'
        );
        expect(response.body).toEqual({
          status: 'successful',
          url: 'https://storage.example/download.zip'
        });
      });
  });

  test('should reject invalid zip tags', () => {
    return request(app)
      .post('/zip?tags=california123')
      .expect('Content-Type', /json/)
      .expect(400)
      .then(response => {
        expect(zipProducer.publishTags).not.toHaveBeenCalled();
        expect(response.body).toEqual({error: 'Invalid tags parameter'});
      });
  });

  test('should respond with an error when queueing fails', () => {
    zipProducer.publishTags.mockRejectedValue(new Error('Pub/Sub error'));

    return request(app)
      .post('/zip?tags=california')
      .expect('Content-Type', /json/)
      .expect(500)
      .then(response => {
        expect(response.body).toEqual({error: 'Unable to queue zip request'});
      });
  });
});
