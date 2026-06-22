const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next");
const nctx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
let highScore = localStorage.getItem("hp_tetris_high") || 0;
document.getElementById("highscore").innerText = "HighScore: " + highScore;
const COLS = 10;
const ROWS = 20;
const SIZE = 30; 


/* FIX اصلی */
canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;

let board = [];
let piece;
let nextPiece;
let score = 0;
let level = 1;
let dropTime = 500;
let game = null;

/* 🔊 صدا */
const dropSound = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
const clearSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

/* 🎮 قطعات */
const PIECES = [
[[1,1,1,1]],
[[1,1],[1,1]],
[[0,1,0],[1,1,1]],
[[1,0,0],[1,1,1]],
[[0,0,1],[1,1,1]],
[[0,1,1],[1,1,0]],
[[1,1,0],[0,1,1]]
];

/* 🧱 board */
function createBoard(){
board = Array.from({length:ROWS},()=>Array(COLS).fill(0));
}

/* 🎲 قطعه */
function randomPiece(){
let shape = PIECES[Math.floor(Math.random()*PIECES.length)];
return {
x:3,
y:0,
shape:shape
};
}

/* ⚠️ collision */
function collision(p = piece){
for(let r=0;r<p.shape.length;r++){
for(let c=0;c<p.shape[r].length;c++){
if(p.shape[r][c]){
let x = p.x + c;
let y = p.y + r;

if(x<0 || x>=COLS || y>=ROWS || board[y]?.[x]){
return true;
}
}
}
}
return false;
}

/* 📌 lock */
function lock(){
for(let r=0;r<piece.shape.length;r++){
for(let c=0;c<piece.shape[r].length;c++){
if(piece.shape[r][c]){
board[piece.y+r][piece.x+c] = 1;
}
}
}
score += 10;
dropSound.play();
}

/* ✨ clear lines */
function clearLines(){
for(let r=ROWS-1;r>=0;r--){
if(board[r].every(v=>v===1)){
board.splice(r,1);
board.unshift(new Array(COLS).fill(0));
score += 50;
clearSound.play();
r++;
}
}
}

/* 🎨 draw */
function draw(){
ctx.clearRect(0,0,canvas.width,canvas.height);

/* board */
for(let r=0;r<ROWS;r++){
for(let c=0;c<COLS;c++){
if(board[r][c]){
ctx.fillStyle="#38bdf8";
ctx.fillRect(c*SIZE,r*SIZE,SIZE,SIZE);
}
}
}

/* ghost */
drawGhost();

/* piece */
ctx.fillStyle="red";
drawPiece(piece);

updateUI();
}if(score > highScore){
    highScore = score;
    localStorage.setItem("hp_tetris_high", highScore);
    document.getElementById("highscore").innerText = "HighScore: " + highScore;
    } 

/* 👻 ghost */
function drawGhost(){
let ghost = {...piece};

while(!collision(ghost)){
ghost.y++;
}
ghost.y--;

ctx.globalAlpha=0.3;
drawPiece(ghost);
ctx.globalAlpha=1;
}

/* 🎯 draw piece */
function drawPiece(p){
p.shape.forEach((row,r)=>{
row.forEach((v,c)=>{
if(v){
ctx.fillRect(
(p.x+c)*SIZE,
(p.y+r)*SIZE,
SIZE,
SIZE
);
}
});
});
}

/* 🧠 update UI */
function updateUI(){
scoreEl.innerText = score;
levelEl.innerText = level;
}

/* 🔄 update */
function update(){

piece.y++;

if(collision(piece)){
piece.y--;
lock();
clearLines();

piece = nextPiece;
nextPiece = randomPiece();

if(collision(piece)){
clearInterval(game);
alert("💀 GAME OVER\nScore: " + score);
return;
}
}

level = Math.floor(score/100)+1;
dropTime = Math.max(100,500-level*40);

draw();
}

/* ▶ start */
function startGame(){

createBoard();

score=0;
level=1;

piece = randomPiece();
nextPiece = randomPiece();

if(game) clearInterval(game);

game = setInterval(update,dropTime);

drawNext();
}

/* 🎲 next */
function drawNext(){
nctx.clearRect(0,0,80,80);

nctx.fillStyle="cyan";

nextPiece.shape.forEach((row,r)=>{
row.forEach((v,c)=>{
if(v){
nctx.fillRect(c*20,r*20,20,20);
}
});
});
}

/* 🎮 controls */
document.addEventListener("keydown",(e)=>{

if(!piece) return;

if(e.key==="ArrowLeft"){
piece.x--;
if(collision(piece)) piece.x++;
}

if(e.key==="ArrowRight"){
piece.x++;
if(collision(piece)) piece.x--;
}

if(e.key==="ArrowDown"){
piece.y++;
if(collision(piece)) piece.y--;
}

if(e.key==="ArrowUp"){
const rotated = piece.shape[0].map((_,i)=>
piece.shape.map(r=>r[i]).reverse()
);

let old = piece.shape;
piece.shape = rotated;

if(collision(piece)){
piece.shape = old;
}
}

});