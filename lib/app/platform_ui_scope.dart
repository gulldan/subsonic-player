import 'package:flutter/widgets.dart';

/// Exposes the active desktop UI mode to the widget tree.
class PlatformUiScope extends InheritedWidget {
  /// Creates a scope that advertises whether the macOS-specific UI is active.
  const PlatformUiScope({
    required this.useMacosUi,
    required super.child,
    super.key,
  });

  /// Whether descendants should render the macOS-specific interface.
  final bool useMacosUi;

  /// Returns whether the current subtree should render the macOS UI variant.
  static bool useMacos(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<PlatformUiScope>();
    return scope?.useMacosUi ?? false;
  }

  @override
  bool updateShouldNotify(PlatformUiScope oldWidget) {
    return oldWidget.useMacosUi != useMacosUi;
  }
}
