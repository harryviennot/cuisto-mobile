import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Camera, Images } from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

interface ImageInputProps {
  previewImage: string | null;
  onImageSelected: (uri: string) => void;
  onClearImage: () => void;
}

export function ImageInput({ previewImage, onImageSelected, onClearImage }: ImageInputProps) {
  const handleImageSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handleCameraSelect = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Camera permission is needed to scan dishes.',
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  if (previewImage) {
    return (
      <View className="flex-1 items-center">
        <View className="w-full aspect-[3/4] rounded-[24px] overflow-hidden bg-stone-100 mb-6 relative">
          <Image source={{ uri: previewImage }} className="w-full h-full" />
          <TouchableOpacity
            onPress={onClearImage}
            className="absolute bottom-6 self-center rounded-full overflow-hidden"
          >
            <BlurView intensity={80} tint="light" className="px-6 py-3">
              <Text className="text-sm font-bold text-foreground-heading">Retake Photo</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center">
      <View className="w-full gap-4">
        <TouchableOpacity
          onPress={handleCameraSelect}
          className="w-full aspect-[3/4] rounded-[24px] border-2 border-dashed border-border-light bg-surface-overlay items-center justify-center gap-4"
        >
          <View className="w-16 h-16 rounded-full bg-white items-center justify-center shadow-sm">
            <Camera size={32} color="#334d43" weight="duotone" />
          </View>
          <Text className="font-playfair text-lg text-foreground-muted">Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleImageSelect}
          className="flex-row items-center justify-center gap-2 p-4"
        >
          <Images size={20} color="#78716c" weight="duotone" />
          <Text className="text-sm font-semibold text-foreground-muted">Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
