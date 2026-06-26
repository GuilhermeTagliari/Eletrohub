import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EletroHub',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#000000',
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function enviarNotificacao(titulo, corpo, dados = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        data: dados,
        sound: true,
      },
      trigger: null, // imediata
    });
  } catch (_) {}
}

export async function agendarNotificacaoPromocao(nomeItem, duracaoDias) {
  try {
    const expira = new Date();
    expira.setDate(expira.getDate() + duracaoDias);
    expira.setHours(expira.getHours() - 2); // notifica 2h antes de expirar

    if (expira > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚡ Promoção encerrando!',
          body: `O anúncio "${nomeItem}" encerra em breve. Renove para continuar em destaque.`,
          sound: true,
        },
        trigger: expira,
      });
    }
  } catch (_) {}
}
