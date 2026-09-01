const crypto = require('crypto');
const {Storage} = require('@google-cloud/storage');
const ZipStream = require('zip-stream');
const photoModel = require('./photo_model');

const PROJECT_ID = 'ecni2-2026';
const BUCKET_NAME = 'ecni22026bucket';
const MAX_PHOTOS = 10;

const storage = new Storage({projectId: PROJECT_ID});

function addZipEntry(zip, stream, name) {
  return new Promise((resolve, reject) => {
    stream.once('error', reject);
    zip.entry(stream, {name}, error => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}

function defaultDependencies() {
  return {
    getFlickrPhotos: tags => photoModel.getFlickrPhotos(tags, 'all'),
    getImageStream: url => {
      const got = require('got');
      return got.default.stream(url);
    },
    createZip: () => new ZipStream(),
    createFile: filename => storage.bucket(BUCKET_NAME).file(filename),
    createFilename: () =>
      `public/zips/${crypto.randomBytes(16).toString('hex')}.zip`
  };
}

function processZipJob(tags, dependencyOverrides) {
  const dependencies = Object.assign(
    defaultDependencies(),
    dependencyOverrides || {}
  );

  return dependencies.getFlickrPhotos(tags).then(photos => {
    const selectedPhotos = photos.slice(0, MAX_PHOTOS);

    if (!selectedPhotos.length) {
      throw new Error('No Flickr photos found');
    }

    const filename = dependencies.createFilename();
    const file = dependencies.createFile(filename);
    const uploadStream = file.createWriteStream({
      metadata: {
        contentType: 'application/zip',
        cacheControl: 'private'
      },
      resumable: false
    });
    const zip = dependencies.createZip();

    return new Promise((resolve, reject) => {
      uploadStream.once('error', reject);
      zip.once('error', reject);
      uploadStream.once('finish', () => {
        resolve({
          filename,
          url: file.publicUrl(),
          photoCount: selectedPhotos.length
        });
      });

      zip.pipe(uploadStream);

      selectedPhotos
        .reduce((previousEntry, photo, index) => {
          return previousEntry.then(() => {
            const imageUrl = photo.media.b || photo.media.m;
            const imageStream = dependencies.getImageStream(imageUrl);
            return addZipEntry(zip, imageStream, `photo-${index + 1}.jpg`);
          });
        }, Promise.resolve())
        .then(() => zip.finalize())
        .catch(reject);
    });
  });
}

module.exports = {
  processZipJob
};
