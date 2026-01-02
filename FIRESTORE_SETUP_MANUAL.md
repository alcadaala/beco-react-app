// Manual Firestore Setup Instructions
// Follow these steps to add branches manually to Firestore

/*
STEP-BY-STEP GUIDE:

1. Go to Firebase Console: https://console.firebase.google.com/project/beco-app-2ea09/firestore

2. Click "Start collection"

3. Collection ID: branches

4. Add first document:
   - Document ID: WSH
   - Fields:
     * name (string): WSH
     * created_at (timestamp): (click "Add field" then select timestamp, use current time)

5. Click "Save"

6. Add more documents by clicking "Add document":
   - Document ID: DRS, name: DRS, created_at: (timestamp)
   - Document ID: DKL, name: DKL, created_at: (timestamp)
   - Document ID: MDN, name: MDN, created_at: (timestamp)
   - Document ID: KPP, name: KPP, created_at: (timestamp)

ALTERNATIVE - Use Firestore Console Test Mode:
1. Go to Firestore
2. Click the three dots menu > Import data
3. Or manually create each branch as shown above

Once done, you should see 5 documents in the "branches" collection.
*/

console.log('Please follow the manual steps in this file to add branches to Firestore');
