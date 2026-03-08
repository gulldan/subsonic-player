import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';

/// Adaptive tone set derived from cover artwork.
@immutable
class AppArtworkTone {
  /// Creates an adaptive artwork tone set.
  const AppArtworkTone({
    required this.accent,
    required this.accentSoft,
    required this.highlight,
    required this.surface,
    required this.surfaceRaised,
    required this.border,
    required this.glow,
    required this.heroGradient,
    required this.cardGradient,
    required this.onAccent,
  });

  /// Builds a fallback tone from the app palette.
  factory AppArtworkTone.fallback(AppThemePalette palette) {
    final accent = Color.alphaBlend(
      palette.spotlight.withValues(alpha: 0.42),
      palette.accent,
    );
    return AppArtworkTone(
      accent: accent,
      accentSoft: palette.accentSoft,
      highlight: palette.spotlight,
      surface: Color.alphaBlend(
        palette.accent.withValues(alpha: 0.16),
        palette.surface,
      ),
      surfaceRaised: Color.alphaBlend(
        palette.spotlight.withValues(alpha: 0.16),
        palette.surfaceRaised,
      ),
      border: Color.alphaBlend(
        palette.accent.withValues(alpha: 0.2),
        palette.borderStrong,
      ),
      glow: accent.withValues(alpha: 0.38),
      heroGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          accent.withValues(alpha: 0.34),
          palette.surfaceAccent.withValues(alpha: 0.88),
          palette.backgroundDeep,
        ],
      ),
      cardGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          accent.withValues(alpha: 0.18),
          palette.surfaceRaised.withValues(alpha: 0.92),
          palette.surface.withValues(alpha: 0.86),
        ],
      ),
      onAccent: _foregroundFor(accent),
    );
  }

  /// Creates a tone set by blending a generated [scheme] into the app palette.
  factory AppArtworkTone.fromScheme(
    ColorScheme scheme,
    AppThemePalette palette,
  ) {
    final accent = Color.alphaBlend(
      scheme.primary.withValues(alpha: 0.72),
      palette.accent,
    );
    final accentSoft = Color.alphaBlend(
      scheme.secondary.withValues(alpha: 0.68),
      palette.accentSoft,
    );
    final highlight = Color.alphaBlend(
      scheme.tertiary.withValues(alpha: 0.72),
      palette.spotlight,
    );
    final surface = Color.alphaBlend(
      scheme.primaryContainer.withValues(alpha: 0.38),
      palette.surface,
    );
    final surfaceRaised = Color.alphaBlend(
      scheme.secondaryContainer.withValues(alpha: 0.44),
      palette.surfaceRaised,
    );
    final border = Color.alphaBlend(
      scheme.outline.withValues(alpha: 0.72),
      palette.borderStrong,
    );
    final glow = Color.alphaBlend(
      accent.withValues(alpha: 0.6),
      highlight.withValues(alpha: 0.35),
    );

    return AppArtworkTone(
      accent: accent,
      accentSoft: accentSoft,
      highlight: highlight,
      surface: surface,
      surfaceRaised: surfaceRaised,
      border: border,
      glow: glow.withValues(alpha: 0.44),
      heroGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          highlight.withValues(alpha: 0.42),
          accent.withValues(alpha: 0.36),
          surfaceRaised.withValues(alpha: 0.94),
          palette.backgroundDeep,
        ],
        stops: const [0, 0.26, 0.68, 1],
      ),
      cardGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          accent.withValues(alpha: 0.2),
          surfaceRaised.withValues(alpha: 0.94),
          surface.withValues(alpha: 0.88),
        ],
      ),
      onAccent: _foregroundFor(accent),
    );
  }

  /// Primary adaptive accent.
  final Color accent;

  /// Softer adaptive accent for badges and chips.
  final Color accentSoft;

  /// Secondary highlight.
  final Color highlight;

  /// Tinted surface used for glass panels.
  final Color surface;

  /// Stronger tinted surface used for elevated panels.
  final Color surfaceRaised;

  /// Border color matched to the current artwork.
  final Color border;

  /// Glow color used around adaptive panels.
  final Color glow;

  /// Hero gradient used by large feature surfaces.
  final Gradient heroGradient;

  /// Panel gradient used by supporting cards.
  final Gradient cardGradient;

  /// Foreground color for content placed over [accent].
  final Color onAccent;

  static Color _foregroundFor(Color color) {
    return color.computeLuminance() > 0.55 ? Colors.black : Colors.white;
  }
}

