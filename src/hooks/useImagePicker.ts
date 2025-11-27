/**
 * Image picker hook with camera and gallery support
 */
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export type ImagePickerSource = "camera" | "gallery";

export interface PickedImage {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export function useImagePicker() {
  const [isPickingImage, setIsPickingImage] = useState(false);

  const requestPermissions = async (source: ImagePickerSource): Promise<boolean> => {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is required to take photos.");
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select images."
        );
        return false;
      }
    }
    return true;
  };

  const pickImages = async (
    source: ImagePickerSource,
    options?: {
      maxImages?: number;
      allowsMultipleSelection?: boolean;
    }
  ): Promise<PickedImage[] | null> => {
    setIsPickingImage(true);

    try {
      const hasPermission = await requestPermissions(source);
      if (!hasPermission) {
        return null;
      }

      let result: ImagePicker.ImagePickerResult;

      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          allowsMultipleSelection: options?.allowsMultipleSelection ?? true,
          quality: 0.8,
          selectionLimit: options?.maxImages ?? 5,
        });
      }

      if (result.canceled) {
        return null;
      }

      const images: PickedImage[] = result.assets.map((asset, index) => {
        const filename = asset.uri.split("/").pop() || `image-${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        return {
          uri: asset.uri,
          type,
          name: filename,
          size: asset.fileSize,
        };
      });

      return images;
    } catch (error) {
      console.error("Error picking images:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick images. Please try again.",
      });
      return null;
    } finally {
      setIsPickingImage(false);
    }
  };

  const pickSingleImage = async (source: ImagePickerSource): Promise<PickedImage | null> => {
    const images = await pickImages(source, {
      maxImages: 1,
      allowsMultipleSelection: false,
    });
    return images?.[0] ?? null;
  };

  return {
    pickImages,
    pickSingleImage,
    isPickingImage,
  };
}
