import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/platform_ui_scope.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_atmosphere.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_brand_mark.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_panel.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_status_banner.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:macos_ui/macos_ui.dart';

part 'login_screen_macos.dart';
part 'login_screen_material.dart';
part 'login_screen_shared.dart';

/// Sign-in screen for connecting to a Subsonic-compatible server.
class LoginScreen extends StatefulWidget {
  /// Creates the login screen.
  const LoginScreen({required this.session, super.key});

  /// Shared application session used for authentication.
  final AppSession session;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController _urlController;
  late final TextEditingController _usernameController;
  late final TextEditingController _passwordController;
  final _formKey = GlobalKey<FormState>();

  bool _rememberMe = true;
  String? _inlineValidationError;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(
      text: widget.session.profile?.baseUrl ?? 'https://demo.navidrome.org',
    );
    _usernameController = TextEditingController(
      text: widget.session.profile?.username ?? 'demo',
    );
    _passwordController = TextEditingController(
      text: widget.session.profile?.password ?? 'demo',
    );
  }

  @override
  void dispose() {
    _urlController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (PlatformUiScope.useMacos(context)) {
      final error = _validateFields();
      if (error != null) {
        setState(() {
          _inlineValidationError = error;
        });
        return;
      }
      if (_inlineValidationError != null) {
        setState(() {
          _inlineValidationError = null;
        });
      }
    } else if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    await widget.session.signIn(
      serverUrl: _urlController.text,
      username: _usernameController.text,
      password: _passwordController.text,
      rememberMe: _rememberMe,
    );
  }

  String? _validateFields() {
    if (_urlController.text.trim().isEmpty) {
      return 'Server URL is required';
    }
    if (!_urlController.text.contains('://')) {
      return 'Use full URL with protocol, for example https://...';
    }
    if (_usernameController.text.trim().isEmpty) {
      return 'Username is required';
    }
    if (_passwordController.text.trim().isEmpty) {
      return 'Password is required';
    }
    return null;
  }

  void _setRememberMe(bool value) {
    setState(() {
      _rememberMe = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    final useMacosUi = PlatformUiScope.useMacos(context);

    return ListenableBuilder(
      listenable: widget.session,
      builder: (context, child) {
        final isBusy = widget.session.isBusy;
        if (useMacosUi) {
          return _MacosLoginLayout(
            urlController: _urlController,
            usernameController: _usernameController,
            passwordController: _passwordController,
            rememberMe: _rememberMe,
            isBusy: isBusy,
            errorMessage: _inlineValidationError ?? widget.session.errorMessage,
            onRememberChanged: _setRememberMe,
            onSubmit: _submit,
          );
        }

        return _MaterialLoginLayout(
          formKey: _formKey,
          urlController: _urlController,
          usernameController: _usernameController,
          passwordController: _passwordController,
          rememberMe: _rememberMe,
          isBusy: isBusy,
          errorMessage: widget.session.errorMessage,
          onRememberChanged: _setRememberMe,
          onSubmit: _submit,
        );
      },
    );
  }
}
