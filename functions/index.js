// Most of the code here was borrowed from https://github.com/firebase/functions-samples/blob/master/authorized-https-endpoint/functions/index.js
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const express = require('express');
const cors = require('cors')({origin: true});
const router = new express.Router();

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>');
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
  }).catch(error => {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
  });
};

router.use(cors);
router.use(validateFirebaseIdToken);
router.get('*', (req, res) => {
  if(req.user.isAdmin || req.user.isDelegatedAdmin) {
    res.send(`Authorized`);
  }
  else {
    res.status(403).send('Unauthorized');
  }
});

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.isAdmin = functions.https.onRequest((req, res) => {
  // NOTE: Adding a temporary fix for issue https://github.com/firebase/firebase-functions/issues/27
  req.url = req.path ? req.url : `/${req.url}`;
  return router(req, res)
});