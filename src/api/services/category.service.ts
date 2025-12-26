/**
 * Category API service
 */
import { api } from "../api-client";
import type { Category } from "@/types/recipe";

interface CategoryResponse {
  id: string;
  slug: string;
  icon?: string | null;
  display_order: number;
}

export const categoryService = {
  /**
   * Get all categories
   */
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<CategoryResponse[]>("/categories");
    return response.data.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      icon: cat.icon,
      display_order: cat.display_order,
    }));
  },
};
