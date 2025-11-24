import { ReactElement } from "react";
import { ScrollView } from "react-native";

export interface DragEndParams<T> {
  data: T[];
  from: number;
  to: number;
}

export interface RenderItemParams<T> {
  item: T;
  index: number;
  drag: () => void;
  isActive: boolean;
  [key: string]: any;
}

export interface DraggableListProps<T> {
  data: T[];
  renderItem: (params: RenderItemParams<T>) => ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  onDragEnd: (params: DragEndParams<T>) => void;
  activationDelay?: number;
  autoscrollThreshold?: number;
  autoscrollSpeed?: number;
}

export interface DragState {
  activeIndex: number | null;
  offsetY: number;
}
