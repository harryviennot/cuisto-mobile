import React from "react";
import { View, Text, TouchableOpacity, useWindowDimensions, Pressable } from "react-native";
import { CameraIcon, CameraPlusIcon, ImagesIcon } from "phosphor-react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { ImageUploadCard } from "../ImageUploadCard";
import type { PickedImage } from "@/hooks/useImagePicker";
import { AnimatedDropZone } from "@/components/ui/AnimatedDropZone";

type UploadState = "uploading" | "completed" | "error";

interface ImageInputProps {
  images: PickedImage[];
  uploadStates: Record<number, UploadState>;
  maxItems: number;
  onRemoveImage: (index: number) => void;
  onAddFromCamera: () => void;
  onAddFromGallery: () => void;
  isUploading: boolean;
}

export function ImageInput({
  images,
  uploadStates,
  maxItems,
  onRemoveImage,
  onAddFromCamera,
  onAddFromGallery,
  isUploading,
}: ImageInputProps) {
  const canAddMore = images.length < maxItems && !isUploading;
  const { width, height } = useWindowDimensions();

  // Detect iPad landscape (width > height and width > 700)
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) > 600;
  const isTabletLandscape = isTablet && isLandscape;

  // Empty state - show camera button and gallery option
  if (images.length === 0) {
    // For tablet landscape, constrain the empty state width
    const emptyStateMaxWidth = isTabletLandscape ? Math.min(width * 0.5, 400) : undefined;
    const emptyStateMaxHeight = isTabletLandscape ? height - 250 : undefined;

    return (
      <Animated.View className="flex-1" layout={LinearTransition.duration(200)}>
        <View className="flex-1 justify-center items-center">
          <View
            className="w-full gap-4"
            style={emptyStateMaxWidth ? { maxWidth: emptyStateMaxWidth } : undefined}
          >
            <AnimatedDropZone
              className="w-full aspect-square bg-surface-overlay p-0"
              style={emptyStateMaxHeight ? { maxHeight: emptyStateMaxHeight } : undefined}
            >
              <Pressable
                onPress={onAddFromCamera}
                className="flex-1 items-center justify-center w-full"
              >
                <View className="items-center gap-2">
                  <View className="rounded-full bg-primary/10 p-3">
                    <CameraIcon size={24} color="#334d43" weight="duotone" />
                  </View>
                  <Text className="text-xs font-medium text-foreground-secondary">Take Photo</Text>
                </View>
              </Pressable>
            </AnimatedDropZone>
          </View>
        </View>
        <Animated.View
          className="flex-row justify-center gap-4 flex-wrap py-4"
          entering={FadeIn.duration(200)}
        >
          <TouchableOpacity
            onPress={onAddFromGallery}
            className="flex-row items-center gap-2 px-4 py-3 bg-surface-overlay rounded-full"
          >
            <ImagesIcon size={20} color="#78716c" weight="duotone" />
            <Text className="text-sm font-semibold text-foreground-muted">Choose from Gallery</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  }

  // Dynamic layout based on image count
  const renderImages = () => {
    if (isTabletLandscape) {
      const imageSize = (height - 48) / Math.max(images.length, 2);
      return (
        <View className="flex-1 flex-row gap-3 justify-center items-center">
          {images.map((image, index) => (
            <Animated.View
              key={image.uri}
              style={{ width: imageSize, height: imageSize }}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
            >
              <ImageUploadCard
                image={image}
                uploadState={uploadStates[index]}
                onRemove={isUploading ? undefined : () => onRemoveImage(index)}
              />
            </Animated.View>
          ))}
        </View>
      );
    }

    // Phone/Portrait layouts - use full width
    if (images.length === 1) {
      // Single image - full width
      return (
        <Animated.View
          key={images[0].uri}
          className="w-full"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.duration(200)}
        >
          <ImageUploadCard
            image={images[0]}
            uploadState={uploadStates[0]}
            onRemove={isUploading ? undefined : () => onRemoveImage(0)}
          />
        </Animated.View>
      );
    }

    if (images.length === 2) {
      // Two images - side by side, full width
      return (
        <View className="w-full flex-row gap-3">
          {images.map((image, index) => (
            <Animated.View
              key={image.uri}
              className="flex-1 aspect-square"
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
            >
              <ImageUploadCard
                image={image}
                uploadState={uploadStates[index]}
                onRemove={isUploading ? undefined : () => onRemoveImage(index)}
              />
            </Animated.View>
          ))}
        </View>
      );
    }

    // Three images - 2 on top, 1 centered below (full width)
    return (
      <View className="w-full gap-3">
        <View className="flex-row gap-3">
          {images.slice(0, 2).map((image, index) => (
            <Animated.View
              key={image.uri}
              className="flex-1 aspect-square"
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
            >
              <ImageUploadCard
                image={image}
                uploadState={uploadStates[index]}
                onRemove={isUploading ? undefined : () => onRemoveImage(index)}
              />
            </Animated.View>
          ))}
        </View>
        <View className="flex-row justify-center">
          <Animated.View
            key={images[2].uri}
            style={{ width: (width - 48 - 12) / 2 }} // Match the width of images above (accounting for padding and gap)
            className="aspect-square"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition.duration(200)}
          >
            <ImageUploadCard
              image={images[2]}
              uploadState={uploadStates[2]}
              onRemove={isUploading ? undefined : () => onRemoveImage(2)}
            />
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View className="flex-1" layout={LinearTransition.duration(200)}>
      {/* Centered image grid */}
      <View className="flex-1 justify-center">{renderImages()}</View>

      {/* Camera and Gallery options at bottom */}
      {canAddMore && !isUploading ? (
        <Animated.View
          className="flex-row justify-center gap-4 flex-wrap py-4"
          entering={FadeIn.duration(200)}
        >
          <TouchableOpacity
            onPress={onAddFromCamera}
            className="flex-row items-center gap-2 px-4 py-3 bg-surface-overlay rounded-full"
          >
            <CameraPlusIcon size={20} color="#78716c" weight="duotone" />
            <Text className="text-sm font-semibold text-foreground-secondary">Take a picture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAddFromGallery}
            className="flex-row items-center gap-2 px-4 py-3 bg-surface-overlay rounded-full"
          >
            <ImagesIcon size={20} color="#78716c" weight="duotone" />
            <Text className="text-sm font-semibold text-foreground-secondary">
              Choose from Gallery
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View
          className="flex-row justify-center gap-6 py-4"
          entering={FadeIn.duration(200)}
        >
          <Text className="text-sm font-semibold text-foreground-secondary">
            You can only add 3 images
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}
