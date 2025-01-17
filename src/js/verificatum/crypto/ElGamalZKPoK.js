
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
// ################### ElGamalZKPoK #####################################
// ######################################################################

M4_NEEDS(verificatum/crypto/ElGamal.js)dnl
M4_NEEDS(verificatum/crypto/ElGamalZKPoKAdapter.js)dnl

/**
 * @description Generalized El Gamal cryptosystem with parameterized
 * zero-knowledge proof of knowledge. This supports wider keys as
 * explained in {@link verificatum.crypto.ElGamal}.
 *
 * <p>
 *
 * Restrictions on the ciphertexts and encrypted plaintexts are
 * readily expressed by forming an application specific ZKPoK and
 * setting the adapter variable.
 *
 * @param standard Determines if the standard or variant El Gamal
 * cryptosystem is used.
 * @param pGroup Group G over which the cryptosystem is defined. This
 * can be a product group if the key width is greater than one.
 * @param adapter Adapter for instantiating ZKPoKs.
 * @param hashfunction Hash function used to implement the Fiat-Shamir
 * heuristic in ZKPoKs.
 * @param randomSource Source of randomness.
 * @param statDist Statistical distance from the uniform distribution
 * assuming that the output of the instance of the random source is
 * perfect.
 * @class
 * @memberof verificatum.crypto
 */
function ElGamalZKPoK(standard, pGroup, adapter, hashfunction,
                      randomSource, statDist) {
    this.eg = new ElGamal(standard, pGroup, randomSource, statDist);
    this.adapter = adapter;
    this.hashfunction = hashfunction;
};
ElGamalZKPoK.prototype = Object.create(Object.prototype);
ElGamalZKPoK.prototype.constructor = ElGamalZKPoK;

/**
 * @description Generates a key pair over the given group.
 * @return Pair [pk, sk] such that pk is a public key in G x G or in
 * (G x G) x G depending on if the standard or variant scheme is used,
 * and sk is the corresponding private key contained in R.
 * @method
 */
ElGamalZKPoK.prototype.gen = function () {
    return this.eg.gen();
};

/**
 * @description Pre-computation for encrypting a message using {@link
 * verificatum.crypto.ElGamalZKPoK.completeEncrypt}.
 * @param publicKey Public key output by {@link
 * verificatum.crypto.ElGamalZKPoK.gen}.
 * @return A pair [e, z], where e are the values pre-computed by
 * {@link verificatum.crypto.ElGamal.precomputeEncrypt} and z are the
 * values pre-computed by the subclass of {@link
 * verificatum.crypto.ZKPoK.precompute} used.
 * @method
 */
ElGamalZKPoK.prototype.precomputeEncrypt = function (publicKey) {
    var ruv = this.eg.precomputeEncrypt(publicKey);
    var zkpok = this.adapter.getZKPoK(publicKey);
    var pre = zkpok.precompute(this.eg.randomSource, this.eg.statDist);
    return [ruv, pre];
};

/**
 * @description Completes the encryption.
 * @param label Label used for encryption.
 * @param publicKey Public key.
 * @param precomputed Output from {@link
 * verificatum.crypto.ElGamalZKPoK.precomputeEncrypt}.
 * @param message Message in G to encrypt.
 * @return Ciphertext in the form of a byte tree.
 * @method
 */
ElGamalZKPoK.prototype.completeEncrypt = function (label,
                                                   publicKey,
                                                   precomputed,
                                                   message) {
    var egc = this.eg.completeEncrypt(publicKey, precomputed[0], message);
    var zkpok = this.adapter.getZKPoK(publicKey);
    var proof = zkpok.completeProof(precomputed[1],
                                    label,
                                    egc, precomputed[0][0],
                                    this.hashfunction,
                                    this.eg.randomSource,
                                    this.eg.statDist);
    return new eio.ByteTree([egc.toByteTree(), new eio.ByteTree(proof)]);
};

/**
 * @description Encrypts a message.
 * @param label Label used for encryption.
 * @param publicKey Public key.
 * @param message Message in G' to encrypt.
 * @return Ciphertext of the form of a byte tree.
 * @method
 */
ElGamalZKPoK.prototype.encrypt = function (label, publicKey, message) {
    var precomputed = this.precomputeEncrypt(publicKey);
    return this.completeEncrypt(label, publicKey, precomputed, message);
};

/**
 * @description Decrypts an El Gamal ciphertext.
 * @param label Label used for decryption.
 * @param privateKey Private key in R'.
 * @param ciphertext Ciphertext in the form of a byte tree.
 * @return Plaintext or null to indicate that the ciphertext was
 * invalid.
 * @method
 */
ElGamalZKPoK.prototype.decrypt = function (label, publicKey, privateKey,
                                           ciphertext) {
    if (ciphertext.isLeaf() ||
        ciphertext.value.length !== 2 ||
        !ciphertext.value[1].isLeaf()) {
        return null;
    }
    var ciphertextElement;
    try {
        ciphertextElement = publicKey.pGroup.toElement(ciphertext.value[0]);
    } catch (err) {
        return null;
    }
    var proof = ciphertext.value[1].value;

    var zkpok = this.adapter.getZKPoK(publicKey);
    var verdict =
        zkpok.verify(label, ciphertextElement, this.hashfunction, proof);
    if (verdict) {
        return this.eg.decrypt(privateKey, ciphertextElement);
    } else {
        return null;
    }
};

ElGamalZKPoK.prototype.widePublicKey = function (publicKey, width) {
    return this.eg.widePublicKey(publicKey, width);
};

ElGamalZKPoK.prototype.widePrivateKey = function (privateKey, width) {
    return this.eg.widePrivateKey(privateKey, width);
};
