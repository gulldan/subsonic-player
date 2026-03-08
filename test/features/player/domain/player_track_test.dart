import 'package:flutter_sonicwave/features/player/domain/player_track.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('copyWith overrides selected fields and preserves others', () {
    const track = PlayerTrack(
      id: '1',
      title: 'Title',
      artist: 'Artist',
      duration: Duration(minutes: 3),
    );

    final changed = track.copyWith(title: 'New Title');

    expect(changed.id, '1');
    expect(changed.title, 'New Title');
    expect(changed.artist, 'Artist');
    expect(changed.duration, const Duration(minutes: 3));
  });
}
