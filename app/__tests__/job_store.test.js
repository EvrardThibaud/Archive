const jobStore = require('../../app/job_store');

describe('job store', () => {
  test('should store a successful job by its tags', () => {
    const job = jobStore.markSuccessful(
      'california,sunset',
      'https://storage.example/archive.zip'
    );

    expect(job).toEqual({
      status: 'successful',
      url: 'https://storage.example/archive.zip'
    });
    expect(jobStore.getJob('california,sunset')).toEqual(job);
  });
});
