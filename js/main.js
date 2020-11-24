let game = new Game()
game.init()

let current_score = document.getElementsByClassName('current-score')[0]
let score = document.getElementsByClassName('score')[0]
let mask = document.getElementsByClassName('mask')[0]
let restart = document.getElementsByClassName('restart')[0]
game._addSuccessFn(function (score) {
  current_score.innerHTML = score
})
game._addFailedFn(function () {
  mask.style.display = 'flex'
  score.innerHTML = game.score
})
restart.addEventListener('click', function () {
  score.innerHTML = 0
  current_score.innerHTML = 0
  mask.style.display = 'none'
  game._restart()
})