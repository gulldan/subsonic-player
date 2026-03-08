part of 'app_shell_screen.dart';

class _SearchTab extends StatefulWidget {
  const _SearchTab({required this.controllers});

  final _ShellControllers controllers;

  @override
  State<_SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends State<_SearchTab> {
  late final TextEditingController _controller;
  Timer? _debounce;
  _SearchGenre _genre = _SearchGenre.all;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.controllers.library.searchQuery,
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _submit(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 220), () {
      unawaited(widget.controllers.library.search(value));
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controllers.library,
      builder: (context, child) {
        final library = widget.controllers.library;
        final query = library.searchQuery.toLowerCase();
        final artists = _buildArtistSpotlights(widget.controllers)
            .where((artist) {
              final matchesGenre =
                  _genre == _SearchGenre.all || artist.genre == _genre.label;
              final matchesQuery =
                  query.isEmpty ||
                  artist.name.toLowerCase().contains(query) ||
                  artist.genre.toLowerCase().contains(query);
              return matchesGenre && matchesQuery;
            })
            .toList(growable: false);
        final tracks = library.searchQuery.isEmpty
            ? library.featuredSongs.take(8).toList(growable: false)
            : library.searchResults.take(12).toList(growable: false);
        final tracksTitle = library.searchQuery.isEmpty
            ? 'Suggested tracks'
            : '${library.searchResults.length} track matches';

        return SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 1180;
                  final commandDeck = _SearchCommandDeck(
                    controller: _controller,
                    searching: library.searching,
                    activeGenre: _genre,
                    onChanged: _submit,
                    onSelectGenre: (genre) {
                      setState(() {
                        _genre = genre;
                      });
                    },
                    serverLabel: _serverDisplayLabel(
                      widget.controllers.session,
                    ),
                  );
                  final signalRail = _SearchSignalRail(
                    query: library.searchQuery,
                    activeGenre: _genre.label,
                    resultCount: library.searchResults.length,
                    artistCount: artists.length,
                  );

                  if (stacked) {
                    return Column(
                      children: [
                        commandDeck,
                        const SizedBox(height: 18),
                        signalRail,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 10, child: commandDeck),
                      const SizedBox(width: 18),
                      SizedBox(width: 320, child: signalRail),
                    ],
                  );
                },
              ),
              const SizedBox(height: 24),
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 1160;
                  final artistPanel = AppPanel(
                    tone: AppPanelTone.raised,
                    padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                    radius: 24,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _SectionHeader(
                          title: 'Artist matches',
                          subtitle:
                              'People and moods filtered by the current query.',
                          compact: true,
                        ),
                        const SizedBox(height: 16),
                        if (artists.isEmpty)
                          const _EmptyState(
                            icon: Icons.travel_explore_outlined,
                            title: 'No artists found',
                            description:
                                'Try another query or clear the active filter.',
                          )
                        else
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: artists
                                .map(
                                  (artist) => SizedBox(
                                    width: 176,
                                    child: _ArtistTile(artist: artist),
                                  ),
                                )
                                .toList(growable: false),
                          ),
                      ],
                    ),
                  );
                  final trackPanel = AppPanel(
                    tone: AppPanelTone.raised,
                    padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                    radius: 24,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionHeader(
                          title: tracksTitle,
                          subtitle: library.searchQuery.isEmpty
                              ? 'Use these as a quick desktop-first jumping '
                                    'off point.'
                              : 'Results stay compact, fast to scan, and one '
                                    'click away from playback.',
                          compact: true,
                        ),
                        const SizedBox(height: 16),
                        if (tracks.isEmpty)
                          const _EmptyState(
                            icon: Icons.search_off_rounded,
                            title: 'No tracks found',
                            description: 'Try a broader term or another genre.',
                          )
                        else
                          Column(
                            children: tracks
                                .asMap()
                                .entries
                                .map(
                                  (entry) => Padding(
                                    padding: EdgeInsets.only(
                                      bottom: entry.key == tracks.length - 1
                                          ? 0
                                          : 10,
                                    ),
                                    child: _LibraryTrackRow(
                                      index: entry.key + 1,
                                      song: entry.value,
                                      artworkUrl: _songArtworkUri(
                                        widget.controllers.session,
                                        entry.value,
                                        size: 180,
                                      ),
                                      onTap: () {
                                        if (library.searchQuery.isEmpty) {
                                          unawaited(
                                            widget.controllers.library
                                                .playFeaturedFrom(entry.key),
                                          );
                                          return;
                                        }
                                        unawaited(
                                          widget.controllers.library
                                              .playSearchResultFrom(entry.key),
                                        );
                                      },
                                    ),
                                  ),
                                )
                                .toList(growable: false),
                          ),
                      ],
                    ),
                  );

                  if (stacked) {
                    return Column(
                      children: [
                        artistPanel,
                        const SizedBox(height: 18),
                        trackPanel,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 9, child: artistPanel),
                      const SizedBox(width: 18),
                      Expanded(flex: 8, child: trackPanel),
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

class _SearchCommandDeck extends StatelessWidget {
  const _SearchCommandDeck({
    required this.controller,
    required this.searching,
    required this.activeGenre,
    required this.onChanged,
    required this.onSelectGenre,
    required this.serverLabel,
  });

  final TextEditingController controller;
  final bool searching;
  final _SearchGenre activeGenre;
  final ValueChanged<String> onChanged;
  final ValueChanged<_SearchGenre> onSelectGenre;
  final String serverLabel;

  @override
  Widget build(BuildContext context) {
    return AppPanel(
      tone: AppPanelTone.accent,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 22),
      radius: 28,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _LibraryCapsule(icon: Icons.hub_rounded, label: serverLabel),
              _LibraryCapsule(
                icon: _searchGenreIcon(activeGenre),
                label: activeGenre.label,
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text('Search', style: Theme.of(context).textTheme.displayLarge),
          const SizedBox(height: 10),
          Text(
            'Search tracks, albums, and artists without giving up the wide, '
            'high-density desktop layout.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          TextField(
            controller: controller,
            decoration: InputDecoration(
              hintText: 'Tracks, albums, artists...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: searching
                  ? const Padding(
                      padding: EdgeInsets.all(14),
                      child: SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : controller.text.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () {
                        controller.clear();
                        onChanged('');
                      },
                      icon: const Icon(Icons.close_rounded),
                    ),
            ),
            onChanged: onChanged,
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _SearchGenre.values
                .map(
                  (genre) => AppSelectableTile(
                    selected: genre == activeGenre,
                    onTap: () => onSelectGenre(genre),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    radius: 18,
                    backgroundColor: Colors.transparent,
                    borderColor: Colors.transparent,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _searchGenreIcon(genre),
                          size: 16,
                          color: genre == activeGenre
                              ? AppTheme.paletteOf(context).accentStrong
                              : AppTheme.paletteOf(context).textMuted,
                        ),
                        const SizedBox(width: 8),
                        Text(genre.label),
                      ],
                    ),
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _SearchSignalRail extends StatelessWidget {
  const _SearchSignalRail({
    required this.query,
    required this.activeGenre,
    required this.resultCount,
    required this.artistCount,
  });

  final String query;
  final String activeGenre;
  final int resultCount;
  final int artistCount;

  @override
  Widget build(BuildContext context) {
    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      radius: 26,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Overview', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Current query, genre filter, and result totals.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 18),
          _LibraryMiniMetric(
            label: 'Mode',
            value: query.isEmpty ? 'Discovery' : 'Focused',
            icon: Icons.radar_rounded,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Genre',
            value: activeGenre,
            icon: Icons.tune_rounded,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Tracks',
            value: '$resultCount',
            icon: Icons.music_note_rounded,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Artists',
            value: '$artistCount',
            icon: Icons.person_search_rounded,
          ),
          const SizedBox(height: 18),
          Text(
            query.isEmpty
                ? 'Start with a track, album, or artist.'
                : '“$query”',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }
}

IconData _searchGenreIcon(_SearchGenre genre) {
  return switch (genre) {
    _SearchGenre.all => Icons.auto_awesome_rounded,
    _SearchGenre.electronic => Icons.memory_rounded,
    _SearchGenre.ambient => Icons.air_rounded,
    _SearchGenre.postRock => Icons.terrain_rounded,
    _SearchGenre.synthwave => Icons.waves_rounded,
    _SearchGenre.darkAmbient => Icons.nights_stay_rounded,
    _SearchGenre.spaceRock => Icons.rocket_launch_rounded,
  };
}
