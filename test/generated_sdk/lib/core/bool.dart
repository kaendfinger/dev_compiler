// Copyright (c) 2012, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

part of dart.core;

/**
 * The reserved words [:true:] and [:false:] denote objects that are the only
 * instances of this class.
 *
 * It is a compile-time error for a class to attempt to extend or implement
 * bool.
 */
class bool {
  /**
   * Returns the boolean value of the environment declaration [name].
   *
   * The boolean value of the declaration is `true` if the declared value is
   * the string `"true"`, and `false` if the value is `"false"`.
   *
   * In all other cases, including when there is no declaration for `name`,
   * the result is the [defaultValue].
   *
   * Example:
   *
   *     const loggingFlag = const bool.fromEnvironment("logging");
   *
   * If you want to use a different truth-string, you can use the
   * [String.fromEnvironment] constructor directly:
   *
   *     const isLoggingOn = (const String.fromEnvironment("logging") == "on");
   */
  factory bool.fromEnvironment(String name, {bool defaultValue: false}) {
    throw new UnsupportedError(
        'bool.fromEnvironment can only be used as a const constructor');
  }

  /**
   * Returns [:"true":] if the receiver is [:true:], or [:"false":] if the
   * receiver is [:false:].
   */
  String toString() {
    return this ? "true" : "false";
  }
}
