import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/platform_ui_scope.dart';
import 'package:flutter_sonicwave/core/ui/theme/app_tokens.dart';
import 'package:macos_ui/macos_ui.dart';

/// Theme extension that carries the app's custom design palette.
@immutable
class AppThemePalette extends ThemeExtension<AppThemePalette> {
  /// Creates a custom palette for the current app brightness.
  const AppThemePalette({
    required this.background,
    required this.backgroundMid,
    required this.backgroundDeep,
    required this.sidebarSurface,
    required this.surface,
    required this.surfaceRaised,
    required this.surfaceAccent,
    required this.border,
    required this.borderStrong,
    required this.accent,
    required this.accentStrong,
    required this.accentSoft,
    required this.spotlight,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.danger,
    required this.atmosphereGradient,
    required this.panelGradient,
    required this.raisedPanelGradient,
    required this.accentPanelGradient,
    required this.emberGradient,
    required this.panelShadow,
  });

  /// Builds a palette for [brightness].
  factory AppThemePalette.fromBrightness(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    if (dark) {
      return const AppThemePalette(
        background: AppTokens.background,
        backgroundMid: AppTokens.backgroundMid,
        backgroundDeep: AppTokens.backgroundDeep,
        sidebarSurface: AppTokens.surface,
        surface: AppTokens.surface,
        surfaceRaised: AppTokens.surfaceRaised,
        surfaceAccent: AppTokens.surfaceAccent,
        border: AppTokens.border,
        borderStrong: AppTokens.borderStrong,
        accent: AppTokens.accent,
        accentStrong: AppTokens.accentStrong,
        accentSoft: AppTokens.accentSoft,
        spotlight: AppTokens.spotlight,
        textPrimary: AppTokens.textPrimary,
        textSecondary: AppTokens.textSecondary,
        textMuted: AppTokens.textMuted,
        danger: AppTokens.danger,
        atmosphereGradient: AppTokens.atmosphereGradient,
        panelGradient: AppTokens.panelGradient,
        raisedPanelGradient: AppTokens.raisedPanelGradient,
        accentPanelGradient: AppTokens.accentPanelGradient,
        emberGradient: AppTokens.emberGradient,
        panelShadow: AppTokens.panelShadow,
      );
    }

    return const AppThemePalette(
      background: AppTokens.backgroundLight,
      backgroundMid: AppTokens.backgroundLightAlt,
      backgroundDeep: AppTokens.surfaceLight,
      sidebarSurface: AppTokens.surfaceLightSidebar,
      surface: AppTokens.surfaceLight,
      surfaceRaised: AppTokens.surfaceLightRaised,
      surfaceAccent: Color(0xFFF6EBDD),
      border: AppTokens.borderLight,
      borderStrong: Color(0xFFC7B79E),
      accent: Color(0xFFAC7336),
      accentStrong: Color(0xFFC88D4D),
      accentSoft: Color(0xFFE1B77C),
      spotlight: Color(0xFF0F8781),
      textPrimary: AppTokens.textPrimaryLight,
      textSecondary: AppTokens.textSecondaryLight,
      textMuted: Color(0xFF83786B),
      danger: Color(0xFFC74D5F),
      atmosphereGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          AppTokens.backgroundLight,
          AppTokens.backgroundLightAlt,
          Color(0xFFF7EFE4),
          AppTokens.surfaceLight,
        ],
        stops: [0, 0.34, 0.72, 1],
      ),
      panelGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [AppTokens.surfaceLight, AppTokens.surfaceLightRaised],
      ),
      raisedPanelGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFFFCF8), AppTokens.surfaceLight],
      ),
      accentPanelGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFFF3E3), Color(0xFFF6E8D5)],
      ),
      emberGradient: AppTokens.emberGradient,
      panelShadow: [
        BoxShadow(
          blurRadius: 30,
          spreadRadius: -22,
          offset: Offset(0, 20),
          color: Color(0x24120A03),
        ),
      ],
    );
  }

  /// Main page background.
  final Color background;

  /// Secondary background tone for layered layouts.
  final Color backgroundMid;

  /// Deepest background tone for depth and contrast.
  final Color backgroundDeep;

  /// Sidebar and navigation surface.
  final Color sidebarSurface;

  /// Base panel and card surface.
  final Color surface;

  /// Elevated panel surface.
  final Color surfaceRaised;

  /// Accent-tinted surface for hover states.
  final Color surfaceAccent;

  /// Standard border color.
  final Color border;

  /// Higher-emphasis border color.
  final Color borderStrong;

  /// Primary action and accent color.
  final Color accent;

  /// Higher-emphasis accent for controls and states.
  final Color accentStrong;

  /// Softer accent used in decorative details.
  final Color accentSoft;

  /// Secondary highlight color.
  final Color spotlight;

  /// Highest-contrast foreground color.
  final Color textPrimary;

  /// Secondary foreground color.
  final Color textSecondary;

  /// Muted foreground color.
  final Color textMuted;

  /// Danger and validation color.
  final Color danger;

  /// Full-page gradient background.
  final LinearGradient atmosphereGradient;

  /// Default panel gradient.
  final LinearGradient panelGradient;

  /// Elevated panel gradient.
  final LinearGradient raisedPanelGradient;

  /// Accent panel gradient.
  final LinearGradient accentPanelGradient;

  /// Gradient used by brand highlights.
  final LinearGradient emberGradient;

  /// Shared shadow set used by raised panels.
  final List<BoxShadow> panelShadow;

  @override
  AppThemePalette copyWith({
    Color? background,
    Color? backgroundMid,
    Color? backgroundDeep,
    Color? sidebarSurface,
    Color? surface,
    Color? surfaceRaised,
    Color? surfaceAccent,
    Color? border,
    Color? borderStrong,
    Color? accent,
    Color? accentStrong,
    Color? accentSoft,
    Color? spotlight,
    Color? textPrimary,
    Color? textSecondary,
    Color? textMuted,
    Color? danger,
    LinearGradient? atmosphereGradient,
    LinearGradient? panelGradient,
    LinearGradient? raisedPanelGradient,
    LinearGradient? accentPanelGradient,
    LinearGradient? emberGradient,
    List<BoxShadow>? panelShadow,
  }) {
    return AppThemePalette(
      background: background ?? this.background,
      backgroundMid: backgroundMid ?? this.backgroundMid,
      backgroundDeep: backgroundDeep ?? this.backgroundDeep,
      sidebarSurface: sidebarSurface ?? this.sidebarSurface,
      surface: surface ?? this.surface,
      surfaceRaised: surfaceRaised ?? this.surfaceRaised,
      surfaceAccent: surfaceAccent ?? this.surfaceAccent,
      border: border ?? this.border,
      borderStrong: borderStrong ?? this.borderStrong,
      accent: accent ?? this.accent,
      accentStrong: accentStrong ?? this.accentStrong,
      accentSoft: accentSoft ?? this.accentSoft,
      spotlight: spotlight ?? this.spotlight,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textMuted: textMuted ?? this.textMuted,
      danger: danger ?? this.danger,
      atmosphereGradient: atmosphereGradient ?? this.atmosphereGradient,
      panelGradient: panelGradient ?? this.panelGradient,
      raisedPanelGradient: raisedPanelGradient ?? this.raisedPanelGradient,
      accentPanelGradient: accentPanelGradient ?? this.accentPanelGradient,
      emberGradient: emberGradient ?? this.emberGradient,
      panelShadow: panelShadow ?? this.panelShadow,
    );
  }

  @override
  ThemeExtension<AppThemePalette> lerp(
    covariant ThemeExtension<AppThemePalette>? other,
    double t,
  ) {
    if (other is! AppThemePalette) {
      return this;
    }

    return AppThemePalette(
      background: Color.lerp(background, other.background, t)!,
      backgroundMid: Color.lerp(backgroundMid, other.backgroundMid, t)!,
      backgroundDeep: Color.lerp(backgroundDeep, other.backgroundDeep, t)!,
      sidebarSurface: Color.lerp(sidebarSurface, other.sidebarSurface, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceRaised: Color.lerp(surfaceRaised, other.surfaceRaised, t)!,
      surfaceAccent: Color.lerp(surfaceAccent, other.surfaceAccent, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderStrong: Color.lerp(borderStrong, other.borderStrong, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentStrong: Color.lerp(accentStrong, other.accentStrong, t)!,
      accentSoft: Color.lerp(accentSoft, other.accentSoft, t)!,
      spotlight: Color.lerp(spotlight, other.spotlight, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      atmosphereGradient: LinearGradient.lerp(
        atmosphereGradient,
        other.atmosphereGradient,
        t,
      )!,
      panelGradient: LinearGradient.lerp(
        panelGradient,
        other.panelGradient,
        t,
      )!,
      raisedPanelGradient: LinearGradient.lerp(
        raisedPanelGradient,
        other.raisedPanelGradient,
        t,
      )!,
      accentPanelGradient: LinearGradient.lerp(
        accentPanelGradient,
        other.accentPanelGradient,
        t,
      )!,
      emberGradient: LinearGradient.lerp(
        emberGradient,
        other.emberGradient,
        t,
      )!,
      panelShadow:
          BoxShadow.lerpList(panelShadow, other.panelShadow, t) ?? panelShadow,
    );
  }
}

/// Centralized theme factory for Material and macOS shells.
class AppTheme {
  const AppTheme._();

  /// Seed color used to derive the Material color scheme.
  static const Color seedColor = AppTokens.accentStrong;

  /// Resolves the current custom palette from Material or macOS context.
  static AppThemePalette paletteOf(BuildContext context) {
    final materialPalette = Theme.of(context).extension<AppThemePalette>();
    if (materialPalette != null) {
      return materialPalette;
    }

    if (PlatformUiScope.useMacos(context)) {
      return AppThemePalette.fromBrightness(
        MacosTheme.of(context).brightness,
      );
    }

    return AppThemePalette.fromBrightness(Theme.of(context).brightness);
  }

  /// Builds the Material theme for [brightness].
  static ThemeData buildMaterial(Brightness brightness) {
    final palette = AppThemePalette.fromBrightness(brightness);
    final textTheme = _buildTextTheme(palette, brightness);
    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: seedColor,
          brightness: brightness,
        ).copyWith(
          primary: palette.accent,
          onPrimary: brightness == Brightness.dark
              ? const Color(0xFF1E1209)
              : Colors.white,
          secondary: palette.spotlight,
          onSecondary: brightness == Brightness.dark
              ? const Color(0xFF091614)
              : const Color(0xFF0A2624),
          error: palette.danger,
          onError: Colors.white,
          surface: palette.surface,
          onSurface: palette.textPrimary,
          outline: palette.border,
          outlineVariant: palette.borderStrong,
        );

    return ThemeData(
      useMaterial3: true,
      platform: TargetPlatform.macOS,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: palette.background,
      canvasColor: palette.surface,
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: palette.surfaceRaised.withValues(alpha: 0.56),
      visualDensity: VisualDensity.adaptivePlatformDensity,
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      extensions: <ThemeExtension<dynamic>>[palette],
      appBarTheme: AppBarTheme(
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: palette.textPrimary,
      ),
      cardTheme: CardThemeData(
        color: palette.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          side: BorderSide(color: palette.border),
        ),
      ),
      dividerColor: palette.border,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: palette.surfaceRaised.withValues(alpha: 0.72),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 15,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusSm),
          borderSide: BorderSide(color: palette.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusSm),
          borderSide: BorderSide(color: palette.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusSm),
          borderSide: BorderSide(color: palette.accent, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusSm),
          borderSide: BorderSide(color: palette.border),
        ),
        hintStyle: TextStyle(color: palette.textMuted),
        labelStyle: TextStyle(color: palette.textSecondary),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, 48),
          backgroundColor: palette.accentStrong,
          foregroundColor: colorScheme.onPrimary,
          textStyle: textTheme.labelLarge,
          elevation: 0,
          shadowColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 44),
          foregroundColor: palette.textPrimary,
          side: BorderSide(color: palette.borderStrong.withValues(alpha: 0.82)),
          backgroundColor: palette.surface.withValues(alpha: 0.42),
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: palette.textSecondary,
          textStyle: textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: palette.surface.withValues(alpha: 0.72),
        selectedColor: palette.accent,
        disabledColor: palette.surface,
        secondarySelectedColor: palette.accent,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
          side: BorderSide(color: palette.border),
        ),
        labelStyle: textTheme.bodyMedium?.copyWith(color: palette.textPrimary),
        secondaryLabelStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onPrimary,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: palette.surface.withValues(alpha: 0.92),
        indicatorColor: palette.accent.withValues(alpha: 0.18),
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(color: palette.textPrimary),
        ),
      ),
      sliderTheme: SliderThemeData(
        trackHeight: 6,
        activeTrackColor: palette.accentStrong,
        inactiveTrackColor: palette.border,
        thumbColor: palette.accentStrong,
        overlayColor: palette.accentStrong.withValues(alpha: 0.14),
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6.5),
      ),
      dividerTheme: DividerThemeData(
        color: palette.border,
        thickness: 1,
        space: 1,
      ),
      iconTheme: IconThemeData(color: palette.textSecondary),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: palette.textSecondary,
          hoverColor: palette.surfaceRaised.withValues(alpha: 0.72),
          backgroundColor: Colors.transparent,
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: palette.accent,
        linearTrackColor: palette.border,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return Colors.white;
          }
          return palette.textMuted;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return palette.accent;
          }
          return palette.surfaceRaised;
        }),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: palette.surfaceRaised.withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: palette.borderStrong),
        ),
        textStyle: TextStyle(color: palette.textPrimary),
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: palette.accent,
        selectionColor: palette.accent.withValues(alpha: 0.3),
        selectionHandleColor: palette.accent,
      ),
    );
  }

  /// Builds a macOS theme for [brightness].
  static MacosThemeData buildMacos(Brightness brightness) {
    final palette = AppThemePalette.fromBrightness(brightness);

    return MacosThemeData(
      brightness: brightness,
      accentColor: AccentColor.blue,
      primaryColor: palette.accent,
      canvasColor: palette.sidebarSurface,
      dividerColor: palette.border,
      visualDensity: VisualDensity.adaptivePlatformDensity,
    );
  }

  static TextTheme _buildTextTheme(
    AppThemePalette palette,
    Brightness brightness,
  ) {
    final base =
        (brightness == Brightness.dark
                ? Typography.material2021(platform: TargetPlatform.macOS).white
                : Typography.material2021(platform: TargetPlatform.macOS).black)
            .apply(
              bodyColor: palette.textPrimary,
              displayColor: palette.textPrimary,
            );

    return base.copyWith(
      displayLarge: base.displayLarge?.copyWith(
        fontSize: 58,
        fontWeight: FontWeight.w600,
        letterSpacing: -1.8,
        color: palette.textPrimary,
      ),
      headlineLarge: base.headlineLarge?.copyWith(
        fontSize: 44,
        fontWeight: FontWeight.w600,
        letterSpacing: -1.32,
        color: palette.textPrimary,
      ),
      headlineMedium: base.headlineMedium?.copyWith(
        fontSize: 31,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.9,
        color: palette.textPrimary,
      ),
      titleLarge: base.titleLarge?.copyWith(
        fontSize: 26,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.56,
        color: palette.textPrimary,
      ),
      titleMedium: base.titleMedium?.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.12,
        color: palette.textPrimary,
      ),
      bodyLarge: base.bodyLarge?.copyWith(
        fontSize: 15,
        height: 1.48,
        fontWeight: FontWeight.w500,
        color: palette.textPrimary,
      ),
      bodyMedium: base.bodyMedium?.copyWith(
        fontSize: 14,
        height: 1.48,
        fontWeight: FontWeight.w500,
        color: palette.textSecondary,
      ),
      bodySmall: base.bodySmall?.copyWith(
        fontSize: 12,
        height: 1.42,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.14,
        color: palette.textMuted,
      ),
      labelLarge: base.labelLarge?.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.08,
        color: palette.textPrimary,
      ),
      labelMedium: base.labelMedium?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.16,
        color: palette.textSecondary,
      ),
    );
  }
}
