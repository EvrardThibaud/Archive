const {getAuth} = require('firebase-admin/auth');
const {getFirebaseApp} = require('./firebase_app');

function requireFirebaseAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer (.+)$/);

  if (!match) {
    return res.status(401).send({error: 'Authentication required'});
  }

  return getAuth(getFirebaseApp())
    .verifyIdToken(match[1])
    .then(decodedToken => {
      req.user = decodedToken;
      return next();
    })
    .catch(() => res.status(401).send({error: 'Invalid authentication token'}));
}

module.exports = {
  requireFirebaseAuth
};
