import firebase from 'firebase/compat/app';
import {
  GoogleAuthProvider,
} from 'firebase/auth';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmQYNeJ5wsIL8HfhNw1gz92dj-EPfH9KU",
  authDomain: "eggsperience-therapy.firebaseapp.com",
  projectId: "eggsperience-therapy",
  storageBucket: "eggsperience-therapy.appspot.com",
  messagingSenderId: "330660637044",
  appId: "1:330660637044:web:96a47e76a3d5710aaea421",
  measurementId: "G-CCQK0XQC9N"
};
export const app = firebase.initializeApp(firebaseConfig);
export const firestore = firebase.firestore();
export const GoogleProvider = new GoogleAuthProvider();
export const auth = firebase.auth();
export const signInWithGoogle = () => {
  auth
    .signInWithPopup(GoogleProvider)
    .then(async ({ user, additionalUserInfo }) => {
      if (additionalUserInfo.isNewUser) {
        await setDoc(doc(firestore, 'user', user.uid), {
          userName: user.displayName,
          userImage: user.photoURL,
          aboutUser: '',
          bgImg: '',
          // ...
        });
      }
    })
    .catch((error) => {
      throw error;
    });
};