
// Copyright 2008-2018 Douglas Wikstrom
//
// This file is part of Verificatum JavaScript Cryptographic library
// (VJSC).
//
// VJSC is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// VJSC is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
// or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General
// Public License for more details.
//
// You should have received a copy of the GNU Affero General Public
// License along with VJSC. If not, see <http://www.gnu.org/licenses/>.

// ######################################################################
// ################### Test LargeInteger.js #############################
// ######################################################################

var test_li = (function () {
    var prefix = "verificatum.arithm.li";
    var li = verificatum.arithm.li;

    var MASK_ALL = (1 << li.WORDSIZE) - 1;
    var MASK_ALL_2 = [MASK_ALL, MASK_ALL, 0];
    var MASK_ALL_3 = [MASK_ALL, MASK_ALL, MASK_ALL];

    var twos_negation = function (testTime) {
        var e;
        var end = test.start([prefix +
                             " (negation in two's complement)"], testTime);

        var d = [0];
        var v = [0, 0];
        var p = [0, 0, 0];
        var r = [0, 0, 0];

        // This is exhaustive.
        var i = 1;
        var s = 100;
        while (!test.done(end)) {
            var x = li.INSECURErandom(i);

            var y = [];
            y.length = x.length + 1;

            var z = [];
            z.length = x.length + 1;

            li.neg(y, x);
            li.add(z, x, y);

            if (!li.iszero(z)) {
                test.error("Negation failed!" +
                           "\nx = 0x" + li.hex(x) +
                           "\ny = 0x" + li.hex(y) +
                           "\nz = 0x" + li.hex(z));
            }

            if (i == s) {
                i = 1;
            }
        }
        test.end();
    };

    var reciprocal_word = function (testTime) {
        var e;
        var end = test.start([prefix + " (reciprocal_word)"], testTime);

        var d = [0];
        var v = [0, 0];
        var p = [0, 0, 0];
        var r = [0, 0, 0];

        // This is exhaustive.
        var i = 0;
        while (i < (1 << (li.WORDSIZE - 1))) {

            d[0] = i;
            d[0] |= (1 << (li.WORDSIZE - 1));

            // 2by1 reciprocal of d.
            v[0] = li.reciprocal_word(d[0]);

            // Add 2**WORDSIZE.
            v[1] = 1;


            // Check that the reciprocal is in the right interval by
            // using it.

            // p = (v + 2^WORDSIZE) * d
            li.mul(p, v, d);

            // 2^(2 * WORDSIZE) - 1 - p
            li.sub(r, MASK_ALL_2, p);
            if (li.cmp(r, d) >= 0) {
                test.error("Too small reciprocal!" +
                           "\nd = 0x" + li.hex(d) +
                           "\nr = 0x" + li.hex(r) +
                           "\nv = " + v[0]);
            }
            i++;
        }
        test.end();
    };

    var reciprocal_word_3by2 = function (testTime) {
        var e;
        var end = test.start([prefix + " (reciprocal_word_3by2)"], testTime);

        var v = [0, 0];
        var p = [0, 0, 0, 0];
        var r = [0, 0, 0, 0];

        var i = 1;
        while (!test.done(end)) {

            // Divisor with leading bit set.
            var d = li.INSECURErandom(2 * li.WORDSIZE);
            d[1] |= (1 << (li.WORDSIZE - 1));

            // 3by2 reciprocal of d.
            v[0] = li.reciprocal_word_3by2(d);

            // Add 2**(2 * WORDSIZE).
            v[1] = 1;


            // Check that the reciprocal is in the right interval by
            // using it.

            // p = (v + 2^(2 * WORDSIZE)) * d
            li.mul(p, v, d);

            // 2^(3 * WORDSIZE) - 1 - p
            li.sub(r, MASK_ALL_3, p);
            if (li.cmp(r, d) >= 0) {
                test.error("Too small reciprocal!" +
                           "\nd = 0x" + li.hex(d) +
                           "\nr = 0x" + li.hex(r) +
                           "\nv = " + v[0]);
            }
        }
        test.end();
    };

    var div3by2 = function (testTime) {
        var e;
        var end = test.start([prefix + " (div3by2)"], testTime);

        var u = [0];
        var v = [0, 0];
        var p = [0, 0, 0, 0];
        var r = [0, 0];
        var d;
        var u;

        // Negative of d in two's complement.
        var neg_d = [0, 0];

        while (!test.done(end)) {
            do {

                // Divisor with leading bit set.
                d = li.INSECURErandom(2 * li.WORDSIZE);
                d[1] |= (1 << (li.WORDSIZE - 1));

                // Dividend such that u < 2^WORDSIZE * d
                u = li.INSECURErandom(3 * li.WORDSIZE);

            } while (u[2] >= d[1] ||
                     (u[2] == d[1] && u[1] >= d[0]));

            li.sub(neg_d, [0, 0], d);

            // Reciprocal.
            var v = li.reciprocal_word_3by2(d);
            var q = li.div3by2(r, u, d, neg_d, v);

            if (li.cmp(r, d) >= 0) {
                test.error("Too small reciprocal!" +
                           "\nu = 0x" + li.hex(u) +
                           "\nd = 0x" + li.hex(d) +
                           "\nq = " + q +
                           "\nr = 0x" + li.hex(r));
            }

            li.mul(p, [q], d);
            li.add(p, p, r);
            if (li.cmp(p, u) !== 0) {
                test.error("Numbers do not add up!" +
                           "\nu = 0x" + li.hex(u) +
                           "\nd = 0x" + li.hex(d) +
                           "\nq = " + q +
                           "\nr = 0x" + li.hex(r));
            }
        }
        test.end();
    };

    var run = function (testTime) {
        twos_negation(testTime);
        reciprocal_word(testTime);
        reciprocal_word_3by2(testTime);
        div3by2(testTime);
    };
    return {run: run};
})();
