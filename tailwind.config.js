/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand/Accent Colors
        primary: {
          DEFAULT: "#334d43", // forest-700 - Main brand green
          light: "#507768", // forest-500
          dark: "#2c4038", // forest-800
          darker: "#283730", // forest-900
        },

        text: {
          DEFAULT: "#3a3226",
          heading: "#3a3226",
          subheading: "#6b5d4a",
          body: "#78716c",
          muted: "#a8a29e",
          icon: "#5a4f3e",
        },

        // Surface/Background Colors
        surface: {
          DEFAULT: "#f4f1e8", // Main app background (paper texture)
          elevated: "#fefdfb", // Cards, modals (elevated surface)
          overlay: "#fcfaf7", // Secondary surface within cards
          texture: {
            light: "#e8dcc7", // Light texture overlay
            medium: "#d4c5a9", // Medium texture overlay
          },
        },

        // Text/Foreground Colors
        foreground: {
          DEFAULT: "#6b5d4a", // Primary text (medium brown)
          secondary: "#8b7a66", // Secondary text (light brown)
          tertiary: "#a8a29e", // Tertiary text (stone)
          heading: "#3a3226", // Headings (darkest brown)
          muted: "#78716c", // Muted text (stone-500)
          icon: "#5a4f3e", // Icon color (dark brown)
        },

        // Border Colors
        border: {
          DEFAULT: "#d4c5a9", // Default border
          light: "#e4dbc8", // Light border
          button: "#e8e3d6", //Soft light border
          dark: "#b5a082", // Dark border
          input: "#78716c", // Input borders
        },

        // Input Colors
        input: {
          background: "#fefdfb", // Input background
          text: "#3a3226", // Input text color
          placeholder: "#a8a29e", // Placeholder text
          label: "#6b5d4a", // Label text
          border: "#d4c5a9", // Input border
          "border-focus": "#334d43", // Focused border
        },

        // Interactive Element Colors
        interactive: {
          primary: "#334d43", // Primary buttons, links (forest-700)
          "primary-hover": "#3d5f52", // forest-600
          secondary: "#6b5d4a", // Secondary actions
          "secondary-hover": "#5a4f3e",
          muted: "#57534e", // Muted interactive elements (stone-600)
        },

        // State Colors
        state: {
          success: "#507768", // forest-500
          warning: "#d1c1a5", // brown-300
          error: "#c65d47", // terracotta-500 - proper error/danger color
          info: "#91b5a7", // forest-300
        },

        // Semantic Colors
        danger: {
          DEFAULT: "#c65d47", // Warm terracotta red - main danger color
          light: "#d98775", // Lighter shade for backgrounds
          dark: "#a84a36", // Darker shade for emphasis
          muted: "#e4b4a9", // Very light for subtle danger states
        },

        // Premium/Subscription Colors
        premium: {
          DEFAULT: "#c9a962", // Warm gold - Main premium color
          light: "#e0c78a", // Light gold - Premium card background
          dark: "#a68b45", // Dark gold - Pressed/hover state
          foreground: "#1c1917", // Dark text on premium backgrounds (stone-900)
          muted: "#f5ecd4", // Very light gold - Subtle premium hints
        },

        // Full color palettes (for granular control)
        forest: {
          50: "#f0f5f3",
          100: "#dce8e3",
          200: "#b9d1c7",
          300: "#91b5a7",
          400: "#6a9585",
          500: "#507768",
          600: "#3d5f52",
          700: "#334d43",
          800: "#2c4038",
          900: "#283730",
          950: "#14201c",
        },
        brown: {
          50: "#f9f7f4",
          100: "#f1ebe3",
          200: "#e4dbc8",
          300: "#d1c1a5",
          400: "#b5a082",
          500: "#8b7a66",
          600: "#6b5d4a",
          700: "#5a4f3e",
          800: "#3a3226",
          900: "#2d2720",
        },
        stone: {
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
        },
        terracotta: {
          50: "#fdf5f3",
          100: "#fae8e3",
          200: "#f5d0c7",
          300: "#e4b4a9",
          400: "#d98775",
          500: "#c65d47", // Main danger color
          600: "#a84a36",
          700: "#8a3d2d",
          800: "#6d3224",
          900: "#4f251b",
        },
      },
      fontFamily: {
        playfair: ["PlayfairDisplay_400Regular"],
        "playfair-bold": ["PlayfairDisplay_700Bold"],
        "playfair-italic": ["PlayfairDisplay_400Regular_Italic"],
      },
    },
  },
  plugins: [],
};
