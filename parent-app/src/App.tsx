import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { RootNavigator } from './navigation/RootNavigator';

export const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
          <RootNavigator />
        </View>
      </SocketProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

export default App;
