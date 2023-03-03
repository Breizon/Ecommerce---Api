const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');
// TODO: Add SDKs for Firebase products that you want to use

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE,
  appId: process.env.FIREBASE_API_ID,
};

const firebaseApp = initializeApp(firebaseConfig);

const storage = getStorage(firebaseApp);

module.exports = { storage };