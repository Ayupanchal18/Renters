import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../../../api/client';

export const pushNotificationService = {
  /**
   * Request permissions and get the FCM/Expo push token
   */
  async registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Get the native device token (FCM for Android)
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  },

  /**
   * Send the token to the server
   */
  async syncTokenWithServer(token: string) {
    try {
      const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
      await apiClient.post('/api/users/fcm-token', { token, deviceType });
      console.log(`✅ Push token synced with server (${deviceType})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to sync push token with server:', error);
      return false;
    }
  },

  /**
   * Remove the token from the server (Logout / Account Deletion)
   */
  async unregisterTokenFromServer(unsubscribe: boolean = false) {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return false;

      const token = (await Notifications.getDevicePushTokenAsync()).data;
      if (!token) return false;

      await apiClient.delete(`/api/users/fcm-token/${encodeURIComponent(token)}?unsubscribe=${unsubscribe}`);
      console.log(`✅ Push token removed from server (unsubscribe: ${unsubscribe})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to remove push token from server:', error);
      return false;
    }
  }
};

export default pushNotificationService;
