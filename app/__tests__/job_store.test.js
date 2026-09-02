const jobStore = require('../../app/job_store');

describe('job store', () => {
  test('should store a successful job by its tags', () => {
    const job = jobStore.markSuccessful(
      'california,sunset',
      'public/zips/archive.zip'
    );

    expect(job).toEqual({
      status: 'successful',
      filename: 'public/zips/archive.zip'
    });
    expect(jobStore.getJob('california,sunset')).toEqual(job);
  });
});
