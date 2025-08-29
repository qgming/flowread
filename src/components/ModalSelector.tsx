import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface ModalSelectorOption {
  label: string;
  value: string;
}

interface ModalSelectorProps {
  options: ModalSelectorOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  title?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export default function ModalSelector({
  options,
  selectedValue,
  onValueChange,
  placeholder = '请选择',
  title = '选择',
}: ModalSelectorProps) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selectedOption ? theme.colors.text : theme.colors.textTertiary,
            },
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.container}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceVariant }]}>
                {title && (
                  <Text style={[styles.title, { color: theme.colors.textTertiary }]}>
                    {title}
                  </Text>
                )}
                
                <View style={[styles.optionsContainer, { backgroundColor: theme.colors.surface }]}>
                  <ScrollView style={styles.scrollView}>
                    {options.map((option, index) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.option,
                          {
                            borderBottomColor: theme.colors.divider,
                            backgroundColor: option.value === selectedValue 
                              ? theme.colors.primaryContainer 
                              : 'transparent',
                          },
                          index !== options.length - 1 && [styles.optionBorder, { borderBottomColor: theme.colors.divider }],
                        ]}
                        onPress={() => handleSelect(option.value)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: option.value === selectedValue 
                                ? theme.colors.primary 
                                : theme.colors.text,
                              fontWeight: option.value === selectedValue ? '600' : '400',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.value === selectedValue && (
                          <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
                  onPress={() => setModalVisible(false)}
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
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  arrow: {
    fontSize: 12,
  },
  modalOverlay: {
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
  optionsContainer: {
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: screenHeight * 0.5,
  },
  scrollView: {
    maxHeight: screenHeight * 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 17,
    flex: 1,
    fontWeight: '400',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
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
