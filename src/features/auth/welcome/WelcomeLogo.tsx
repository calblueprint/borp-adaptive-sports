import { View } from 'react-native';
import Paths0 from '~/assets/welcome-logo/paths0.svg';
import Paths1 from '~/assets/welcome-logo/paths1.svg';
import Paths2 from '~/assets/welcome-logo/paths2.svg';
import Paths3 from '~/assets/welcome-logo/paths3.svg';
import Paths4 from '~/assets/welcome-logo/paths4.svg';
import Speed0 from '~/assets/welcome-logo/speed0.svg';
import Speed1 from '~/assets/welcome-logo/speed1.svg';
import Speed2 from '~/assets/welcome-logo/speed2.svg';
import styles from './styles';

// White BORP logo (wheelchair + wordmark), layered exactly like the Figma file
export default function WelcomeLogo() {
  return (
    <View
      style={styles.logo}
      accessibilityRole="image"
      accessibilityLabel="BORP"
    >
      <View style={[styles.layer, styles.wheelchair]}>
        <Speed0
          width={187.4}
          height={171}
          style={[styles.speedLine, { left: -4.8 }]}
        />
        <Speed1
          width={187.4}
          height={171}
          style={[styles.speedLine, { left: -5.3 }]}
        />
        <Speed2
          width={187.4}
          height={171}
          style={[styles.speedLine, { left: -7.2 }]}
        />
        <Paths0 width={171} height={171} style={styles.layer} />
        <Paths1 width={171} height={171} style={styles.layer} />
      </View>
      <Paths2 width={171} height={171} style={styles.layer} />
      <Paths3 width={171} height={171} style={styles.layer} />
      <Paths4 width={171} height={171} style={styles.layer} />
    </View>
  );
}
