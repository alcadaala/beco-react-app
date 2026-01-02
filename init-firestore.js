/**
 * Firebase Firestore Setup Script
 * Run this once to initialize your Firestore database with branches
 */

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase.js';

const branches = [
    { id: 'WSH', name: 'WSH', created_at: new Date() },
    { id: 'DRS', name: 'DRS', created_at: new Date() },
    { id: 'DKL', name: 'DKL', created_at: new Date() },
    { id: 'MDN', name: 'MDN', created_at: new Date() },
    { id: 'KPP', name: 'KPP', created_at: new Date() }
];

async function initializeFirestore() {
    console.log('Initializing Firestore database...');

    try {
        // Create branches
        for (const branch of branches) {
            await setDoc(doc(db, 'branches', branch.id), branch);
            console.log(`✅ Created branch: ${branch.name}`);
        }

        console.log('✅ Firestore initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing Firestore:', error);
    }
}

initializeFirestore();
