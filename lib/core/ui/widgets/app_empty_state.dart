import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/theme/app_tokens.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_panel.dart';

/// Standard empty-state panel for empty lists and unavailable content.
class AppEmptyState extends StatelessWidget {
  /// Creates an empty-state panel.
  const AppEmptyState({
    required this.icon,
    required this.title,
    required this.description,
    super.key,
  });

  /// Icon shown above the text copy.
  final IconData icon;

  /// Main empty-state headline.
  final String title;

  /// Supporting explanation text.
  final String description;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460),
        child: AppPanel(
          tone: AppPanelTone.raised,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                  color: palette.surfaceAccent.withValues(alpha: 0.82),
                  border: Border.all(color: palette.borderStrong),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Icon(icon, size: 28, color: palette.accentSoft),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: palette.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: palette.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
