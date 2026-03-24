import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.FIREBASE_ACCOUNT_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_ACCOUNT_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_ACCOUNT_PROJECT_ID;

if (privateKey && clientEmail && projectId && !privateKey.startsWith('your_') && !clientEmail.startsWith('your_') && !projectId.startsWith('your_')) {
  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.warn("Firebase Admin credentials not provided or are placeholders. Some features may not work.");
}




export default admin;
