import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/platform_ui_scope.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_atmosphere.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_panel.dart';
import 'package:macos_ui/macos_ui.dart';

/// Temporary screen shown while the app restores persisted session state.
class BootstrapScreen extends StatelessWidget {
  /// Creates the bootstrap screen.
  const BootstrapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    if (PlatformUiScope.useMacos(context)) {
      final theme = MacosTheme.of(context);
      return MacosScaffold(
        children: [
          ContentArea(
            builder: (context, _) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const ProgressCircle(radius: 12),
                    const SizedBox(height: 14),
                    Text(
                      'Restoring session...',
                      style: theme.typography.title3,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Checking saved server profile and preparing the player.',
                      style: theme.typography.footnote,
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      );
    }

    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);
    return Scaffold(
      body: AppAtmosphere(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: AppPanel(
              tone: AppPanelTone.raised,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 28,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 18),
                    Text(
                      'Restoring session...',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: palette.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Checking saved server profile and preparing the player.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: palette.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
