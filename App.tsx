import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { PlayerEdgesTable } from './src/ui/PlayerEdgesTable';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <PlayerEdgesTable />
    </View>
  );
}
