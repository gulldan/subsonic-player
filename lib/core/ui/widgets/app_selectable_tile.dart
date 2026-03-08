import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/theme/app_tokens.dart';

/// A hoverable tile that highlights selection state.
class AppSelectableTile extends StatefulWidget {
  /// Creates a selectable tile.
  const AppSelectableTile({
    required this.child,
    super.key,
    this.onTap,
    this.selected = false,
    this.padding = const EdgeInsets.all(12),
    this.radius = AppTokens.radiusSm,
    this.backgroundColor,
    this.borderColor,
    this.hoverColor,
    this.hoverBorderColor,
    this.selectedColor,
    this.selectedBorderColor,
  });

  /// Tile content.
  final Widget child;

  /// Callback invoked when the tile is tapped.
  final VoidCallback? onTap;

  /// Whether the tile is currently selected.
  final bool selected;

  /// Inner padding applied around [child].
  final EdgeInsetsGeometry padding;

  /// Border radius applied to the tile outline.
  final double radius;

  /// Override for the default idle background color.
  final Color? backgroundColor;

  /// Override for the default idle border color.
  final Color? borderColor;

  /// Override for the hover background color.
  final Color? hoverColor;

  /// Override for the hover border color.
  final Color? hoverBorderColor;

  /// Override for the selected background color.
  final Color? selectedColor;

  /// Override for the selected border color.
  final Color? selectedBorderColor;

  @override
  State<AppSelectableTile> createState() => _AppSelectableTileState();
}

class _AppSelectableTileState extends State<AppSelectableTile> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final backgroundColor =
        widget.backgroundColor ?? palette.surface.withValues(alpha: 0.9);
    final borderColor =
        widget.borderColor ?? palette.border.withValues(alpha: 0.86);
    final hoverColor =
        widget.hoverColor ?? palette.surfaceRaised.withValues(alpha: 0.96);
    final hoverBorderColor =
        widget.hoverBorderColor ?? palette.borderStrong.withValues(alpha: 0.9);
    final selectedColor =
        widget.selectedColor ?? palette.accent.withValues(alpha: 0.16);
    final selectedBorderColor =
        widget.selectedBorderColor ?? palette.accent.withValues(alpha: 0.56);

    final fill = widget.selected
        ? _hovered
              ? Color.alphaBlend(
                  palette.accent.withValues(alpha: 0.06),
                  selectedColor,
                )
              : selectedColor
        : _hovered
        ? hoverColor
        : backgroundColor;
    final stroke = widget.selected
        ? selectedBorderColor
        : _hovered
        ? hoverBorderColor
        : borderColor;
    final shadow = widget.selected
        ? [
            BoxShadow(
              blurRadius: 20,
              spreadRadius: -14,
              offset: const Offset(0, 10),
              color: palette.accent.withValues(alpha: 0.22),
            ),
          ]
        : _hovered
        ? [
            BoxShadow(
              blurRadius: 18,
              spreadRadius: -14,
              offset: const Offset(0, 8),
              color: Colors.black.withValues(alpha: 0.28),
            ),
          ]
        : null;

    return MouseRegion(
      cursor: widget.onTap == null
          ? MouseCursor.defer
          : SystemMouseCursors.click,
      onEnter: widget.onTap == null
          ? null
          : (_) => setState(() => _hovered = true),
      onExit: widget.onTap == null
          ? null
          : (_) => setState(() => _hovered = false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 170),
          curve: Curves.easeOutCubic,
          padding: widget.padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.radius),
            color: fill,
            border: Border.all(color: stroke),
            boxShadow: shadow,
          ),
          child: widget.child,
        ),
      ),
    );
  }
}
