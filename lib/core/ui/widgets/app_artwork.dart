import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/theme/app_tokens.dart';

/// Displays square cover artwork with a branded fallback.
class AppArtwork extends StatelessWidget {
  /// Creates an artwork widget.
  const AppArtwork({
    required this.url,
    super.key,
    this.cacheDimension,
    this.iconSize = 42,
    this.borderRadius = AppTokens.radiusMd,
  });

  /// Remote artwork URL.
  final Uri? url;

  /// Logical artwork size used to derive the network cache width.
  final double? cacheDimension;

  /// Size of the fallback icon.
  final double iconSize;

  /// Border radius applied to the artwork frame.
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final cacheWidth = cacheDimension == null
        ? null
        : (cacheDimension! * MediaQuery.devicePixelRatioOf(context)).round();

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: palette.border.withValues(alpha: 0.76)),
        boxShadow: [
          BoxShadow(
            blurRadius: 30,
            spreadRadius: -18,
            offset: const Offset(0, 14),
            color: Colors.black.withValues(alpha: 0.32),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: AspectRatio(
          aspectRatio: 1,
          child: url == null
              ? DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        palette.surfaceAccent.withValues(alpha: 0.92),
                        palette.surfaceRaised.withValues(alpha: 0.92),
                      ],
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.album_rounded,
                      size: iconSize,
                      color: palette.accentSoft,
                    ),
                  ),
                )
              : Image.network(
                  url.toString(),
                  fit: BoxFit.cover,
                  cacheWidth: cacheWidth,
                  filterQuality: FilterQuality.low,
                  gaplessPlayback: true,
                  frameBuilder:
                      (context, child, frame, wasSynchronouslyLoaded) {
                        return Stack(
                          fit: StackFit.expand,
                          children: [
                            child,
                            DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.white.withValues(alpha: 0.06),
                                    Colors.transparent,
                                    Colors.black.withValues(alpha: 0.06),
                                  ],
                                  stops: const [0, 0.24, 1],
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                  errorBuilder: (context, error, stackTrace) {
                    return DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            palette.surfaceAccent.withValues(alpha: 0.9),
                            palette.surface.withValues(alpha: 0.9),
                          ],
                        ),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.broken_image_rounded,
                          size: iconSize - 8,
                          color: palette.textSecondary,
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
