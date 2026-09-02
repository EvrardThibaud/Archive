const {Storage} = require('@google-cloud/storage');
const moment = require('moment');

const PROJECT_ID = 'ecni2-2026';
const DEFAULT_BUCKET_NAME = 'ecni22026bucket';

const storage = new Storage({projectId: PROJECT_ID});

function getSignedDownloadUrl(filename) {
  const options = {
    action: 'read',
    expires: moment().add(2, 'days').unix() * 1000
  };

  return storage
    .bucket(process.env.STORAGE_BUCKET || DEFAULT_BUCKET_NAME)
    .file(filename)
    .getSignedUrl(options)
    .then(signedUrls => signedUrls[0]);
}

module.exports = {
  getSignedDownloadUrl
};
