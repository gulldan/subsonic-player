import 'package:flutter/material.dart';

/// Shared design tokens used across Material and macOS surfaces.
class AppTokens {
  const AppTokens._();

  /// Deep dark background.
  static const Color background = Color(0xFF050608);

  /// Mid-tone dark background.
  static const Color backgroundMid = Color(0xFF0A0D14);

  /// Strongest dark background used for depth.
  static const Color backgroundDeep = Color(0xFF020304);

  /// Base dark surface color.
  static const Color surface = Color(0xFF121621);

  /// Elevated dark surface color.
  static const Color surfaceRaised = Color(0xFF181D2B);

  /// Accent-tinted dark surface color.
  static const Color surfaceAccent = Color(0xFF23283A);

  /// Base dark border color.
  static const Color border = Color(0xFF2B3143);

  /// Strong dark border color.
  static const Color borderStrong = Color(0xFF495169);

  /// Primary accent color.
  static const Color accent = Color(0xFFF0BE88);

  /// Strong primary accent color.
  static const Color accentStrong = Color(0xFFFFD7AA);

  /// Soft primary accent color.
  static const Color accentSoft = Color(0xFFFFE8CB);

  /// Secondary highlight color.
  static const Color spotlight = Color(0xFF83E7DF);

  /// Primary text color on dark backgrounds.
  static const Color textPrimary = Color(0xFFF8F1E7);

  /// Secondary text color on dark backgrounds.
  static const Color textSecondary = Color(0xFFD7D0C5);

  /// Muted text color on dark backgrounds.
  static const Color textMuted = Color(0xFF9C958A);

  /// Error and warning color.
  static const Color danger = Color(0xFFFF6F86);

  /// Base light background.
  static const Color backgroundLight = Color(0xFFF7F0E7);

  /// Alternate light background.
  static const Color backgroundLightAlt = Color(0xFFEDE4D7);

  /// Base light surface color.
  static const Color surfaceLight = Color(0xFFFCF8F1);

  /// Elevated light surface color.
  static const Color surfaceLightRaised = Color(0xFFF4ECE2);

  /// Sidebar light surface color.
  static const Color surfaceLightSidebar = Color(0xFFF0E8DD);

  /// Base light border color.
  static const Color borderLight = Color(0xFFD8CCBD);

  /// Primary text color on light backgrounds.
  static const Color textPrimaryLight = Color(0xFF171411);

  /// Secondary text color on light backgrounds.
  static const Color textSecondaryLight = Color(0xFF60574B);

  /// Extra-small corner radius.
  static const double radiusXs = 12;

  /// Small corner radius.
  static const double radiusSm = 14;

  /// Medium corner radius.
  static const double radiusMd = 16;

  /// Large corner radius.
  static const double radiusLg = 22;

  /// Extra-large corner radius.
  static const double radiusXl = 28;

  /// Full-page atmospheric gradient.
  static const LinearGradient atmosphereGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF06070B),
      Color(0xFF0B0E14),
      Color(0xFF161119),
      Color(0xFF020304),
    ],
    stops: [0, 0.34, 0.74, 1],
  );

  /// Default panel gradient.
  static const LinearGradient panelGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xD8161A23), Color(0xC8151924)],
  );

  /// Elevated panel gradient.
  static const LinearGradient raisedPanelGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xE0202431), Color(0xCC141925)],
  );

  /// Accent panel gradient.
  static const LinearGradient accentPanelGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xD82B2532), Color(0xC4171E2C)],
  );

  /// Gradient used by branded highlights.
  static const LinearGradient emberGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFECD2), Color(0xFFF0BE88), Color(0xFFD28847)],
  );

  /// Shared shadow used by floating panels.
  static const List<BoxShadow> panelShadow = [
    BoxShadow(
      blurRadius: 72,
      spreadRadius: -52,
      offset: Offset(0, 30),
      color: Color(0x90000104),
    ),
    BoxShadow(
      blurRadius: 26,
      spreadRadius: -18,
      offset: Offset(0, 14),
      color: Color(0x321D2230),
    ),
  ];
}
