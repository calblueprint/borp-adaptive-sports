import { Image, View } from 'react-native';
import { Tabs } from 'expo-router';
import HouseIcon from '@/icons/house.svg';
import colors from '@/styles/colors';
import avatar from '~/assets/bp-icon.png';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 33,
          alignSelf: 'center',
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          borderRadius: 999,
          height: 54,
          width: 140,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 5,
          paddingHorizontal: 4,
        },
      }}
    >
      <Tabs.Screen
        name="trails/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeTab]}>
              <HouseIcon width={20} height={20} color={colors.black} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeTab]}>
              <Image
                source={avatar}
                style={{ width: 20, height: 20, borderRadius: 10 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/how-you-go"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}

const styles = {
  iconContainer: {
    width: 64,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  activeTab: {
    backgroundColor: colors.lightGray,
  },
};
