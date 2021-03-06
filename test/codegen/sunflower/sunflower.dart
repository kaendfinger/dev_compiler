// Copyright (c) 2012, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

library sunflower;

import 'dart:math';
import 'dom.dart';

const ORANGE = "orange";
const SEED_RADIUS = 2;
const SCALE_FACTOR = 4;
const TAU = PI * 2;
const MAX_D = 300;
// TODO(sigmund): remove `num` here, this is to workaround dartbug.com/22937
const num centerX = MAX_D / 2;
const num centerY = centerX;

Element querySelector(String selector) => document.querySelector(selector);

final InputElement slider = querySelector("#slider");
final notes = querySelector("#notes");
final PHI = (sqrt(5) + 1) / 2;
int seeds = 0;
final CanvasRenderingContext2D context =
    (querySelector("#canvas") as CanvasElement).getContext('2d');

void main() {
  slider.addEventListener('change', (e) => draw());
  draw();
}

/// Draw the complete figure for the current number of seeds.
void draw() {
  seeds = int.parse(slider.value);
  context.clearRect(0, 0, MAX_D, MAX_D);
  for (var i = 0; i < seeds; i++) {
    final theta = i * TAU / PHI;
    final r = sqrt(i) * SCALE_FACTOR;
    final x = centerX + r * cos(theta);
    final y = centerY - r * sin(theta);
    new SunflowerSeed(x, y, SEED_RADIUS).draw();
  }
  notes.textContent = "$seeds seeds";
}

// This example was modified to use classes and mixins.
class SunflowerSeed extends Circle with CirclePainter {
  SunflowerSeed(num x, num y, num radius, [String color])
  : super(x, y, radius) {
    if (color != null) this.color = color;
  }
}

abstract class CirclePainter implements Circle {
  // This demonstrates a field in a mixin.
  String color = ORANGE;

  /// Draw a small circle representing a seed centered at (x,y).
  void draw() {
    context
      ..beginPath()
      ..lineWidth = 2
      ..fillStyle = color
      ..strokeStyle = color
      ..arc(x, y, radius, 0, TAU, false)
      ..fill()
      ..closePath()
      ..stroke();
  }
}

class Circle {
  final num x, y, radius;

  Circle(this.x, this.y, this.radius);
}
