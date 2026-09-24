import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { CURRENT_USER } from './clubSyncService';

let Notifications: any = null;

try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('expo-notifications not available (Expo Go?), push notifications disabled');
}

export async function registerForPushNotificationsAsync() {
  if (!Notifications) return undefined;

  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = await Notifications.getExpoPushTokenAsync({
      projectId: "21c48e29-80e1-4695-9713-872a8ff4e70c",
    });
    
    if (token && token.data && CURRENT_USER?.id) {
      await supabase.from('users').update({
        push_token: token.data
      }).eq('user_id', CURRENT_USER.id);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token?.data;
}
