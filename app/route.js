const formValidator = require('./form_validator');
const firebaseAuth = require('./firebase_auth');
const jobStore = require('./job_store');
const photoModel = require('./photo_model');
const zipProducer = require('./zip_producer');
const zipStorage = require('./zip_storage');

function getZipUrl(tags) {
  const job = jobStore.getJob(tags);
  if (!job) {
    return Promise.resolve(null);
  }
  return zipStorage.getSignedDownloadUrl(job.filename);
}

function route(app) {
  app.get('/', (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      zipUrl: null,
      firebaseUserPath: process.env.FIREBASE_USER_PATH || 'thibaud',
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    // get photos from flickr public feed api
    return Promise.all([
      photoModel.getFlickrPhotos(tags, tagmode),
      getZipUrl(tags)
    ])
      .then(results => {
        ejsLocalVariables.photos = results[0];
        ejsLocalVariables.zipUrl = results[1];
        ejsLocalVariables.searchResults = true;
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        console.log('aspdfonaposd', error)
        return res.status(500).send({ error });
      });
  });

  app.post('/zip', firebaseAuth.requireFirebaseAuth, (req, res) => {
    const tags = req.query.tags;

    if (!tags || !formValidator.isValidCommaDelimitedList(tags)) {
      return res.status(400).send({error: 'Invalid tags parameter'});
    }

    return zipProducer
      .publishTags(tags)
      .then(messageId => res.status(202).send({messageId}))
      .catch(error => {
        console.error('Unable to queue zip request', error);
        return res.status(500).send({error: 'Unable to queue zip request'});
      });
  });

  app.get('/zip/status', firebaseAuth.requireFirebaseAuth, (req, res) => {
    const tags = req.query.tags;

    if (!tags || !formValidator.isValidCommaDelimitedList(tags)) {
      return res.status(400).send({error: 'Invalid tags parameter'});
    }

    const job = jobStore.getJob(tags);
    if (!job) {
      return res.status(202).send({status: 'pending'});
    }

    return zipStorage
      .getSignedDownloadUrl(job.filename)
      .then(url => res.send({status: job.status, url}))
      .catch(error => {
        console.error('Unable to generate ZIP download URL', error);
        return res.status(500).send({error: 'Unable to get ZIP status'});
      });
  });
}

module.exports = route;
