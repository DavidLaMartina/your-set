import { Redirect } from 'expo-router';

/** Default tab route — app opens at `/` which maps here. */
export default function TabsIndex() {
  return <Redirect href="/workout" />;
}
