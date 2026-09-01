const request = require('supertest');

jest.mock('../../app/photo_model');
jest.mock('../../app/zip_producer');
const zipProducer = require('../../app/zip_producer');
const app = require('../../app/server');

describe('index route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    zipProducer.publishTags.mockResolvedValue('message-id');
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
