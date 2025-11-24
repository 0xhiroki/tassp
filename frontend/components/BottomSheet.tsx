import { ReactNode, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import Animated, { Extrapolate, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

type BottomSheetProps = {
  visible: boolean
  onClose: () => void
  children: ReactNode
  dismissDisabled?: boolean
  sheetHeight?: number
}

export function BottomSheet({ visible, onClose, children, dismissDisabled = false, sheetHeight = 380 }: BottomSheetProps) {
  const [rendered, setRendered] = useState(visible)
  const translateY = useSharedValue(1)
  const backdrop = useSharedValue(0)
  const dragOffset = useSharedValue(0)
  const closingProgress = useSharedValue(0)

  const sheetAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value * sheetHeight }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }))

  const requestClose = useMemo(
    () =>
      (startProgress = 0) => {
        if (dismissDisabled || !visible) return
        closingProgress.value = Math.min(Math.max(startProgress, 0), 1)
        onClose()
      },
    [dismissDisabled, visible, closingProgress, onClose]
  )

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        dragOffset.value = translateY.value * sheetHeight
      })
      .onChange((event) => {
        const next = Math.max(0, dragOffset.value + event.translationY)
        translateY.value = next / sheetHeight
        backdrop.value = interpolate(translateY.value, [0, 1], [1, 0.1], Extrapolate.CLAMP)
      })
      .onEnd((event) => {
        const shouldClose = event.velocityY > 900 || translateY.value > 0.35
        if (shouldClose) {
          const startProgress = translateY.value
          dragOffset.value = 0
          runOnJS(requestClose)(startProgress)
        } else {
          dragOffset.value = 0
          translateY.value = withTiming(0, { duration: 220 })
          backdrop.value = withTiming(1, { duration: 200 })
        }
      })
  }, [backdrop, dragOffset, requestClose, sheetHeight, translateY])

  const gesture = useMemo(() => panGesture.enabled(!dismissDisabled), [panGesture, dismissDisabled])

  useEffect(() => {
    if (visible) {
      setRendered(true)
      backdrop.value = 0
      translateY.value = 1
      dragOffset.value = 0
      closingProgress.value = 0
      backdrop.value = withTiming(1, { duration: 200 })
      translateY.value = withTiming(0, { duration: 220 })
    } else if (rendered) {
      const start = closingProgress.value
      translateY.value = start
      backdrop.value = Math.max(0, 1 - start)
      backdrop.value = withTiming(0, { duration: 150 })
      translateY.value = withTiming(1, { duration: 200 }, () => {
        runOnJS(setRendered)(false)
        dragOffset.value = 0
        closingProgress.value = 0
      })
    }
  }, [visible, rendered, translateY, backdrop, closingProgress, dragOffset])

  if (!rendered) return null

  const handleBackdropPress = () => {
    if (!dismissDisabled) {
      requestClose(0)
    }
  }

  return (
    <Modal visible={rendered} animationType="none" transparent onRequestClose={handleBackdropPress}>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />
        <Pressable style={styles.backdropHotspot} onPress={handleBackdropPress} disabled={dismissDisabled} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper} pointerEvents="box-none">
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
              <View style={styles.handle} />
              {children}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)'
  },
  backdropHotspot: {
    ...StyleSheet.absoluteFillObject
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: '85%'
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d4d4d4',
    marginVertical: 12
  }
})
