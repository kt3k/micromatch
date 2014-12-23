/*!
 * micromatch <https://github.com/jonschlinkert/micromatch>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var unixify = require('unixify');
var union = require('arr-union');
var diff = require('arr-diff');
var braces = require('braces');

function makeRe(glob, options) {
  glob = unixify(glob);
  var opts = options || {};
  var flags = '';
  var i = 0;

  optsCache = optsCache || opts;
  if (!equal(optsCache, opts)) {
    regex = null;
    cache = glob;
  }

  cache = cache || glob;
  if (cache !== glob) {
    regex = null;
    cache = glob;
  }

  if (regex instanceof RegExp) {
    return regex;
  }

  if (/\{/.test(glob)) {
    if (!isBasicBrace(glob)) {
      glob = glob.replace(/\{([^{]+)\}/g, function (_, inner) {
        var parts = inner.split(',').join('|');
        return '(' + parts + ')';
      });
    } else {
      glob = braces(glob).join('|');
    }
  }

  while (i < len) {
    var group = tokens[i++];
    var re = group[1].re;
    var to = group[1].to;

    for (var key in opts) {
      if (group[1].hasOwnProperty(key)) {
        to += group[1][key];
      }
    }
    glob = glob.replace(re, to);
  }

  if (opts.nocase) flags += 'i';

  var res = /^!/.test(glob)
    ? '^(?!((?!\\.)' + glob.slice(1) + ')$)'
    : '^' + glob + '$';

  regex = new RegExp(res, flags);
  return regex;
}

/**
 * Pass an array of files and a glob pattern as a string.
 * This function is called by the main `micromatch` function
 * If you only need to pass a single pattern you might get
 * minor speed improvements using this function.
 *
 * @param  {Array} `files`
 * @param  {Array} `pattern`
 * @param  {Object} `options`
 * @return {Array}
 */

function match(files, pattern, options) {
  if (typeof files !== 'string' && !Array.isArray(files)) {
    throw new Error('micromatch.match() expects a string or array.');
  }

  files = arrayify(files);
  var len = files.length;
  var res = [];
  var i = 0;

  while (i < len) {
    var fp = files[i++];
    if (makeRe(pattern, options).test(fp)) {
      res.push(fp);
    }
  }
  return res;
}

/**
 * The main function. Pass an array of filepaths,
 * and a string or array of glob patterns
 *
 * @param  {Array|String} `files`
 * @param  {Array|String} `patterns`
 * @param  {Object} `opts`
 * @return {Array} Array of matches
 */

function micromatch(files, patterns, opts) {
  if (!files || !patterns) {
    return [];
  }

  files = arrayify(files);
  opts = opts || {};

  if (typeof patterns === 'string') {
    return union([], match(files, patterns, opts));
  }

  var len = patterns.length;
  var res = [];
  var i = 0;

  while (len--) {
    var glob = patterns[i++];
    var concat = union;

    if (glob.charAt(0) === '!') {
      glob = glob.slice(1);
      concat = diff;
    }

    res = concat(res, match(files, glob, opts));
  }
  return res;
}

/**
 * Return `true` if the path contains nested
 * braces. If so, then the [braces] lib is used
 * for expansion. if not, we convert the braces
 * to a regex.
 *
 * @param  {String} str
 * @return {Boolean}
 */

function isBasicBrace(str) {
  if (/\.{2}/.test(str)) {
    return true;
  }

  var a = str.indexOf('{');
  str = str.slice(a + 1);
  var i = 0;

  while (a !== -1) {
    var ch = str.charAt(i++);
    if (ch === '{') {
      return true;
    }
    if (ch === '}') {
      return false;
    }
  }
  return false;
}

/**
 * Return true if object A is equal (enough)
 * to object B. Used for options caching.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Boolean}
 */

function equal(a, b) {
  if (!b) return false;

  for (var prop in b) {
    if (!a.hasOwnProperty(prop)) {
      return false;
    }
    if (a[prop] !== b[prop]) {
      return false;
    }
  }

  return true;
}

/**
 * Coerce `val` to an array
 *
 * @param  {*} val
 * @return {Array}
 */

function arrayify(val) {
  return !Array.isArray(val)
    ? [val]
    : val;
}

/**
 * Results cache
 */

var regex;
var cache;
var optsCache;

/**
 * Special patterns
 */

var matchBase = '[\\s\\S]+';
var dotfile =   '[^\\/]*?';

/**
 * Glob tokens to match and replace with
 * regular expressions
 */

var tokens = [
  ['\\\\', {re: /\\{2}/g,   to: '\\/'}],
  ['/',    {re: /\//g,      to: '\\/'}],
  ['.',    {re: /[.]/g,     to: '\\.'}],
  ['?',    {re: /\?/g,      to: '.'}],
  ['**',   {re: /[*]{2}/g,  to: '[\\s\\S]+'}],
  ['*',    {re: /[*]/g,     to: '[^\\/]*?', matchBase: matchBase, dot: dotfile}],
];

var len = tokens.length;

/**
 * Expose `micromatch`
 */

module.exports = micromatch;

/**
 * Expose `micromatch.match`
 */

module.exports.match = match;

/**
 * Expose `micromatch.makeRe`
 */

module.exports.makeRe = makeRe;
