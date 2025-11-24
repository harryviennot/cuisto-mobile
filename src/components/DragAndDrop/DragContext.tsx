import React, { createContext, useContext, useState, useRef } from "react";
import { ScrollView } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

interface DragContextType {
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  rootScrollViewRef: React.RefObject<ScrollView | null>;
  scrollY: SharedValue<number>;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({
  children,
  rootScrollViewRef,
}: {
  children: React.ReactNode;
  rootScrollViewRef?: React.RefObject<ScrollView | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const scrollY = useSharedValue(0);
  
  // If no ref provided, create a dummy one to avoid crashes, 
  // though functionality will be limited
  const internalRef = useRef<ScrollView>(null);
  const activeRef = rootScrollViewRef || internalRef;

  return (
    <DragContext.Provider
      value={{
        isDragging,
        setIsDragging,
        rootScrollViewRef: activeRef,
        scrollY,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDragContext must be used within a DragProvider");
  }
  return context;
}
