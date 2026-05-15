import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton — avoid double-init in Next.js dev hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/**
 * Returns the Messaging instance.
 * Must be called in the browser only.
 */
export function getFirebaseMessaging() {
    if (typeof window === 'undefined') return null;
    try {
        return getMessaging(app);
    } catch {
        return null;
    }
}

/**
 * Request push permission and return the FCM token.
 * Returns null if permission denied or browser unsupported.
 */
export async function requestFCMToken() {
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.register(
                '/firebase-messaging-sw.js',
                { scope: '/' }
            ),
        });
        return token || null;
    } catch (err) {
        console.warn('[FCM] Token request failed:', err.message);
        return null;
    }
}

/**
 * Listen for foreground messages (tab is open).
 * Callback receives { notification: { title, body }, data }
 */
export function onForegroundMessage(callback) {
    const messaging = getFirebaseMessaging();
    if (!messaging) return () => {};
    return onMessage(messaging, callback);
}

export { app };
