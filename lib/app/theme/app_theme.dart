import 'package:flutter/material.dart';

class AppTheme {
  const AppTheme._();

  static const Color background = Color(0xFF112F48);
  static const Color surface = Color(0xFF274768);
  static const Color accent = Color(0xFF2E557B);
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFFB7C4D3);

  static ThemeData build() {
    const colorScheme = ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xFF77A9D9),
      onPrimary: Colors.white,
      secondary: Color(0xFF5E89B1),
      onSecondary: Colors.white,
      error: Color(0xFFF25C54),
      onError: Colors.white,
      surface: surface,
      onSurface: textPrimary,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: background,
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 44,
          fontWeight: FontWeight.w700,
          color: textPrimary,
        ),
        headlineMedium: TextStyle(
          fontSize: 34,
          fontWeight: FontWeight.w700,
          color: textPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: textPrimary,
        ),
        titleMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        bodyLarge: TextStyle(fontSize: 18, color: textPrimary),
        bodyMedium: TextStyle(fontSize: 16, color: textSecondary),
        labelLarge: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1C3D5D),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF77A9D9), width: 1.5),
        ),
        labelStyle: const TextStyle(color: textSecondary),
        hintStyle: const TextStyle(color: textSecondary),
      ),
    );
  }
}
