import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

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
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheet}>
              {title && (
                <Text style={styles.title}>{title}</Text>
              )}
              
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      index === 0 && styles.firstActionButton,
                      index === actions.length - 1 && styles.lastActionButton,
                    ]}
                    onPress={() => {
                      action.onPress();
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        action.isDestructive && styles.destructiveText,
                      ]}
                    >
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>取消</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'transparent',
  },
  sheet: {
    backgroundColor: '#f2f2f7',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    marginTop: 'auto',
  },
  title: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  firstActionButton: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastActionButton: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionText: {
    fontSize: 17,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '400',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
