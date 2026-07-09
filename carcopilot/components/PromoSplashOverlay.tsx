import { Modal, View, Pressable, StyleSheet, Linking } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type { PromoSplash } from '@/types/app'
import { Spacing } from '@/constants/theme'
import { Button } from '@/components/Button'
import { Text } from '@/components/Typography'

type Props = {
  splash: PromoSplash | null
  onClose: () => void
}

export function PromoSplashOverlay({ splash, onClose }: Props) {
  const router = useRouter()

  if (!splash) return null

  function handleCtaPress() {
    if (!splash) return
    const dest = splash.cta_destination
    if (!dest) return
    if (dest.startsWith('http://') || dest.startsWith('https://')) {
      Linking.openURL(dest)
    } else {
      onClose()
      router.push(dest as any)
    }
  }

  function handleMoreInfoPress() {
    if (splash?.learn_more_url) {
      Linking.openURL(splash.learn_more_url)
    }
  }

  return (
    <Modal visible={!!splash} animationType="fade" statusBarTranslucent>
      <View style={styles.fullScreen}>
        <Image
          source={{ uri: splash.image_url }}
          style={styles.backgroundImage}
          contentFit="cover"
        />

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.bottomContent}>
          {splash.cta_text && (
            <Button
              variant="primary"
              title={splash.cta_text}
              onPress={handleCtaPress}
            />
          )}
          {splash.learn_more_text && (
            <Pressable onPress={handleMoreInfoPress} style={styles.moreInfoLink}>
              <Text variant="caption" style={styles.moreInfoText}>
                {splash.learn_more_text}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 48,
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moreInfoLink: {
    padding: Spacing.sm,
  },
  moreInfoText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
})
