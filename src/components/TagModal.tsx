import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface TagModalProps {
  visible: boolean;
  onClose: () => void;
  newTag: string;
  onNewTagChange: (text: string) => void;
  onAddTag: () => void;
  isUpdatingTags: boolean;
}

export default function TagModal({
  visible,
  onClose,
  newTag,
  onNewTagChange,
  onAddTag,
  isUpdatingTags,
}: TagModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.modalBackground }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            添加标签
          </Text>
          <TextInput
            style={[styles.tagInput, { 
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.surface
            }]}
            placeholder="请输入标签"
            placeholderTextColor={theme.colors.textTertiary}
            value={newTag}
            onChangeText={onNewTagChange}
            maxLength={20}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onAddTag}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                取消
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
              onPress={onAddTag}
              disabled={!newTag.trim()}
            >
              <Text style={[styles.confirmButtonText, { color: theme.colors.onPrimary }]}>
                添加
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    marginRight: 8,
  },
  confirmButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
