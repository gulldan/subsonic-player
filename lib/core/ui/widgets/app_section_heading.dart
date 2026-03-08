import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';

/// Standard heading block for screen and panel sections.
class AppSectionHeading extends StatelessWidget {
  /// Creates a section heading.
  const AppSectionHeading({
    required this.title,
    required this.subtitle,
    super.key,
    this.eyebrow,
  });

  /// Primary heading text.
  final String title;

  /// Supporting subheading text.
  final String subtitle;

  /// Optional overline label.
  final String? eyebrow;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (eyebrow != null) ...[
          Text(
            eyebrow!,
            style: theme.textTheme.labelLarge?.copyWith(
              color: palette.accentSoft,
              letterSpacing: 1.4,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
        ],
        Text(
          title,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: palette.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: palette.textSecondary,
          ),
        ),
      ],
    );
  }
}
