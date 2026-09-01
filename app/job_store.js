const jobs = new Map();

function markSuccessful(tags, url) {
  const job = {status: 'successful', url};
  jobs.set(tags, job);
  return job;
}

function getJob(tags) {
  return jobs.get(tags);
}

module.exports = {
  markSuccessful,
  getJob
};
