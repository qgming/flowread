import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ActionItem {
  title: string;
  onPress: () => void;
  isDestructive?: boolean;
}

interface BottomActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: ActionItem[];
  title?: string;
}

export default function BottomActionSheet({
  visible,
  onClose,
  actions,
  title,
}: BottomActionSheetProps) {
  const { theme } = useTheme();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceVariant }]}>
              {title && (
                <Text style={[styles.title, { color: theme.colors.textTertiary }]}>
                  {title}
                </Text>
              )}
              
              <View style={[styles.actionsContainer, { backgroundColor: theme.colors.surface }]}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      index !== actions.length - 1 && [styles.actionButtonBorder, { borderBottomColor: theme.colors.border }],
                    ]}
                    onPress={() => {
                      action.onPress();
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        { color: action.isDestructive ? theme.colors.error : theme.colors.primary },
                      ]}
                    >
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: theme.colors.primary }]}>
                  取消
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'transparent',
  },
  sheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    marginTop: 'auto',
  },
  title: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '400',
  },
  cancelButton: {
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '600',
  },
});
