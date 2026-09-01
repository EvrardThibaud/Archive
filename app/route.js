const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const zipProducer = require('./zip_producer');

function route(app) {
  app.get('/', (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
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
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        console.log('aspdfonaposd', error)
        return res.status(500).send({ error });
      });
  });

  app.post('/zip', (req, res) => {
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
}

module.exports = route;