/// Signature used by [AppArtworkToneBuilder].
typedef AppArtworkToneWidgetBuilder =
    Widget Function(BuildContext context, AppArtworkTone tone);

/// Resolves adaptive color tones from artwork and caches the result.
class AppArtworkToneBuilder extends StatefulWidget {
  /// Creates an adaptive tone builder.
  const AppArtworkToneBuilder({
    required this.builder,
    super.key,
    this.artworkUrl,
  });

  /// Remote cover artwork URL used to derive colors.
  final Uri? artworkUrl;

  /// Builder that receives the current adaptive tone.
  final AppArtworkToneWidgetBuilder builder;

  @override
  State<AppArtworkToneBuilder> createState() => _AppArtworkToneBuilderState();
}

class _AppArtworkToneBuilderState extends State<AppArtworkToneBuilder> {
  static final Map<String, AppArtworkTone> _resolvedTones =
      <String, AppArtworkTone>{};
  static final Map<String, Future<AppArtworkTone>> _pendingTones =
      <String, Future<AppArtworkTone>>{};

  Future<AppArtworkTone>? _toneFuture;
  Brightness? _brightness;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final brightness = Theme.of(context).brightness;
    if (_brightness != brightness || _toneFuture == null) {
      _brightness = brightness;
      _toneFuture = _scheduleToneLoad(brightness);
    }
  }

  @override
  void didUpdateWidget(covariant AppArtworkToneBuilder oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.artworkUrl != widget.artworkUrl) {
      final brightness = _brightness ?? Theme.of(context).brightness;
      _toneFuture = _scheduleToneLoad(brightness);
    }
  }

  Future<AppArtworkTone> _scheduleToneLoad(Brightness brightness) {
    final palette = AppThemePalette.fromBrightness(brightness);
    final artworkUrl = widget.artworkUrl;
    if (artworkUrl == null) {
      return SynchronousFuture<AppArtworkTone>(
        AppArtworkTone.fallback(palette),
      );
    }

    final key = '${brightness.name}:$artworkUrl';
    final cached = _resolvedTones[key];
    if (cached != null) {
      return SynchronousFuture<AppArtworkTone>(cached);
    }

    final pending = _pendingTones[key];
    if (pending != null) {
      return pending;
    }

    final future = _resolveTone(
      artworkUrl: artworkUrl,
      brightness: brightness,
      fallbackPalette: palette,
    );
    _pendingTones[key] = future;
    return future.then((tone) {
      _resolvedTones[key] = tone;
      unawaited(_pendingTones.remove(key));
      return tone;
    });
  }

  Future<AppArtworkTone> _resolveTone({
    required Uri artworkUrl,
    required Brightness brightness,
    required AppThemePalette fallbackPalette,
  }) async {
    try {
      final scheme = await ColorScheme.fromImageProvider(
        provider: NetworkImage(artworkUrl.toString()),
        brightness: brightness,
        dynamicSchemeVariant: DynamicSchemeVariant.content,
        contrastLevel: 0.24,
      );
      return AppArtworkTone.fromScheme(scheme, fallbackPalette);
    } on Object {
      return AppArtworkTone.fallback(fallbackPalette);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fallbackTone = AppArtworkTone.fallback(AppTheme.paletteOf(context));
    final toneFuture = _toneFuture;
    if (toneFuture == null) {
      return widget.builder(context, fallbackTone);
    }

    return FutureBuilder<AppArtworkTone>(
      future: toneFuture,
      initialData: fallbackTone,
      builder: (context, snapshot) {
        return widget.builder(context, snapshot.data ?? fallbackTone);
      },
    );
  }
}
