import { MPLUSRounded1c_400Regular, MPLUSRounded1c_700Bold, MPLUSRounded1c_900Black, useFonts } from '@expo-google-fonts/m-plus-rounded-1c';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// スプラッシュスクリーン（起動画面）の制御
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'MPlus-Regular': MPLUSRounded1c_400Regular,
    'MPlus-Bold': MPLUSRounded1c_700Bold,
    'MPlus-Black': MPLUSRounded1c_900Black,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // headerShown: false にすることで、上部のバーも消します
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}