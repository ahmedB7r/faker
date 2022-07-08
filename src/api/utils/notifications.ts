import { Expo } from 'expo-server-sdk'

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo()

export const pushNotification = async ({ message, token, data, title }) => {
  if (!Expo.isExpoPushToken(token)) {
    return 'not token'
  }
  const notification = await expo.sendPushNotificationsAsync([
    {
      to: token,
      sound: 'default',
      body: message,
      data,
      title,
    },
  ])
  console.log(
    '🚀 ~ file: notifications.ts ~ line 18 ~ pushNotification ~ notification',
    notification,
  )
}
