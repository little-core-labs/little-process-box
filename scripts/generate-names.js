const chance = require('chance')()
const path = require('path')
const fs = require('fs')

const COUNT = 512
const names = new Set()
const words = new Set()
const animals = new Set()

for (let i = 0; i < COUNT; ++i) {
  words.add(chance.word())
  animals.add(chance.animal().toLowerCase())
}

for (let i = 0; i < COUNT; ++i) {
  const animal = [ ...animals ][Math.random() * i % animals.size | 0]
  const word = [ ...words ][Math.random() * i % words.size | 0]
  names.add(`${word} ${animal}`.replace(/ /g, '-'))
}

const json = JSON.stringify([ ...names ])
fs.writeFile(path.resolve('data', 'names.json'), Buffer.from(json), (err) => {
  if (err) {
    console.error(err.stack || err)
    process.nextTick(process.exit, 1)
  } else {
    console.log(' info: generate-names: Generated %d unique names', COUNT)
    process.nextTick(process.exit, 0)
  }
})
