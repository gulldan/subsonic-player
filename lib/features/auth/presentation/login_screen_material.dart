part of 'login_screen.dart';

const _materialPromoBullets = <String>[
  'Adaptive shell for wide and compact layouts',
  'Responsive playback controls with low rebuild noise',
  'Session restore tuned for quick restarts',
];

class _MaterialLoginLayout extends StatelessWidget {
  const _MaterialLoginLayout({
    required this.formKey,
    required this.urlController,
    required this.usernameController,
    required this.passwordController,
    required this.rememberMe,
    required this.isBusy,
    required this.errorMessage,
    required this.onRememberChanged,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController urlController;
  final TextEditingController usernameController;
  final TextEditingController passwordController;
  final bool rememberMe;
  final bool isBusy;
  final String? errorMessage;
  final ValueChanged<bool> onRememberChanged;
  final Future<void> Function() onSubmit;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AppAtmosphere(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1120),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final wide = constraints.maxWidth >= 900;

                    return _ResponsiveLoginSplit(
                      wide: wide,
                      promo: const _PromoPanel(
                        eyebrow: 'LISTEN DIFFERENTLY',
                        title:
                            'Connect a server that feels like a control room.',
                        body:
                            'Fast browsing, responsive playback, and '
                            'a desktop shell that feels more like a '
                            'hi-fi instrument than an admin form.',
                        bullets: _materialPromoBullets,
                      ),
                      form: _MaterialLoginForm(
                        formKey: formKey,
                        urlController: urlController,
                        usernameController: usernameController,
                        passwordController: passwordController,
                        rememberMe: rememberMe,
                        isBusy: isBusy,
                        errorMessage: errorMessage,
                        onRememberChanged: onRememberChanged,
                        onSubmit: onSubmit,
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MaterialLoginForm extends StatelessWidget {
  const _MaterialLoginForm({
    required this.formKey,
    required this.urlController,
    required this.usernameController,
    required this.passwordController,
    required this.rememberMe,
    required this.isBusy,
    required this.errorMessage,
    required this.onRememberChanged,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController urlController;
  final TextEditingController usernameController;
  final TextEditingController passwordController;
  final bool rememberMe;
  final bool isBusy;
  final String? errorMessage;
  final ValueChanged<bool> onRememberChanged;
  final Future<void> Function() onSubmit;

  @override
  Widget build(BuildContext context) {
    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(28, 26, 28, 28),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AppBrandMark(
              compact: true,
              label: 'SERVER ACCESS',
              subtitle: 'Log in to your Subsonic server',
            ),
            const SizedBox(height: 28),
            TextFormField(
              controller: urlController,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'Server URL',
                hintText: 'https://your-subsonic-server.com',
                prefixIcon: Icon(Icons.link_rounded),
              ),
              validator: _validateServerUrl,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: usernameController,
              decoration: const InputDecoration(
                labelText: 'Username',
                prefixIcon: Icon(Icons.person_outline_rounded),
              ),
              validator: _validateRequired('Username is required'),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                prefixIcon: Icon(Icons.lock_outline_rounded),
              ),
              validator: _validateRequired('Password is required'),
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => onSubmit(),
            ),
            const SizedBox(height: 12),
            _MaterialRememberMeRow(
              rememberMe: rememberMe,
              isBusy: isBusy,
              onRememberChanged: onRememberChanged,
            ),
            if (errorMessage != null) ...[
              const SizedBox(height: 12),
              AppStatusBanner(message: errorMessage!),
            ],
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: isBusy ? null : onSubmit,
                icon: isBusy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.wifi_tethering_rounded),
                label: const Text('Connect and open player'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String? Function(String?) _validateRequired(String message) {
  return (value) {
    if (value == null || value.trim().isEmpty) {
      return message;
    }
    return null;
  };
}

String? _validateServerUrl(String? value) {
  if (value == null || value.trim().isEmpty) {
    return 'Server URL is required';
  }
  if (!value.contains('://')) {
    return 'Use full URL with protocol, for example https://...';
  }
  return null;
}
