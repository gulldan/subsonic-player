part of 'login_screen.dart';

class _ResponsiveLoginSplit extends StatelessWidget {
  const _ResponsiveLoginSplit({
    required this.wide,
    required this.promo,
    required this.form,
  });

  final bool wide;
  final Widget promo;
  final Widget form;

  @override
  Widget build(BuildContext context) {
    if (wide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 11, child: promo),
          const SizedBox(width: 18),
          Expanded(flex: 10, child: form),
        ],
      );
    }

    return Column(children: [promo, const SizedBox(height: 16), form]);
  }
}

class _PromoPanel extends StatelessWidget {
  const _PromoPanel({
    required this.eyebrow,
    required this.title,
    required this.body,
    required this.bullets,
    this.compactBrand = true,
  });

  final String eyebrow;
  final String title;
  final String body;
  final List<String> bullets;
  final bool compactBrand;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return AppPanel(
      tone: AppPanelTone.accent,
      padding: const EdgeInsets.fromLTRB(26, 26, 26, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppBrandMark(
            compact: compactBrand,
            label: eyebrow,
            subtitle: 'Focused Subsonic playback for desktop-first listening.',
          ),
          const SizedBox(height: 28),
          Text(
            title,
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: palette.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: palette.textPrimary,
            ),
          ),
          const SizedBox(height: 22),
          ...bullets.map(
            (item) => _PromoBullet(item: item, gradient: palette.emberGradient),
          ),
        ],
      ),
    );
  }
}

class _PromoBullet extends StatelessWidget {
  const _PromoBullet({required this.item, required this.gradient});

  final String item;
  final Gradient gradient;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 10,
            height: 10,
            margin: const EdgeInsets.only(top: 5),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: gradient,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              item,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: palette.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MaterialRememberMeRow extends StatelessWidget {
  const _MaterialRememberMeRow({
    required this.rememberMe,
    required this.isBusy,
    required this.onRememberChanged,
  });

  final bool rememberMe;
  final bool isBusy;
  final ValueChanged<bool> onRememberChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Checkbox.adaptive(
          value: rememberMe,
          onChanged: isBusy
              ? null
              : (value) {
                  onRememberChanged(value ?? true);
                },
        ),
        const SizedBox(width: 6),
        Text('Remember me', style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}

class _MacosRememberMeRow extends StatelessWidget {
  const _MacosRememberMeRow({
    required this.rememberMe,
    required this.isBusy,
    required this.onRememberChanged,
  });

  final bool rememberMe;
  final bool isBusy;
  final ValueChanged<bool> onRememberChanged;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final typography = MacosTheme.of(context).typography;

    return Row(
      children: [
        MacosCheckbox(
          value: rememberMe,
          onChanged: isBusy ? null : onRememberChanged,
        ),
        const SizedBox(width: 8),
        Text(
          'Remember me',
          style: typography.body.copyWith(color: palette.textPrimary),
        ),
      ],
    );
  }
}
