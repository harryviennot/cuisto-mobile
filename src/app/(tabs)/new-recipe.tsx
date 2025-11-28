import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  StyleSheet,
  BackHandler
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Camera,
  GlobeHemisphereWest,
  Link as LinkIcon,
  Microphone,
  Pencil,
  X,
  ArrowRight,
  Images
} from 'phosphor-react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { extractionService } from '@/api/services/extraction.service';
import { SourceType } from '@/types/extraction';

type ExtractionMethod = 'image' | 'link' | 'voice' | 'text' | null;

interface LayoutInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NewRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [selectedMethod, setSelectedMethod] = useState<ExtractionMethod>(null);
  const [inputValue, setInputValue] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation State
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for measuring - Standard React Refs
  const imageCardRef = useRef<View>(null);
  const linkCardRef = useRef<View>(null);
  const voiceCardRef = useRef<View>(null);
  const textCardRef = useRef<View>(null);

  // Shared Values for Animation
  const expandProgress = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const originWidth = useSharedValue(0);
  const originHeight = useSharedValue(0);

  // --- HANDLERS ---

  const handleMethodSelect = (method: ExtractionMethod, ref: React.RefObject<View>) => {
    console.log(`[NewRecipe] Method selected: ${method}`);
    if (isAnimating) {
      console.log('[NewRecipe] Animation in progress, ignoring press');
      return;
    }

    if (ref.current) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        console.log(`[NewRecipe] Measured ${method}:`, { x, y, width, height, pageX, pageY });

        // Update shared values synchronously
        originX.value = pageX;
        originY.value = pageY;
        originWidth.value = width;
        originHeight.value = height;

        // Trigger render
        setSelectedMethod(method);
        setIsAnimating(true);

        // Start animation
        expandProgress.value = 0;
        expandProgress.value = withSpring(1, { damping: 100, stiffness: 400 }, (finished) => {
          if (finished) runOnJS(setIsAnimating)(false);
        });
      });
    } else {
      console.warn(`[NewRecipe] Ref for ${method} is null`);
    }
  };

  const handleClose = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Animate back
    expandProgress.value = withSpring(0, { damping: 100, stiffness: 400 }, (finished) => {
      if (finished) {
        runOnJS(resetState)();
        runOnJS(setIsAnimating)(false);
      }
    });
  };

  const resetState = () => {
    setSelectedMethod(null);
    setInputValue('');
    setPreviewImage(null);
  };

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (selectedMethod) {
        handleClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedMethod, isAnimating]);

  const handleImageSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPreviewImage(result.assets[0].uri);
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
      setPreviewImage(result.assets[0].uri);
    }
  };

  const handleExtract = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (selectedMethod === 'image' && previewImage) {
        const formData = new FormData();
        const filename = previewImage.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('files', {
          uri: previewImage,
          name: filename,
          type,
        } as any);

        const response = await extractionService.submitImages(formData);

        if (response && response.job_id) {
          router.push({
            pathname: "/recipe/preview",
            params: { jobId: response.job_id },
          });
          setTimeout(resetState, 500);
        }
      } else if (inputValue.trim()) {
        let sourceType = SourceType.URL;
        let payload: any = {};

        if (selectedMethod === 'link') {
          sourceType = SourceType.URL;
          payload = { source_url: inputValue };
        } else if (selectedMethod === 'text') {
          sourceType = SourceType.PASTE;
          payload = { text_content: inputValue };
        } else if (selectedMethod === 'voice') {
          sourceType = SourceType.VOICE;
          payload = { text_content: inputValue };
        }

        const response = await extractionService.submit({
          source_type: sourceType,
          ...payload,
        });

        if (response && response.id) {
          router.push({
            pathname: "/recipe/preview",
            params: { jobId: response.id },
          });
          setTimeout(resetState, 500);
        }
      }
    } catch (error: any) {
      console.error('Extraction error:', error);
      Toast.show({
        type: 'error',
        text1: 'Extraction Failed',
        text2: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ANIMATED STYLES ---

  const overlayStyle = useAnimatedStyle(() => {
    const top = interpolate(expandProgress.value, [0, 1], [originY.value, 0]);
    const left = interpolate(expandProgress.value, [0, 1], [originX.value, 0]);
    const width = interpolate(expandProgress.value, [0, 1], [originWidth.value, SCREEN_WIDTH]);
    const height = interpolate(expandProgress.value, [0, 1], [originHeight.value, SCREEN_HEIGHT]);
    const borderRadius = interpolate(expandProgress.value, [0, 1], [24, 0]);

    return {
      top,
      left,
      width,
      height,
      borderRadius,
    };
  });

  const contentOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(expandProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(expandProgress.value, [0, 1], [20, 0], Extrapolation.CLAMP) }
      ]
    };
  });

  // --- RENDER HELPERS ---

  const renderInputContent = () => {
    const isLink = selectedMethod === 'link';
    const isText = selectedMethod === 'text';
    const isImage = selectedMethod === 'image';
    const isVoice = selectedMethod === 'voice';

    const methodTitle = isLink ? "Paste Link" : isText ? "Chef's Journal" : isImage ? "Capture" : "Dictation";
    const methodSub = isLink ? "FROM THE WEB" : isText ? "MANUAL ENTRY" : isImage ? "PHOTO SOURCE" : "VOICE NOTE";

    return (
      <Animated.View style={[styles.inputContentContainer, contentOpacityStyle]}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6" style={{ marginTop: insets.top + 20 }}>
          <TouchableOpacity
            onPress={handleClose}
            className="w-10 h-10 rounded-full bg-stone-100 items-center justify-center"
          >
            <X size={20} color="#78716c" />
          </TouchableOpacity>
          <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary">
            {methodSub}
          </Text>
          <View className="w-10" />
        </View>

        <Text className="font-playfair-bold text-3xl text-foreground-heading text-center mb-8">
          {methodTitle}
        </Text>

        <View className="flex-1">
          {/* --- LINK INPUT --- */}
          {isLink && (
            <View className="bg-white rounded-[24px] p-2 flex-row items-center border border-border-light">
              <View className="w-12 h-12 rounded-[18px] bg-stone-50 items-center justify-center mr-3">
                <GlobeHemisphereWest size={24} color="#a8a29e" weight="duotone" />
              </View>
              <TextInput
                className="flex-1 h-12 text-lg text-foreground-heading font-playfair"
                placeholder="Paste URL here..."
                placeholderTextColor="#a8a29e"
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoFocus={!isAnimating} // Only autofocus after animation
              />
            </View>
          )}

          {/* --- TEXT INPUT --- */}
          {isText && (
            <View className="flex-1 bg-[#FDFBF7] rounded rounded-t-none border border-border-light relative overflow-hidden min-h-[300px]">
              <View className="absolute inset-0 pt-[31px]" pointerEvents="none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <View key={i} className="h-[1px] bg-stone-200 mt-[31px] w-full" />
                ))}
              </View>
              <View className="absolute left-12 top-0 bottom-0 w-[1px] bg-red-500/20" pointerEvents="none" />

              <TextInput
                className="flex-1 text-lg leading-8 text-foreground-heading font-playfair pt-0 pl-[60px] pr-6"
                placeholder="Start writing..."
                placeholderTextColor="#a8a29e"
                value={inputValue}
                onChangeText={setInputValue}
                multiline
                textAlignVertical="top"
                autoFocus={!isAnimating}
              />
            </View>
          )}

          {/* --- IMAGE INPUT --- */}
          {isImage && (
            <View className="flex-1 items-center">
              {previewImage ? (
                <View className="w-full aspect-[3/4] rounded-[24px] overflow-hidden bg-stone-100 mb-6 relative">
                  <Image source={{ uri: previewImage }} className="w-full h-full" />
                  <TouchableOpacity
                    onPress={() => setPreviewImage(null)}
                    className="absolute bottom-6 self-center rounded-full overflow-hidden"
                  >
                    <BlurView intensity={80} tint="light" className="px-6 py-3">
                      <Text className="text-sm font-bold text-foreground-heading">Retake Photo</Text>
                    </BlurView>
                  </TouchableOpacity>
                </View>
              ) : (
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
              )}
            </View>
          )}

          {/* --- VOICE INPUT --- */}
          {isVoice && (
            <View className="flex-1 items-center justify-center">
              <TouchableOpacity
                activeOpacity={0.8}
                className={`w-24 h-24 rounded-full items-center justify-center mb-8 ${!inputValue ? 'bg-danger shadow-lg shadow-danger/30' : 'bg-primary'
                  }`}
                onPress={() => {
                  if (!inputValue) setInputValue("To make the pasta, first boil water...");
                  else setInputValue("");
                }}
              >
                {inputValue ? (
                  <Microphone size={32} color="#fff" weight="fill" />
                ) : (
                  <View className="w-8 h-8 rounded bg-white" />
                )}
                {!inputValue && (
                  <View className="absolute inset-0 rounded-full border-2 border-danger opacity-50 scale-125" />
                )}
              </TouchableOpacity>

              <View className="max-w-[280px] min-h-[100px] items-center">
                {inputValue ? (
                  <Text className="font-playfair text-2xl text-foreground-heading text-center leading-8">"{inputValue}"</Text>
                ) : (
                  <Text className="text-base font-medium text-foreground-tertiary">Tap to start recording</Text>
                )}
              </View>
            </View>
          )}

          {/* SUBMIT ACTION */}
          <View className="mt-auto pt-8 pb-8">
            <TouchableOpacity
              onPress={handleExtract}
              disabled={(selectedMethod === 'image' && !previewImage) || (selectedMethod !== 'image' && !inputValue) || isSubmitting}
              className={`w-full h-14 bg-primary rounded-full flex-row items-center justify-center gap-3 shadow-lg shadow-primary/20 ${((selectedMethod === 'image' && !previewImage) || (selectedMethod !== 'image' && !inputValue) || isSubmitting) ? 'opacity-50' : ''
                }`}
            >
              <Text className="text-white text-sm font-bold tracking-widest uppercase">
                {isSubmitting ? 'Processing...' : 'Draft Recipe'}
              </Text>
              {!isSubmitting && <ArrowRight size={16} color="#fff" weight="bold" />}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-surface">
      {/* --- MAIN GRID CONTENT --- */}
      <Animated.View
        entering={FadeInDown.duration(700).springify()}
        className="flex-1 p-6"
        style={{ paddingTop: insets.top + 24 }}
      >
        <View className="mb-8">
          <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary mb-3">
            NEW ENTRY
          </Text>
          <Text className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1]">
            Add to your{'\n'}
            <Text className="text-primary italic">collection.</Text>
          </Text>
        </View>

        <View className="flex-1 gap-4">
          {/* HERO CARD: Photo/Camera */}
          <View
            ref={imageCardRef}
            collapsable={false}
            className="h-64 rounded-[24px] overflow-hidden bg-primary-darker relative"
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleMethodSelect('image', imageCardRef)}
              className="flex-1"
            >
              <View className="absolute inset-0">
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1495521841625-233ee87a4633?auto=format&fit=crop&q=80&w=800" }}
                  className="w-full h-full opacity-70"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
              </View>

              <View className="flex-1 justify-end p-6">
                <View className="flex-row justify-between items-end">
                  <View>
                    <BlurView intensity={30} tint="light" className="w-12 h-12 rounded-full items-center justify-center mb-3 border border-white/10 overflow-hidden">
                      <Camera size={24} color="#fff" weight="duotone" />
                    </BlurView>
                    <Text className="font-playfair-bold text-3xl text-white mb-1">Scan Dish</Text>
                    <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase">FROM PHOTO OR MENU</Text>
                  </View>
                  <View className="w-8 h-8 rounded-full border border-white/30 items-center justify-center">
                    <ArrowRight size={16} color="#fff" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* SIDEBAR: Link, Voice, Text */}
          <View className="flex-1 gap-4">

            {/* Link Card */}
            <View
              ref={linkCardRef}
              collapsable={false}
              className="bg-[#E8E6E1] rounded-[24px] overflow-hidden"
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleMethodSelect('link', linkCardRef)}
                className="p-6 min-h-[140px] justify-between"
              >
                <View className="flex-row justify-between items-start">
                  <View className="w-10 h-10 rounded-full bg-stone-900/5 items-center justify-center">
                    <LinkIcon size={20} color="#57534e" weight="duotone" />
                  </View>
                  <GlobeHemisphereWest size={64} color="#e7e5e4" weight="thin" className="absolute -right-2.5 -top-2.5 opacity-50" />
                </View>
                <View>
                  <Text className="font-playfair-bold text-xl text-foreground-heading mb-1">Import from Web</Text>
                  <Text className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase">SOCIALS • BLOGS • SITES</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bottom Split Row */}
            <View className="flex-row gap-4 h-40">
              <View
                ref={voiceCardRef}
                collapsable={false}
                className="flex-1 bg-primary rounded-[24px] overflow-hidden"
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleMethodSelect('voice', voiceCardRef)}
                  className="flex-1 p-5 justify-between"
                >
                  <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                    <Microphone size={20} color="#fff" weight="duotone" />
                  </View>
                  <View>
                    <Text className="font-playfair-bold text-lg text-white mb-0.5">Dictate</Text>
                    <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">VOICE NOTE</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View
                ref={textCardRef}
                collapsable={false}
                className="flex-1 bg-white border border-border-light rounded-[24px] overflow-hidden"
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleMethodSelect('text', textCardRef)}
                  className="flex-1 p-5 justify-between"
                >
                  <View className="w-10 h-10 rounded-full bg-stone-50 items-center justify-center">
                    <Pencil size={20} color="#3a3226" weight="duotone" />
                  </View>
                  <View>
                    <Text className="font-playfair-bold text-lg text-foreground-heading mb-0.5">Write</Text>
                    <Text className="text-foreground-tertiary text-[10px] font-bold tracking-widest uppercase">MANUAL ENTRY</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* --- EXPANDING OVERLAY --- */}
      {selectedMethod && (
        <Animated.View
          style={[
            styles.overlay,
            overlayStyle,
            { backgroundColor: '#FDFBF7' } // Surface color for input view
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {renderInputContent()}
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  inputContentContainer: {
    flex: 1,
    padding: 24,
  }
});
