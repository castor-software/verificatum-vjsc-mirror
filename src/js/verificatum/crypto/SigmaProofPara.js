
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
// ################### SigmaProofPara ###################################
// ######################################################################

M4_NEEDS(verificatum/crypto/SigmaProof.js)dnl

/**
 * @description Parallel execution of Sigma proofs with identical
 * challenge spaces. The instance, commitment and reply are
 * represented as lists of instances, commitments and replies. The
 * representation of the witness is specified in subclasses.
 *
 * @param sigmaProofs Component Sigma proofs.
 * @class
 * @abstract
 * @extends verificatum.crypto.SigmaProof
 * @memberof verificatum.crypto
 */
function SigmaProofPara(sigmaProofs) {
    SigmaProof.call(this);
    this.sigmaProofs = sigmaProofs;
}
SigmaProofPara.prototype = Object.create(SigmaProof.prototype);
SigmaProofPara.prototype.constructor = SigmaProofPara;

SigmaProofPara.prototype.instanceToByteTree = function (instance) {
    var bta = [];
    for (var i = 0; i < instance.length; i++) {
        bta[i] = this.sigmaProofs[i].instanceToByteTree(instance[i]);
    }
    return new eio.ByteTree(bta);
};

SigmaProofPara.prototype.commitmentToByteTree = function (commitment) {
    var bta = [];
    for (var i = 0; i < commitment.length; i++) {
        bta[i] = this.sigmaProofs[i].commitmentToByteTree(commitment[i]);
    }
    return new eio.ByteTree(bta);
};

SigmaProofPara.prototype.byteTreeToCommitment = function (byteTree) {
    if (byteTree.isLeaf()) {
        throw Error("Byte tree is a leaf!");
    } else if (byteTree.value.length === this.sigmaProofs.length) {
        var commitment = [];
        for (var i = 0; i < this.sigmaProofs.length; i++) {
            commitment[i] =
                this.sigmaProofs[i].byteTreeToCommitment(byteTree.value[i]);
        }
        return commitment;
    } else {
        throw Error("Byte tree has wrong number of children! (" +
                    byteTree.value.length + ")");
    }
};

SigmaProofPara.prototype.challenge = function (first, second) {

    // Use first instance to generate challenge, since challenge
    // spaces are identical.
    return this.sigmaProofs[0].challenge(first, second);
};

SigmaProofPara.prototype.reply = function (precomputed, witness, challenge) {
    var reply = [];
    for (var i = 0; i < this.sigmaProofs.length; i++) {
        reply[i] =
            this.sigmaProofs[i].reply(precomputed[i], witness[i], challenge);
    }
    return reply;
};

SigmaProofPara.prototype.replyToByteTree = function (reply) {
    var btr = [];
    for (var i = 0; i < reply.length; i++) {
        btr[i] = this.sigmaProofs[i].replyToByteTree(reply[i]);
    }
    return new eio.ByteTree(btr);
};

SigmaProofPara.prototype.byteTreeToReply = function (byteTree) {
    if (byteTree.isLeaf()) {
        throw Error("Byte tree is a leaf!");
    } else if (byteTree.value.length === this.sigmaProofs.length) {
        var reply = [];
        for (var i = 0; i < this.sigmaProofs.length; i++) {
            reply[i] = this.sigmaProofs[i].byteTreeToReply(byteTree.value[i]);
        }
        return reply;
    } else {
        throw Error("Byte tree has wrong number of children! (" +
                    byteTree.value.length + ")");
    }
};

SigmaProofPara.prototype.check = function (instance, commitment,
                                           challenge, reply) {
    for (var i = 0; i < this.sigmaProofs.length; i++) {
        if (!this.sigmaProofs[i].check(instance[i], commitment[i],
                                       challenge[i], reply[i])) {
            return false;
        }
    }
    return true;
};

SigmaProofPara.prototype.simulate = function (instance, challenge,
                                              randomSource, statDist) {
    var commitment = [];
    var reply = [];
    for (var i = 0; i < this.sigmaProofs.length; i++) {
        var pair = this.sigmaProofs[i].simulate(instance[i], challenge[i],
                                                randomSource, statDist);
        commitment[i] = pair[0];
        reply[i] = pair[1];
    }
    return [commitment, reply];
};
