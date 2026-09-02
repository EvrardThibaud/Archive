/* eslint-env browser */

import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  getDatabase,
  onValue,
  ref
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCIvTlTGG115yaWDeFqxi-Jc2oYH45FlME',
  authDomain: 'ecni2-2026.firebaseapp.com',
  databaseURL: 'https://ecni2-2026-default-rtdb.firebaseio.com',
  projectId: 'ecni2-2026',
  storageBucket: 'ecni2-2026.firebasestorage.app',
  messagingSenderId: '1046535202867',
  appId: '1:1046535202867:web:a23b26f739647f87221b46'
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
const provider = new GoogleAuthProvider();
const authenticatedApp = document.getElementById('authenticated-app');
const authMessage = document.getElementById('auth-message');
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const historySection = document.getElementById('zip-history');
const historyStatus = document.getElementById('zip-history-status');
const historyList = document.getElementById('zip-history-list');
let stopListeningForZips = null;

window.firebaseRequest = function(url, options) {
  const user = auth.currentUser;

  if (!user) {
    return Promise.reject(new Error('Authentication required'));
  }

  return user.getIdToken().then(token => {
    const requestOptions = options || {};
    const headers = new Headers(requestOptions.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(url, Object.assign({}, requestOptions, {headers}));
  });
};

function flattenZips(data) {
  const zips = [];

  Object.keys(data || {}).forEach(timestamp => {
    Object.keys(data[timestamp] || {}).forEach(filename => {
      zips.push(data[timestamp][filename]);
    });
  });

  return zips.sort((first, second) => second.createdAt - first.createdAt);
}

function renderZipHistory(data) {
  const zips = flattenZips(data);
  historyList.textContent = '';

  if (!zips.length) {
    historyStatus.textContent = 'Aucun ZIP généré pour le moment.';
    return;
  }

  historyStatus.textContent = '';
  zips.forEach(zip => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const details = document.createElement('span');

    item.className = 'list-group-item zip-history-item';
    link.href = zip.downloadUrl;
    link.className = 'btn btn-success btn-sm';
    link.textContent = 'Télécharger';
    details.textContent = `${zip.tags} — ${new Date(zip.createdAt).toLocaleString()}`;

    item.appendChild(details);
    item.appendChild(link);
    historyList.appendChild(item);
  });
}

function listenForZips() {
  const databasePath = historySection.dataset.firebasePath;
  historyStatus.textContent = 'Chargement…';
  stopListeningForZips = onValue(
    ref(database, databasePath),
    snapshot => renderZipHistory(snapshot.val()),
    error => {
      historyStatus.textContent = `Lecture Firebase impossible : ${error.message}`;
    }
  );
}

signInButton.addEventListener('click', () => {
  signInWithPopup(auth, provider).catch(error => {
    authMessage.textContent = `Connexion impossible : ${error.message}`;
  });
});

signOutButton.addEventListener('click', () => {
  signOut(auth);
});

onAuthStateChanged(auth, user => {
  const isAuthenticated = Boolean(user);
  authenticatedApp.hidden = !isAuthenticated;
  signInButton.hidden = isAuthenticated;
  signOutButton.hidden = !isAuthenticated;

  if (!user) {
    authMessage.textContent = "Connectez-vous pour utiliser l'application.";
    historyList.textContent = '';
    if (stopListeningForZips) {
      stopListeningForZips();
      stopListeningForZips = null;
    }
    return;
  }

  authMessage.textContent = `Connecté : ${user.displayName || user.email}`;
  listenForZips();
});
