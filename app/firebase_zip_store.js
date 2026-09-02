const path = require('path');
const {getDatabase} = require('firebase-admin/database');
const {getFirebaseApp} = require('./firebase_app');

const DEFAULT_USER_PATH = 'thibaud';

function getZipKey(filename) {
  const basename = path.basename(filename, path.extname(filename));
  return basename
    .split('')
    .map(character => ('.#$[]/'.includes(character) ? '-' : character))
    .join('');
}

function saveSuccessfulZip(tags, zip, downloadUrl) {
  const createdAt = Date.now();
  const userPath = process.env.FIREBASE_USER_PATH || DEFAULT_USER_PATH;
  const zipReference = getDatabase(getFirebaseApp())
    .ref(userPath)
    .child(String(createdAt))
    .child(getZipKey(zip.filename));

  const data = {
    status: 'successful',
    tags,
    filename: zip.filename,
    storagePath: zip.filename,
    downloadUrl,
    photoCount: zip.photoCount,
    createdAt
  };

  return zipReference.set(data).then(() => data);
}

module.exports = {
  saveSuccessfulZip
};
