part of 'login_screen.dart';

const _macosPromoBullets = <String>[
  'Native macOS shell with adaptive content panes',
  'Artwork and panels styled from shared tokens',
  'Design primitives now live outside feature code',
];

class _MacosLoginLayout extends StatelessWidget {
  const _MacosLoginLayout({
    required this.urlController,
    required this.usernameController,
    required this.passwordController,
    required this.rememberMe,
    required this.isBusy,
    required this.errorMessage,
    required this.onRememberChanged,
    required this.onSubmit,
  });

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
    return AppAtmosphere(
      child: DefaultTextStyle(
        style: MacosTheme.of(context).typography.body,
        child: MacosScaffold(
          backgroundColor: Colors.transparent,
          children: [
            ContentArea(
              builder: (context, scrollController) {
                return Center(
                  child: SingleChildScrollView(
                    controller: scrollController,
                    padding: const EdgeInsets.all(24),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1080),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final wide = constraints.maxWidth >= 920;

                          return _ResponsiveLoginSplit(
                            wide: wide,
                            promo: const _PromoPanel(
                              eyebrow: 'NATIVE DESKTOP',
                              title:
                                  'Subsonic access with a calmer, sharper '
                                  'shell.',
                              body:
                                  'The layout is tuned for keyboard, mouse, '
                                  'wide screens, and fast navigation '
                                  'instead of looking like a stretched '
                                  'phone app.',
                              bullets: _macosPromoBullets,
                              compactBrand: false,
                            ),
                            form: _MacosLoginForm(
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
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _MacosLoginForm extends StatelessWidget {
  const _MacosLoginForm({
    required this.urlController,
    required this.usernameController,
    required this.passwordController,
    required this.rememberMe,
    required this.isBusy,
    required this.errorMessage,
    required this.onRememberChanged,
    required this.onSubmit,
  });

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
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppBrandMark(
            compact: true,
            label: 'SERVER ACCESS',
            subtitle: 'Log in to your Subsonic server',
          ),
          const SizedBox(height: 24),
          _MacosFieldBlock(
            label: 'Server URL',
            child: MacosTextField(
              controller: urlController,
              placeholder: 'https://your-subsonic-server.com',
              prefix: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Icon(CupertinoIcons.link),
              ),
              onSubmitted: (_) => onSubmit(),
            ),
          ),
          const SizedBox(height: 12),
          _MacosFieldBlock(
            label: 'Username',
            child: MacosTextField(
              controller: usernameController,
              placeholder: 'Username',
              prefix: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Icon(CupertinoIcons.person),
              ),
              onSubmitted: (_) => onSubmit(),
            ),
          ),
          const SizedBox(height: 12),
          _MacosFieldBlock(
            label: 'Password',
            child: MacosTextField(
              controller: passwordController,
              placeholder: 'Password',
              obscureText: true,
              prefix: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Icon(CupertinoIcons.lock),
              ),
              onSubmitted: (_) => onSubmit(),
            ),
          ),
          const SizedBox(height: 14),
          _MacosRememberMeRow(
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
            child: PushButton(
              controlSize: ControlSize.large,
              onPressed: isBusy ? null : onSubmit,
              child: isBusy
                  ? const ProgressCircle(radius: 8)
                  : const Text('Connect and open player'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MacosFieldBlock extends StatelessWidget {
  const _MacosFieldBlock({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: MacosTheme.of(
            context,
          ).typography.footnote.copyWith(color: palette.textSecondary),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
