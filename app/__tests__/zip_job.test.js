const {PassThrough, Readable} = require('stream');
const zipJob = require('../../app/zip_job');

function createPhotos(count) {
  return Array.from({length: count}, (unused, index) => ({
    media: {
      b: `https://images.example/photo-${index + 1}.jpg`
    }
  }));
}

describe('processZipJob(tags)', () => {
  test('should zip at most ten Flickr photos and upload the archive', () => {
    const uploadedChunks = [];
    const uploadStream = new PassThrough();
    uploadStream.on('data', chunk => uploadedChunks.push(chunk));

    const file = {
      createWriteStream: jest.fn(() => uploadStream)
    };
    const getImageStream = jest.fn(url => Readable.from([Buffer.from(url)]));
    const dependencies = {
      getFlickrPhotos: jest.fn(() => Promise.resolve(createPhotos(12))),
      getImageStream,
      createFile: jest.fn(() => file),
      createFilename: jest.fn(() => 'public/zips/test.zip')
    };

    return zipJob.processZipJob('california', dependencies).then(result => {
      expect(dependencies.getFlickrPhotos).toHaveBeenCalledWith('california');
      expect(getImageStream).toHaveBeenCalledTimes(10);
      expect(dependencies.createFile).toHaveBeenCalledWith(
        'public/zips/test.zip'
      );
      expect(file.createWriteStream).toHaveBeenCalledWith({
        metadata: {
          contentType: 'application/zip',
          cacheControl: 'private'
        },
        resumable: false
      });
      expect(result).toEqual({
        filename: 'public/zips/test.zip',
        photoCount: 10
      });
      expect(Buffer.concat(uploadedChunks).slice(0, 2).toString()).toBe('PK');
    });
  });

  test('should reject a job without Flickr photos', () => {
    return expect(
      zipJob.processZipJob('missing', {
        getFlickrPhotos: jest.fn(() => Promise.resolve([]))
      })
    ).rejects.toThrow('No Flickr photos found');
  });
});
