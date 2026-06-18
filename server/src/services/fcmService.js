import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FCMService {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        try {
            // Check if app is already initialized to prevent duplicate initialization
            if (!admin.apps.length) {
                const serviceAccountPath = path.resolve(__dirname, '../../../renters-dae24-firebase-adminsdk-fbsvc-d00c5f9a2c.json');

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountPath)
                });

                console.log('✅ Firebase Admin SDK initialized successfully');
                this.initialized = true;
            } else {
                this.initialized = true;
            }
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        }
    }

    /**
     * Subscribe a token or an array of tokens to a topic
     * @param {string|string[]} tokens 
     * @param {string} topic 
     */
    async subscribeToTopic(tokens, topic) {
        if (!this.initialized) {
            console.warn('FCM Service not initialized');
            return false;
        }

        try {
            const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
            if (tokenArray.length === 0) return false;

            const response = await admin.messaging().subscribeToTopic(tokenArray, topic);
            console.log(`Subscribed to topic ${topic}. Success count: ${response.successCount}`);
            return response.successCount > 0;
        } catch (error) {
            console.error(`Error subscribing to topic ${topic}:`, error);
            return false;
        }
    }

    /**
     * Unsubscribe a token or an array of tokens from a topic
     * @param {string|string[]} tokens 
     * @param {string} topic 
     */
    async unsubscribeFromTopic(tokens, topic) {
        if (!this.initialized) {
            console.warn('FCM Service not initialized');
            return false;
        }

        try {
            const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
            if (tokenArray.length === 0) return false;

            const response = await admin.messaging().unsubscribeFromTopic(tokenArray, topic);
            console.log(`Unsubscribed from topic ${topic}. Success count: ${response.successCount}`);
            return response.successCount > 0;
        } catch (error) {
            console.error(`Error unsubscribing from topic ${topic}:`, error);
            return false;
        }
    }

    /**
     * Send a notification to a specific topic
     * @param {string} topic 
     * @param {object} payload - { title, body, data }
     */
    async sendToTopic(topic, payload) {
        if (!this.initialized) {
            console.warn('FCM Service not initialized');
            return false;
        }

        try {
            const message = {
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: payload.data || {},
                topic: topic
            };

            const response = await admin.messaging().send(message);
            console.log(`Successfully sent message to topic ${topic}:`, response);
            return true;
        } catch (error) {
            console.error(`Error sending message to topic ${topic}:`, error);
            return false;
        }
    }
}

const fcmService = new FCMService();
export default fcmService;
