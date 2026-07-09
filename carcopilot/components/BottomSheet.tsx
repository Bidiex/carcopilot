import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Text } from '@/components/Typography';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const panY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: 1000, // Slide down out of screen
    duration: 300,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) {
          closeAnim.start(() => {
            onClose();
            panY.setValue(0);
          });
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  // Reset panY when modal opens
  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          <Animated.View style={[styles.content, { transform: [{ translateY: panY }] }]}>
            <View {...panResponder.panHandlers}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>
              <View style={styles.header}>
                <Text variant="heading2" color="gray900" weight="700">
                  {title}
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.gray900} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2, // Extra space for mobile keyboards
  },
});
