/**
 * Create human-readable lookup names for client ids
 */

const softSounds = ['a', 'ee', 'i', 'o', 'oo', 'ff']
const hardSounds1 = ['w', 'r', 'y', 's', 'd', 'f', 'g', 'sh', 'j', 'k', 'z', 'c', 'v', 'b', 'ch', 'n', 'm']
const hardSounds2 = ['w', 'r', 'y', 'p', 's', 'f', 'g', 'sh', 'j', 'k', 'z', 'x', 'v', 'b', 'ch', 'n', 'm', '']

var ids2names = {}
var names2ids = {}

function syllable0a() {
  return hardSounds1[Math.floor(Math.random() * softSounds.length)] +
          softSounds[Math.floor(Math.random() * softSounds.length)]
}

function syllable0b() {
  return  softSounds[Math.floor(Math.random() * softSounds.length)] +
         hardSounds2[Math.floor(Math.random() * softSounds.length)]
}

function syllable1() {
  return hardSounds1[Math.floor(Math.random() * softSounds.length)] +
          softSounds[Math.floor(Math.random() * softSounds.length)] +
         hardSounds2[Math.floor(Math.random() * softSounds.length)]
}

function syllable2() {
  return hardSounds1[Math.floor(Math.random() * softSounds.length)] +
          softSounds[Math.floor(Math.random() * softSounds.length)] +
         hardSounds2[Math.floor(Math.random() * softSounds.length)] +
          softSounds[Math.floor(Math.random() * softSounds.length)]
}

function syllable() {
  return Math.random() > 0.5 ? syllable1() :  // 50% - normal 1 syllable
         Math.random() > 0.5 ?
          Math.random() > 0.5 ?
            syllable0a()                      // 12.5% - short 1 syllable a
            :
            syllable0b()                      // 12.5% - short 1 syllable b
          :
          syllable2()                         // 25% - 2 syllable
}

// lookup name for id
function id2name(id) {

  // make one if it doesnt exist
  if (ids2names[id]) {
    return ids2names[id]
  }

  var name = syllable()

  // make it unique
  while (names2ids[name]) {
    name += '-' + syllable()
  }

  names2ids[name] = id
  ids2names[id] = name
  return name
}

// lookup id for rid
function name2id(name) {
  return names2ids[name]
}

module.exports = {
  getName: id2name,
  getId: name2id
}
