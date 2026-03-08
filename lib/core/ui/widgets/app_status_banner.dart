import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/theme/app_tokens.dart';

/// Inline status banner for warnings and error details.
class AppStatusBanner extends StatelessWidget {
  /// Creates a status banner.
  const AppStatusBanner({
    required this.message,
    super.key,
    this.icon = Icons.warning_amber_rounded,
  });

  /// Banner text content.
  final String message;

  /// Icon displayed before the message.
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTokens.radiusSm),
        color: palette.danger.withValues(alpha: 0.12),
        border: Border.all(color: palette.danger.withValues(alpha: 0.44)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: palette.danger),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: palette.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
