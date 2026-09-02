const {applicationDefault, getApps, initializeApp} = require('firebase-admin/app');

const DATABASE_URL = 'https://ecni2-2026-default-rtdb.firebaseio.com';

function getFirebaseApp() {
  const initializedApps = getApps();

  if (initializedApps.length) {
    return initializedApps[0];
  }

  return initializeApp({
    credential: applicationDefault(),
    databaseURL: DATABASE_URL
  });
}

module.exports = {
  getFirebaseApp
};
