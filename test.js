process.nextTick(() => {
  console.log('nexttick》》》》1')
})

setTimeout(() => {
  console.log('timer 1')

  process.nextTick(() => {
    console.log('nexttick1')
  })

  console.log('timer 2')
}, 0)

setImmediate(() => {
  console.log('imme1')
  process.nextTick(() => {
    console.log('nexttick2')
  })

  console.log('imme2')
})

process.nextTick(() => {
  console.log('nexttick》》》》2')
})
