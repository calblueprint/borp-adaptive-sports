import { Image, View } from 'react-native';
import { Tabs } from 'expo-router';
import HouseIcon from '@/icons/house.svg';
import colors from '@/styles/colors';
import { tabBar } from '@/styles/layout';
import avatar from '~/assets/bp-icon.png';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: tabBar.bottom,
          alignSelf: 'center',
          backgroundColor: colors.glass,
          borderRadius: 999,
          height: tabBar.height,
          width: 140,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 5,
          paddingHorizontal: 4,
          // The floating bar sits above the home indicator, so drop the
          // safe-area padding react-navigation adds by default.
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          height: tabBar.height - 2, // minus top/bottom border
          padding: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        // Default icon wrapper is ~31x28; size it to our pill so it stays centered.
        tabBarIconStyle: {
          width: styles.iconContainer.width,
          height: styles.iconContainer.height,
          transform: [{ translateY: -1 }], // optical centering nudge
        },
      }}
    >
      <Tabs.Screen
        name="index"
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
