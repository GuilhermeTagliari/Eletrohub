import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from './src/components/Toast';
import { requestNotificationPermission } from './src/utils/notifications';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { MyItemsProvider } from './src/context/MyItemsContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RatingsProvider } from './src/context/RatingsContext';
import { AddressProvider } from './src/context/AddressContext';
import { ChatProvider } from './src/context/ChatContext';
import { OrdersProvider } from './src/context/OrdersContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { VerificationProvider } from './src/context/VerificationContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { TradeInProvider } from './src/context/TradeInContext';
import { LogisticsProvider } from './src/context/LogisticsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => { requestNotificationPermission(); }, []);

  return (
    <SafeAreaProvider>
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <MyItemsProvider>
            <AddressProvider>
              <RatingsProvider>
                <ChatProvider>
                  <CartProvider>
                    <OrdersProvider>
                      <NotificationsProvider>
                        <VerificationProvider>
                          <CurrencyProvider>
                            <TradeInProvider>
                              <LogisticsProvider>
                                <View style={{ flex: 1 }}>
                                  <AppNavigator />
                                  <Toast />
                                </View>
                              </LogisticsProvider>
                            </TradeInProvider>
                          </CurrencyProvider>
                        </VerificationProvider>
                      </NotificationsProvider>
                    </OrdersProvider>
                  </CartProvider>
                </ChatProvider>
              </RatingsProvider>
            </AddressProvider>
          </MyItemsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
