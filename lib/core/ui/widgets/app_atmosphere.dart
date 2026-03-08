import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';

/// Paints the shared atmospheric background used across the app.
class AppAtmosphere extends StatelessWidget {
  /// Creates the atmospheric background wrapper.
  const AppAtmosphere({
    required this.child,
    super.key,
    this.padding = EdgeInsets.zero,
  });

  /// Main content painted above the background layers.
  final Widget child;

  /// Extra padding applied around [child].
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    return DecoratedBox(
      decoration: BoxDecoration(gradient: palette.atmosphereGradient),
      child: Stack(
        fit: StackFit.expand,
        children: [
          _AtmosphereGlow(
            alignment: const Alignment(-1.04, -1.08),
            size: 640,
            colors: [
              palette.accent.withValues(alpha: 0.18),
              palette.accentSoft.withValues(alpha: 0.1),
              palette.accent.withValues(alpha: 0),
            ],
          ),
          _AtmosphereGlow(
            alignment: const Alignment(1.02, -0.92),
            size: 520,
            colors: [
              palette.spotlight.withValues(alpha: 0.16),
              palette.spotlight.withValues(alpha: 0),
            ],
          ),
          _AtmosphereGlow(
            alignment: const Alignment(0.66, 0.98),
            size: 720,
            colors: [
              palette.accent.withValues(alpha: 0.07),
              palette.accentSoft.withValues(alpha: 0),
            ],
          ),
          _AtmosphereGlow(
            alignment: const Alignment(-0.72, 0.82),
            size: 500,
            colors: [
              palette.spotlight.withValues(alpha: 0.08),
              palette.spotlight.withValues(alpha: 0),
            ],
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: const Alignment(-0.8, -1),
                    end: const Alignment(0.9, 1),
                    colors: [
                      palette.accent.withValues(alpha: 0.06),
                      Colors.transparent,
                      palette.spotlight.withValues(alpha: 0.04),
                      Colors.transparent,
                    ],
                    stops: const [0, 0.22, 0.72, 1],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withValues(alpha: 0.05),
                      palette.accentSoft.withValues(alpha: 0.02),
                      Colors.transparent,
                      palette.backgroundDeep.withValues(alpha: 0.3),
                    ],
                    stops: const [0, 0.18, 0.48, 1],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: RepaintBoundary(
                child: _AtmosphereNoise(palette: palette),
              ),
            ),
          ),
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

class _AtmosphereGlow extends StatelessWidget {
  const _AtmosphereGlow({
    required this.alignment,
    required this.size,
    required this.colors,
  });

  final Alignment alignment;
  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: IgnorePointer(
        child: DecoratedBox(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: colors),
          ),
          child: SizedBox(width: size, height: size),
        ),
      ),
    );
  }
}

class _AtmosphereNoise extends StatelessWidget {
  const _AtmosphereNoise({required this.palette});

  final AppThemePalette palette;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _AtmosphereNoisePainter(palette: palette));
  }
}

class _AtmosphereNoisePainter extends CustomPainter {
  _AtmosphereNoisePainter({required this.palette});

  final AppThemePalette palette;

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 20 || size.height <= 20) {
      return;
    }

    final speckPaint = Paint()..style = PaintingStyle.fill;
    const cellSize = 28.0;

    for (var y = 0.0; y < size.height; y += cellSize) {
      for (var x = 0.0; x < size.width; x += cellSize) {
        final seed = math.sin((x * 0.018) + (y * 0.024)) * 43758.5453;
        final value = seed - seed.floorToDouble();
        if (value < 0.9) {
          continue;
        }
        speckPaint.color = palette.textPrimary.withValues(
          alpha: 0.005 + ((value - 0.9) * 0.03),
        );
        canvas.drawCircle(
          Offset(x + (value * 6), y + ((1 - value) * 6)),
          0.4 + ((value - 0.9) * 1.2),
          speckPaint,
        );
      }
    }

    final vignettePaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.transparent,
          Colors.transparent,
          palette.backgroundDeep.withValues(alpha: 0.52),
        ],
        stops: const [0, 0.35, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, vignettePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
}
