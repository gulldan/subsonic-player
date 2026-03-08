import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';

/// Renders the Aurio brand block used in headers and sidebars.
class AppBrandMark extends StatelessWidget {
  /// Creates a brand mark.
  const AppBrandMark({
    super.key,
    this.title = 'Aurio',
    this.subtitle = 'Self-hosted audio for desktop',
    this.label,
    this.compact = false,
  });

  /// Main product name.
  final String title;

  /// Supporting caption shown under the title.
  final String subtitle;

  /// Optional overline label.
  final String? label;

  /// Whether to use the compact visual treatment.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);
    final emblemSize = compact ? 30.0 : 38.0;

    return Row(
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(emblemSize * 0.36),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                palette.accent.withValues(alpha: 0.42),
                palette.spotlight.withValues(alpha: 0.2),
                palette.surfaceAccent.withValues(alpha: 0.86),
              ],
            ),
            border: Border.all(
              color: palette.accent.withValues(alpha: 0.36),
            ),
            boxShadow: [
              BoxShadow(
                blurRadius: 26,
                spreadRadius: -18,
                offset: const Offset(0, 14),
                color: palette.accent.withValues(alpha: 0.26),
              ),
            ],
          ),
          child: SizedBox(
            width: emblemSize,
            height: emblemSize,
            child: Icon(
              Icons.multitrack_audio_rounded,
              color: palette.textPrimary,
              size: compact ? 17 : 20,
            ),
          ),
        ),
        SizedBox(width: compact ? 11 : 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (label != null) ...[
                Text(
                  label!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: palette.textMuted,
                    letterSpacing: 0.7,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
              ],
              Text(
                title,
                style:
                    (compact
                            ? theme.textTheme.titleMedium
                            : theme.textTheme.headlineLarge)
                        ?.copyWith(
                          fontWeight: FontWeight.w700,
                          letterSpacing: compact ? -0.24 : -0.9,
                          color: palette.textPrimary,
                        ),
              ),
              if (!compact || label != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style:
                      (compact
                              ? theme.textTheme.bodySmall
                              : theme.textTheme.bodyMedium)
                          ?.copyWith(
                            color: palette.textSecondary,
                            height: 1.24,
                          ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
