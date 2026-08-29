import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Board } from './src/ui/Board';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Board />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f4ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
