// Firebase Configuration Template
// Copy this file to firebase-config.js and fill in your Firebase project details
// Get these values from: Firebase Console > Project Settings > General > Your apps

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// For Cloudflare Pages deployment, use environment variables:
// const firebaseConfig = {
//     apiKey: FIREBASE_API_KEY,
//     authDomain: FIREBASE_AUTH_DOMAIN,
//     projectId: FIREBASE_PROJECT_ID,
//     storageBucket: FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
//     appId: FIREBASE_APP_ID,
//     measurementId: FIREBASE_MEASUREMENT_ID
// };
