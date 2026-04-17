export const theme = {
    colors: {
        primary: '#006C70',
        onPrimary: '#FFFFFF',
        primaryContainer: '#97F0F4',
        onPrimaryContainer: '#002022',
        secondary: '#4A6267', // Muted Teal
        onSecondary: '#FFFFFF',
        secondaryContainer: '#CDE7EC',
        onSecondaryContainer: '#051F23',
        tertiary: '#4D5D92', // Deep Purple/Blue for accents
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#DDE1FF',
        onTertiaryContainer: '#06164B',
        error: '#BA1A1A',
        onError: '#FFFFFF',
        errorContainer: '#FFDAD6',
        onErrorContainer: '#410002',
        background: '#FBFDFD',
        onBackground: '#191C1D',
        surface: '#FBFDFD',
        onSurface: '#191C1D',
        surfaceVariant: '#DAE4E6',
        onSurfaceVariant: '#3F484A',
        outline: '#6F797A',
        outlineVariant: '#BFC8CA',
        shadow: '#000000',
        scrim: '#000000',
        inverseSurface: '#2E3132',
        inverseOnSurface: '#EFF1F1',
        inversePrimary: '#4CD9DE',
    },
    typography: {
        displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
        displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
        displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
        headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '400' as const },
        headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '400' as const },
        headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '400' as const },
        titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const }, // App Bar Title
        titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
        titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
        bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const }, // Body text
        bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
        bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
        labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const }, // Button text
        labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
        labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
    },
    shapes: {
        small: 8,
        medium: 12,
        large: 16,
        extraLarge: 28,
        full: 9999,
    },
    elevation: {
        level0: 0,
        level1: 1,
        level2: 3,
        level3: 6,
        level4: 8,
        level5: 12,
    },
};

export default function ThemeRoute() {
    return null;
}
