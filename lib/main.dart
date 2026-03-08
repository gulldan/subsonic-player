import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/app.dart';
import 'package:just_audio_media_kit/just_audio_media_kit.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  JustAudioMediaKit.title = 'Aurio';
  JustAudioMediaKit.ensureInitialized();
  runApp(const SonicWaveApp());
}
