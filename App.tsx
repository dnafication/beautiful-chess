import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { PlayerEdgesTable } from './src/ui/PlayerEdgesTable';

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f4ef' }}>
      <StatusBar style="auto" />
      {fontsLoaded && <PlayerEdgesTable />}
    </View>
  );
}
