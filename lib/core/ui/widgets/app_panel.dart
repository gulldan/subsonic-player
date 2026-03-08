import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/theme/app_tokens.dart';

/// Visual variants available for [AppPanel].
enum AppPanelTone {
  /// Standard panel styling.
  base,

  /// Higher emphasis panel styling.
  raised,

  /// Accent-tinted panel styling.
  accent,
}

/// Shared panel container with gradients, borders, and radius tokens.
class AppPanel extends StatelessWidget {
  /// Creates an app panel.
  const AppPanel({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.all(16),
    this.radius = AppTokens.radiusLg,
    this.tone = AppPanelTone.base,
    this.backgroundColor,
    this.borderColor,
    this.backgroundGradient,
    this.highlightGradient,
    this.boxShadow,
    this.blurSigma = 0,
  });

  /// Content displayed inside the panel.
  final Widget child;

  /// Inner padding applied to [child].
  final EdgeInsetsGeometry padding;

  /// Corner radius for the panel outline.
  final double radius;

  /// Visual emphasis style applied to the panel.
  final AppPanelTone tone;

  /// Override for the base panel fill color.
  final Color? backgroundColor;

  /// Override for the panel border color.
  final Color? borderColor;

  /// Override for the panel gradient.
  final Gradient? backgroundGradient;

  /// Override for the panel highlight gradient.
  final Gradient? highlightGradient;

  /// Override for the panel shadow stack.
  final List<BoxShadow>? boxShadow;

  /// Blur strength applied behind the panel.
  final double blurSigma;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final borderRadius = BorderRadius.circular(radius);
    final (gradient, fillColor, strokeColor, shadow) = switch (tone) {
      AppPanelTone.base => (
        palette.panelGradient,
        palette.surface.withValues(alpha: 0.74),
        palette.border.withValues(alpha: 0.7),
        palette.panelShadow,
      ),
      AppPanelTone.raised => (
        palette.raisedPanelGradient,
        palette.surfaceRaised.withValues(alpha: 0.82),
        palette.borderStrong.withValues(alpha: 0.76),
        palette.panelShadow,
      ),
      AppPanelTone.accent => (
        palette.accentPanelGradient,
        palette.surfaceAccent.withValues(alpha: 0.78),
        palette.accent.withValues(alpha: 0.34),
        [
          ...palette.panelShadow,
          BoxShadow(
            blurRadius: 30,
            spreadRadius: -18,
            offset: const Offset(0, 14),
            color: palette.accent.withValues(alpha: 0.18),
          ),
        ],
      ),
    };
    final resolvedFillColor = backgroundColor ?? fillColor;
    final resolvedBorderColor = borderColor ?? strokeColor;
    final resolvedGradient = backgroundGradient ?? gradient;
    final resolvedShadow = boxShadow ?? shadow;
    final resolvedHighlightGradient =
        highlightGradient ??
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withValues(alpha: 0.045),
            palette.accentSoft.withValues(alpha: 0.018),
            palette.spotlight.withValues(alpha: 0.01),
            Colors.transparent,
          ],
          stops: const [0, 0.18, 0.46, 1],
        );

    final panelChild = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        color: resolvedFillColor,
        gradient: resolvedGradient,
        border: Border.all(color: resolvedBorderColor),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          gradient: resolvedHighlightGradient,
        ),
        child: Padding(padding: padding, child: child),
      ),
    );

    return RepaintBoundary(
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          boxShadow: resolvedShadow,
        ),
        child: ClipRRect(
          borderRadius: borderRadius,
          child: blurSigma > 0
              ? BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: blurSigma,
                    sigmaY: blurSigma,
                  ),
                  child: panelChild,
                )
              : panelChild,
        ),
      ),
    );
  }
}
