const jobs = new Map();

function markSuccessful(tags, filename) {
  const job = {status: 'successful', filename};
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
