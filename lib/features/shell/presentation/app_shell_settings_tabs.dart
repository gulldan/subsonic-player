part of 'app_shell_screen.dart';

class _SettingsTab extends StatefulWidget {
  const _SettingsTab({required this.controllers});

  final _ShellControllers controllers;

  @override
  State<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<_SettingsTab> {
  late final TextEditingController _serverUrlController;
  late final TextEditingController _usernameController;
  late final TextEditingController _passwordController;

  String _streamQuality = 'Original (FLAC)';
  String _crossfade = 'Off';
  bool _gapless = true;
  bool _replayGain = false;

  @override
  void initState() {
    super.initState();
    final profile = widget.controllers.session.profile;
    _serverUrlController = TextEditingController(text: profile?.baseUrl ?? '');
    _usernameController = TextEditingController(text: profile?.username ?? '');
    _passwordController = TextEditingController(text: profile?.password ?? '');
  }

  @override
  void dispose() {
    _serverUrlController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitServerDetails() async {
    await widget.controllers.session.signIn(
      serverUrl: _serverUrlController.text,
      username: _usernameController.text,
      password: _passwordController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);

    return ListenableBuilder(
      listenable: widget.controllers.session,
      builder: (context, child) {
        final session = widget.controllers.session;
        final isBusy = session.isBusy;
        final userLabel = _userDisplayLabel(session);
        final serverLabel = _serverDisplayLabel(session);

        return SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Settings', style: theme.textTheme.headlineLarge),
              const SizedBox(height: 8),
              Text(
                'Server access, playback defaults, and session controls.',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 22),
              AppPanel(
                tone: AppPanelTone.raised,
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                child: Row(
                  children: [
                    AppUserBadge(
                      label: userLabel,
                      size: 48,
                      fillColor: palette.accent.withValues(alpha: 0.18),
                      borderColor: palette.accent.withValues(alpha: 0.34),
                      textColor: palette.textPrimary,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(userLabel, style: theme.textTheme.titleLarge),
                          const SizedBox(height: 4),
                          Text(
                            'Connected to $serverLabel',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () =>
                          unawaited(widget.controllers.session.signOut()),
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('Sign out'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              LayoutBuilder(
                builder: (context, constraints) {
                  final wide = constraints.maxWidth >= 1100;
                  final leftColumn = Column(
                    children: [
                      _SettingsCard(
                        icon: Icons.dns_outlined,
                        title: 'Server',
                        subtitle:
                            'Edit credentials and reconnect without '
                            'leaving the app.',
                        child: Column(
                          children: [
                            TextField(
                              controller: _serverUrlController,
                              decoration: const InputDecoration(
                                labelText: 'Server URL',
                                hintText: 'https://your-server.com',
                              ),
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _usernameController,
                                    decoration: const InputDecoration(
                                      labelText: 'Username',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextField(
                                    controller: _passwordController,
                                    obscureText: true,
                                    decoration: const InputDecoration(
                                      labelText: 'Password',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (session.errorMessage != null) ...[
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  session.errorMessage!,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: palette.danger,
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: isBusy ? null : _submitServerDetails,
                                child: Text(
                                  isBusy ? 'Connecting…' : 'Connect',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      _SettingsCard(
                        icon: Icons.tune_rounded,
                        title: 'Playback defaults',
                        subtitle:
                            'Balanced toggles with enough detail to '
                            'feel native.',
                        child: Column(
                          children: [
                            _SettingsOptionRow(
                              title: 'Stream quality',
                              subtitle: 'Server-side transcoding',
                              trailing: DropdownButton<String>(
                                value: _streamQuality,
                                underline: const SizedBox.shrink(),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'Original (FLAC)',
                                    child: Text('Original (FLAC)'),
                                  ),
                                  DropdownMenuItem(
                                    value: '320 kbps',
                                    child: Text('320 kbps'),
                                  ),
                                  DropdownMenuItem(
                                    value: '192 kbps',
                                    child: Text('192 kbps'),
                                  ),
                                  DropdownMenuItem(
                                    value: '128 kbps',
                                    child: Text('128 kbps'),
                                  ),
                                ],
                                onChanged: (value) {
                                  if (value == null) {
                                    return;
                                  }
                                  setState(() {
                                    _streamQuality = value;
                                  });
                                },
                              ),
                            ),
                            const Divider(),
                            _SettingsOptionRow(
                              title: 'Crossfade',
                              subtitle: 'Smooth transition',
                              trailing: DropdownButton<String>(
                                value: _crossfade,
                                underline: const SizedBox.shrink(),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'Off',
                                    child: Text('Off'),
                                  ),
                                  DropdownMenuItem(
                                    value: '3s',
                                    child: Text('3s'),
                                  ),
                                  DropdownMenuItem(
                                    value: '5s',
                                    child: Text('5s'),
                                  ),
                                  DropdownMenuItem(
                                    value: '8s',
                                    child: Text('8s'),
                                  ),
                                ],
                                onChanged: (value) {
                                  if (value == null) {
                                    return;
                                  }
                                  setState(() {
                                    _crossfade = value;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );

                  final rightColumn = Column(
                    children: [
                      _SettingsCard(
                        icon: Icons.graphic_eq_rounded,
                        title: 'Sound behaviour',
                        subtitle:
                            'Fast-access toggles for the playback character.',
                        child: Column(
                          children: [
                            _SettingsOptionRow(
                              title: 'Gapless playback',
                              subtitle: 'No pause between tracks',
                              trailing: Switch(
                                value: _gapless,
                                onChanged: (value) {
                                  setState(() {
                                    _gapless = value;
                                  });
                                },
                              ),
                            ),
                            const Divider(),
                            _SettingsOptionRow(
                              title: 'ReplayGain',
                              subtitle: 'Volume normalization',
                              trailing: Switch(
                                value: _replayGain,
                                onChanged: (value) {
                                  setState(() {
                                    _replayGain = value;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      _SettingsCard(
                        icon: Icons.info_outline_rounded,
                        title: 'About',
                        subtitle:
                            'Product context and a calmer presentation '
                            'of app info.',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const AppBrandMark(
                              compact: true,
                              subtitle: 'v1.0.0',
                            ),
                            const SizedBox(height: 14),
                            Text(
                              'Modern client for self-hosted music servers. '
                              'Supports Subsonic API v1.16+ and '
                              'Navidrome-compatible libraries.',
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  );

                  if (!wide) {
                    return Column(
                      children: [
                        leftColumn,
                        const SizedBox(height: 18),
                        rightColumn,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: leftColumn),
                      const SizedBox(width: 18),
                      Expanded(child: rightColumn),
                    ],
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: palette.surfaceAccent.withValues(alpha: 0.82),
                  borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                  border: Border.all(color: palette.borderStrong),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Icon(icon, color: palette.accent, size: 18),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: theme.textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text(subtitle, style: theme.textTheme.bodyMedium),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}

class _SettingsOptionRow extends StatelessWidget {
  const _SettingsOptionRow({
    required this.title,
    required this.subtitle,
    required this.trailing,
  });

  final String title;
  final String subtitle;
  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.labelLarge),
              const SizedBox(height: 4),
              Text(subtitle, style: theme.textTheme.bodySmall),
            ],
          ),
        ),
        const SizedBox(width: 12),
        trailing,
      ],
    );
  }
}
