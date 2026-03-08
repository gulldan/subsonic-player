import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_sonicwave/app/router/app_router.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/library/presentation/library_view_model.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:go_router/go_router.dart';

/// Declares the native macOS application menu.
class MacosPlatformMenuBar extends StatelessWidget {
  /// Creates the shared macOS platform menu wrapper.
  const MacosPlatformMenuBar({
    required this.session,
    required this.player,
    required this.library,
    required this.router,
    required this.child,
    super.key,
  });

  /// Authenticated session state.
  final AppSession session;

  /// Shared player state.
  final PlayerViewModel player;

  /// Shared library state.
  final LibraryViewModel library;

  /// Application router.
  final GoRouter router;

  /// Main application content.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.macOS) {
      return child;
    }

    return ListenableBuilder(
      listenable: Listenable.merge([session, player, library]),
      builder: (context, _) {
        final authenticated = session.status == AppSessionStatus.authenticated;
        final hasTrack = player.track != null;

        return PlatformMenuBar(
          menus: <PlatformMenuItem>[
            PlatformMenu(
              label: 'Aurio',
              menus: <PlatformMenuItem>[
                if (PlatformProvidedMenuItem.hasMenu(
                  PlatformProvidedMenuItemType.about,
                ))
                  const PlatformProvidedMenuItem(
                    type: PlatformProvidedMenuItemType.about,
                  ),
                PlatformMenuItemGroup(
                  members: <PlatformMenuItem>[
                    PlatformMenuItem(
                      label: 'Settings...',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.comma,
                        meta: true,
                      ),
                      onSelected: authenticated
                          ? () => router.go(AppRoutes.settings)
                          : null,
                    ),
                  ],
                ),
                PlatformMenuItemGroup(
                  members: <PlatformMenuItem>[
                    if (PlatformProvidedMenuItem.hasMenu(
                      PlatformProvidedMenuItemType.hide,
                    ))
                      const PlatformProvidedMenuItem(
                        type: PlatformProvidedMenuItemType.hide,
                      ),
                    if (PlatformProvidedMenuItem.hasMenu(
                      PlatformProvidedMenuItemType.hideOtherApplications,
                    ))
                      const PlatformProvidedMenuItem(
                        type:
                            PlatformProvidedMenuItemType.hideOtherApplications,
                      ),
                    if (PlatformProvidedMenuItem.hasMenu(
                      PlatformProvidedMenuItemType.showAllApplications,
                    ))
                      const PlatformProvidedMenuItem(
                        type: PlatformProvidedMenuItemType.showAllApplications,
                      ),
                  ],
                ),
                if (PlatformProvidedMenuItem.hasMenu(
                  PlatformProvidedMenuItemType.quit,
                ))
                  const PlatformProvidedMenuItem(
                    type: PlatformProvidedMenuItemType.quit,
                  ),
              ],
            ),
            PlatformMenu(
              label: 'Library',
              menus: <PlatformMenuItem>[
                PlatformMenuItemGroup(
                  members: <PlatformMenuItem>[
                    PlatformMenuItem(
                      label: 'Home',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.digit1,
                        meta: true,
                      ),
                      onSelected: authenticated
                          ? () => router.go(AppRoutes.home)
                          : null,
                    ),
                    PlatformMenuItem(
                      label: 'Search',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.keyF,
                        meta: true,
                      ),
                      onSelected: authenticated
                          ? () => router.go(AppRoutes.search)
                          : null,
                    ),
                    PlatformMenuItem(
                      label: 'Library',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.digit2,
                        meta: true,
                      ),
                      onSelected: authenticated
                          ? () => router.go(AppRoutes.library)
                          : null,
                    ),
                  ],
                ),
                PlatformMenuItem(
                  label: 'Refresh Library',
                  shortcut: const SingleActivator(
                    LogicalKeyboardKey.keyR,
                    meta: true,
                    shift: true,
                  ),
                  onSelected: authenticated
                      ? () => unawaited(library.refresh())
                      : null,
                ),
              ],
            ),
            PlatformMenu(
              label: 'Playback',
              menus: <PlatformMenuItem>[
                PlatformMenuItemGroup(
                  members: <PlatformMenuItem>[
                    PlatformMenuItem(
                      label: player.isPlaying ? 'Pause' : 'Play',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.keyP,
                        meta: true,
                      ),
                      onSelected: hasTrack
                          ? () => unawaited(player.togglePlayback())
                          : null,
                    ),
                    PlatformMenuItem(
                      label: 'Next Track',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.arrowRight,
                        meta: true,
                      ),
                      onSelected: hasTrack
                          ? () => unawaited(player.skipNext())
                          : null,
                    ),
                    PlatformMenuItem(
                      label: 'Previous Track',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.arrowLeft,
                        meta: true,
                      ),
                      onSelected: hasTrack
                          ? () => unawaited(player.skipPrevious())
                          : null,
                    ),
                  ],
                ),
                PlatformMenuItemGroup(
                  members: <PlatformMenuItem>[
                    PlatformMenuItem(
                      label: player.isFavorite ? 'Unfavorite' : 'Favorite',
                      shortcut: const SingleActivator(
                        LogicalKeyboardKey.keyL,
                        meta: true,
                      ),
                      onSelected: hasTrack
                          ? () => unawaited(player.toggleFavorite())
                          : null,
                    ),
                    PlatformMenu(
                      label: 'Rating',
                      menus: List<PlatformMenuItem>.generate(6, (index) {
                        return PlatformMenuItem(
                          label: index == 0
                              ? 'Clear Rating'
                              : '${'★' * index}${'☆' * (5 - index)}',
                          onSelected: hasTrack
                              ? () => unawaited(player.setRating(index))
                              : null,
                        );
                      }),
                    ),
                  ],
                ),
                PlatformMenuItemGroup(
                  members: <PlatformMenuItem>[
                    PlatformMenuItem(
                      label: player.shuffleEnabled
                          ? 'Disable Shuffle'
                          : 'Enable Shuffle',
                      onSelected: hasTrack
                          ? () => player.setShuffleEnabled(
                              enabled: !player.shuffleEnabled,
                            )
                          : null,
                    ),
                    PlatformMenuItem(
                      label: 'Repeat Off',
                      onSelected: hasTrack
                          ? () => player.setRepeatMode(PlayerRepeatMode.off)
                          : null,
                    ),
                    PlatformMenuItem(
                      label: 'Repeat All',
                      onSelected: hasTrack
                          ? () => player.setRepeatMode(PlayerRepeatMode.all)
                          : null,
                    ),
                    PlatformMenuItem(
                      label: 'Repeat One',
                      onSelected: hasTrack
                          ? () => player.setRepeatMode(PlayerRepeatMode.one)
                          : null,
                    ),
                  ],
                ),
              ],
            ),
            PlatformMenu(
              label: 'Window',
              menus: <PlatformMenuItem>[
                if (PlatformProvidedMenuItem.hasMenu(
                  PlatformProvidedMenuItemType.minimizeWindow,
                ))
                  const PlatformProvidedMenuItem(
                    type: PlatformProvidedMenuItemType.minimizeWindow,
                  ),
                if (PlatformProvidedMenuItem.hasMenu(
                  PlatformProvidedMenuItemType.zoomWindow,
                ))
                  const PlatformProvidedMenuItem(
                    type: PlatformProvidedMenuItemType.zoomWindow,
                  ),
                if (PlatformProvidedMenuItem.hasMenu(
                  PlatformProvidedMenuItemType.toggleFullScreen,
                ))
                  const PlatformProvidedMenuItem(
                    type: PlatformProvidedMenuItemType.toggleFullScreen,
                  ),
              ],
            ),
          ],
          child: child,
        );
      },
    );
  }
}
