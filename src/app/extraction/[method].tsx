import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ArrowRight } from 'phosphor-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { extractionService } from '@/api/services/extraction.service';
import { SourceType } from '@/types/extraction';
import {
  LinkInput,
  TextInputMethod,
  ImageInput,
  VoiceInput,
} from '@/components/extraction/methods';

type Method = 'link' | 'text' | 'image' | 'voice';

const METHOD_CONFIG = {
  link: {
    title: 'Paste Link',
    subtitle: 'FROM THE WEB',
  },
  text: {
    title: "Chef's Journal",
    subtitle: 'MANUAL ENTRY',
  },
  image: {
    title: 'Capture',
    subtitle: 'PHOTO SOURCE',
  },
  voice: {
    title: 'Dictation',
    subtitle: 'VOICE NOTE',
  },
};

export default function ExtractionScreen() {
  const { method } = useLocalSearchParams<{ method: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Validate method
  const validMethod = (method && ['link', 'text', 'image', 'voice'].includes(method)
    ? method
    : 'link') as Method;

  const config = METHOD_CONFIG[validMethod];

  // State
  const [inputValue, setInputValue] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => router.back();

  const handleExtract = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (validMethod === 'image' && previewImage) {
        const formData = new FormData();
        const filename = previewImage.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('files', {
          uri: previewImage,
          name: filename,
          type,
        } as unknown as Blob);

        const response = await extractionService.submitImages(formData);

        if (response && response.job_id) {
          router.replace({
            pathname: "/recipe/preview",
            params: { jobId: response.job_id },
          });
        }
      } else if (inputValue.trim()) {
        let sourceType = SourceType.URL;
        let payload: Record<string, string> = {};

        if (validMethod === 'link') {
          sourceType = SourceType.URL;
          payload = { source_url: inputValue };
        } else if (validMethod === 'text') {
          sourceType = SourceType.PASTE;
          payload = { text_content: inputValue };
        } else if (validMethod === 'voice') {
          sourceType = SourceType.VOICE;
          payload = { text_content: inputValue };
        }

        const response = await extractionService.submit({
          source_type: sourceType,
          ...payload,
        });

        if (response && response.id) {
          router.replace({
            pathname: "/recipe/preview",
            params: { jobId: response.id },
          });
        }
      }
    } catch (error) {
      console.error('Extraction error:', error);
      Toast.show({
        type: 'error',
        text1: 'Extraction Failed',
        text2: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = validMethod === 'image' ? !!previewImage : !!inputValue.trim();

  const renderMethodInput = () => {
    switch (validMethod) {
      case 'link':
        return <LinkInput value={inputValue} onChangeText={setInputValue} />;
      case 'text':
        return <TextInputMethod value={inputValue} onChangeText={setInputValue} />;
      case 'image':
        return (
          <ImageInput
            previewImage={previewImage}
            onImageSelected={setPreviewImage}
            onClearImage={() => setPreviewImage(null)}
          />
        );
      case 'voice':
        return <VoiceInput value={inputValue} onChangeText={setInputValue} />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-[#FDFBF7]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View
          entering={FadeIn.delay(100).duration(300)}
          className="flex-1 px-6"
        >
          {/* Header */}
          <View
            className="flex-row justify-between items-center mb-6"
            style={{ marginTop: insets.top + 20 }}
          >
            <TouchableOpacity
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-stone-100 items-center justify-center"
            >
              <X size={20} color="#78716c" />
            </TouchableOpacity>
            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary">
              {config.subtitle}
            </Text>
            <View className="w-10" />
          </View>

          <Text className="font-playfair-bold text-3xl text-foreground-heading text-center mb-8">
            {config.title}
          </Text>

          <View className="flex-1">
            {renderMethodInput()}

            {/* SUBMIT ACTION */}
            <View className="mt-auto pt-8 pb-8">
              <TouchableOpacity
                onPress={handleExtract}
                disabled={!canSubmit || isSubmitting}
                className={`w-full h-14 bg-primary rounded-full flex-row items-center justify-center gap-3 shadow-lg shadow-primary/20 ${
                  (!canSubmit || isSubmitting) ? 'opacity-50' : ''
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
      </KeyboardAvoidingView>
    </View>
  );
}
