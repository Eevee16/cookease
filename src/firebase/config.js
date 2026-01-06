import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
// PASTE YOUR CONFIG HERE (from Step 2)
const firebaseConfig = {
  apiKey: "AIzaSyA4KDnymUbhNdRq0XraGnTsl7aCZffxs-8",
  authDomain: "cookease-835ba.firebaseapp.com",
  projectId: "cookease-835ba",
  storageBucket: "cookease-835ba.appspot.com",
  messagingSenderId: "845407525260",
  appId: "1:845407525260:web:c4eab7cdb67691026d5ea9"
}

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const ingredients = [
  "chicken",
  "chicken breast",
  "beef",
  "ground beef",
  "pork",
  "bacon",
  "salmon",
  "onion",
  "garlic",
  "tomato",
  "potato",
  "carrot",
  "broccoli",
  "bell pepper",
  "green onion",
  "spinach",
  "mushroom",
  "rice",
  "pasta",
  "bread",
  "flour",
  "milk",
  "butter",
  "cheese",
  "yogurt",
  "salt",
  "black pepper",
  "olive oil"
];

export default app;