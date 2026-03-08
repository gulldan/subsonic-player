import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';

/// Compact avatar-style badge derived from a user label.
class AppUserBadge extends StatelessWidget {
  /// Creates a user badge.
  const AppUserBadge({
    required this.label,
    super.key,
    this.size = 36,
    this.fillColor,
    this.borderColor,
    this.textColor,
    this.textStyle,
  });

  /// Text used to derive the displayed initial.
  final String label;

  /// Width and height of the badge.
  final double size;

  /// Optional background fill color.
  final Color? fillColor;

  /// Optional border color.
  final Color? borderColor;

  /// Optional foreground text color.
  final Color? textColor;

  /// Optional text style override.
  final TextStyle? textStyle;

  @override
  Widget build(BuildContext context) {
    final resolvedLabel = label.trim().isEmpty ? '?' : label.trim()[0];
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.32),
        color: fillColor ?? palette.accent.withValues(alpha: 0.18),
        border: Border.all(
          color: borderColor ?? palette.accent.withValues(alpha: 0.52),
        ),
      ),
      child: SizedBox(
        width: size,
        height: size,
        child: Center(
          child: Text(
            resolvedLabel.toUpperCase(),
            style:
                textStyle ??
                theme.textTheme.labelLarge?.copyWith(
                  color: textColor ?? palette.accent,
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
      ),
    );
  }
}
