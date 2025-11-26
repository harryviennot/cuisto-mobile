import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, PaperPlaneRight, Sparkle, User, Robot } from 'phosphor-react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    Layout,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import type { Recipe, Instruction } from '@/types/recipe';

interface ChefChatProps {
    recipe: Recipe;
    currentStepIndex: number;
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: number;
}

export const ChefChat: React.FC<ChefChatProps> = ({ recipe, currentStepIndex, onClose }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            text: t('recipe.chefChat.welcome', { defaultValue: "Hi! I'm your AI Chef. I can help you with this recipe. Ask me anything about the ingredients, steps, or techniques!" }),
            timestamp: Date.now(),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const currentStep = recipe.instructions[currentStepIndex];

    const suggestions = [
        t('recipe.chefChat.suggestion1', { defaultValue: "What's the consistency?" }),
        t('recipe.chefChat.suggestion2', { defaultValue: "Can I substitute this?" }),
        t('recipe.chefChat.suggestion3', { defaultValue: "Explain this step" }),
    ];

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text.trim(),
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Mock AI Response
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: generateMockResponse(text, currentStep),
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const generateMockResponse = (query: string, _step: Instruction) => {
        const q = query.toLowerCase();
        if (q.includes('substitute')) {
            return t('recipe.chefChat.mockResponse.substitute');
        }
        if (q.includes('step') || q.includes('explain')) {
            return t('recipe.chefChat.mockResponse.stepExplanation');
        }
        if (q.includes('consistency') || q.includes('look like')) {
            return t('recipe.chefChat.mockResponse.consistency');
        }
        return t('recipe.chefChat.mockResponse.default');
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, isTyping]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <View className="flex-1 bg-black/50">
                <Pressable className="flex-1" onPress={onClose} />

                <Animated.View
                    entering={SlideInDown.springify().damping(20)}
                    exiting={SlideOutDown}
                    className="h-[85%] w-full overflow-hidden rounded-t-[32px] bg-surface-elevated"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between border-b border-border-light bg-surface-elevated px-6 py-4">
                        <View className="flex-row items-center gap-3">
                            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Sparkle size={20} color="#334d43" weight="fill" />
                            </View>
                            <View>
                                <Text className="font-playfair text-lg font-bold text-foreground-heading">
                                    {t('recipe.chefChat.title', { defaultValue: 'Chef Assistant' })}
                                </Text>
                                <Text className="text-xs text-foreground-muted">
                                    {t('recipe.chefChat.subtitle', { defaultValue: 'Powered by AI' })}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} className="rounded-full bg-surface-texture-light p-2 active:bg-surface-texture-dark">
                            <X size={20} color="#78716c" />
                        </Pressable>
                    </View>

                    {/* Messages */}
                    <ScrollView
                        ref={scrollViewRef}
                        className="flex-1 px-4 pt-4"
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        {messages.map((msg) => (
                            <Animated.View
                                key={msg.id}
                                entering={FadeIn.duration(300)}
                                layout={Layout.springify()}
                                className={`mb-4 flex-row gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <View className="mt-1 h-8 w-8 items-center justify-center rounded-full bg-primary">
                                        <Robot size={16} color="white" />
                                    </View>
                                )}

                                <View
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'rounded-tr-none bg-primary'
                                            : 'rounded-tl-none bg-surface-texture-light'
                                        }`}
                                >
                                    <Text
                                        className={`text-base leading-snug ${msg.role === 'user' ? 'text-white' : 'text-foreground-text'
                                            }`}
                                    >
                                        {msg.text}
                                    </Text>
                                </View>

                                {msg.role === 'user' && (
                                    <View className="mt-1 h-8 w-8 items-center justify-center rounded-full bg-surface-texture-dark">
                                        <User size={16} color="#78716c" />
                                    </View>
                                )}
                            </Animated.View>
                        ))}

                        {isTyping && (
                            <Animated.View entering={FadeIn} className="mb-4 flex-row gap-3">
                                <View className="mt-1 h-8 w-8 items-center justify-center rounded-full bg-primary">
                                    <Robot size={16} color="white" />
                                </View>
                                <View className="rounded-2xl rounded-tl-none bg-surface-texture-light px-4 py-3">
                                    <Text className="text-sm text-foreground-muted italic">
                                        {t('common.typing', { defaultValue: 'Thinking...' })}
                                    </Text>
                                </View>
                            </Animated.View>
                        )}
                    </ScrollView>

                    {/* Suggestions */}
                    {messages.length < 3 && (
                        <View className="px-4 pb-2">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                {suggestions.map((suggestion, idx) => (
                                    <Pressable
                                        key={idx}
                                        onPress={() => sendMessage(suggestion)}
                                        className="mr-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 active:bg-primary/10"
                                    >
                                        <Text className="text-sm font-medium text-primary">{suggestion}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Input Area */}
                    <View
                        className="border-t border-border-light bg-white px-4 py-3"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
                        <View className="flex-row items-center gap-2 rounded-full border border-border bg-surface-texture-light px-4 py-2">
                            <TextInput
                                className="flex-1 text-base text-foreground-heading"
                                placeholder={t('recipe.chefChat.placeholder', { defaultValue: 'Ask a question...' })}
                                placeholderTextColor="#a8a29e"
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={() => sendMessage(input)}
                                returnKeyType="send"
                            />
                            <Pressable
                                onPress={() => sendMessage(input)}
                                disabled={!input.trim()}
                                className={`rounded-full p-2 ${input.trim() ? 'bg-primary' : 'bg-surface-texture-dark'
                                    }`}
                            >
                                <PaperPlaneRight size={20} color={input.trim() ? 'white' : '#a8a29e'} weight="fill" />
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
};
