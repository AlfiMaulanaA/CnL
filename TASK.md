Berikut prompt lengkap untuk game **Ular Tangga / Chutes and Ladders**, dengan konsep online/offline, multiplayer, bot, colorful, mobile-friendly, dan deployable ke Vercel.

Buat sebuah web application game papan **Ular Tangga / Chutes and Ladders** modern bernama sementara **Climb & Slide** menggunakan **Next.js**, dengan dukungan **offline**, **multiplayer online**, **local multiplayer**, dan **lawan bot/AI**.

Game harus memiliki desain **cerah, colorful, playful, family-friendly, modern, responsive**, dan siap dideploy ke **Vercel**.

Gunakan identitas visual original. Jangan meniru asset, logo, ilustrasi, atau desain proprietary dari board game tertentu.

---

# 1. Tujuan Aplikasi

Bangun game Ular Tangga berbasis web yang benar-benar playable dan terasa seperti casual multiplayer game.

Mode permainan:

1. Play vs Bot
2. Local Multiplayer
3. Private Online Multiplayer
4. Quick Match optional
5. Mixed Players
   - Human
   - Bot

Jumlah pemain:

```text
2–6 players
```

Recommended:

```text
2–4 players
```

---

# 2. Tech Stack

Gunakan:

- Next.js versi terbaru
- App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui jika diperlukan
- Lucide React
- Framer Motion
- Zustand jika state mulai kompleks

Untuk multiplayer gunakan:

- Supabase Database
- Supabase Realtime
- Supabase Auth optional

Deployment:

```text
Vercel
```

Hindari arsitektur WebSocket custom yang membutuhkan server persistent.

---

# 3. Struktur Project

Gunakan struktur modular.

```text
app/
  page.tsx

  bot/
    page.tsx

  local/
    page.tsx

  online/
    page.tsx

  room/
    [roomId]/
      page.tsx

  settings/
    page.tsx

components/
  board/
    GameBoard.tsx
    BoardTile.tsx
    Ladder.tsx
    Chute.tsx
    PlayerToken.tsx
    Dice.tsx

  game/
    PlayerPanel.tsx
    TurnIndicator.tsx
    GameControls.tsx
    GameResultModal.tsx
    GameLog.tsx

  multiplayer/
    CreateRoom.tsx
    JoinRoom.tsx
    RoomLobby.tsx
    PlayerSlot.tsx
    ConnectionStatus.tsx

lib/
  game/
    board.ts
    dice.ts
    rules.ts
    engine.ts
    bot.ts

  multiplayer/
    room.ts
    realtime.ts

  supabase/
    client.ts
    server.ts

hooks/
  useGame.ts
  useOnlineGame.ts
  useGameSettings.ts
  useGuestPlayer.ts
  useNetworkStatus.ts

types/
  game.ts
  player.ts
  room.ts
```

Pisahkan:

- game engine
- UI
- bot
- realtime
- room state
- settings

Jangan menaruh seluruh logic di satu komponen.

---

# 4. Branding

Gunakan nama sementara:

```text
Climb & Slide
```

Alternatif:

```text
Dice Dash
Ladder Rush
Rainbow Climb
Board Bounce
Roll & Climb
```

Gunakan logo original.

Contoh icon:

```text
🎲
🪜
🌈
```

---

# 5. Visual Style

Gunakan gaya:

```text
bright
colorful
playful
cartoon-inspired
modern
clean
family-friendly
```

Gunakan warna:

```text
Purple  #8B5CF6
Blue    #3B82F6
Cyan    #06B6D4
Green   #22C55E
Yellow  #FACC15
Orange  #F97316
Pink    #EC4899
Red     #EF4444
```

Background:

```text
#F8FAFC
```

Gunakan:

- rounded-xl
- rounded-2xl
- soft shadows
- gradient ringan
- colorful illustration

Jangan membuat UI terlalu ramai.

---

# 6. Homepage

Hero:

```text
CLIMB & SLIDE
```

Headline:

```text
ROLL. CLIMB. RACE TO THE TOP!
```

Subtitle:

```text
Challenge your friends, race against bots,
and climb your way to victory.
```

CTA:

```text
[ Play Now ]
[ Play vs Bot ]
```

Tambahkan ilustrasi:

- board
- dice
- ladder
- slide/chute
- colorful tokens

---

# 7. Game Mode Cards

Tampilkan 3 card utama.

### Play Online

```text
Create a room and race with friends online.
```

Button:

```text
Play Online
```

### Play vs Bot

```text
Challenge computer players in a quick match.
```

Button:

```text
Challenge Bot
```

### Local Multiplayer

```text
Take turns on the same device.
```

Button:

```text
Play Local
```

---

# 8. Board

Gunakan classic numbered board:

```text
1–100
```

Ukuran:

```text
10 × 10
```

Gunakan numbering zig-zag.

Contoh:

```text
100 99 98 ... 91
81  82 83 ... 90
80  79 78 ... 71
...
1   2  3  ... 10
```

Pastikan arah visual jelas.

---

# 9. Board Tiles

Setiap tile harus memiliki:

- nomor
- background color
- subtle pattern
- player token jika ditempati

Gunakan warna alternating.

Contoh:

```text
Purple
Blue
Cyan
Green
Yellow
Pink
```

Nomor tile tetap mudah dibaca.

---

# 10. Ladders

Ladder menghubungkan tile rendah ke tile lebih tinggi.

Contoh configuration:

```ts
const ladders = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};
```

Posisi dapat disesuaikan jika board lebih baik secara visual.

Jika player mendarat di bawah ladder:

```text
CLIMB!
```

lalu token bergerak naik.

---

# 11. Chutes / Slides

Gunakan istilah visual:

```text
Slides
```

atau:

```text
Chutes
```

agar tetap family-friendly.

Contoh:

```ts
const chutes = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 36,
  93: 73,
  95: 75,
  99: 78,
};
```

Jika player mendarat di chute:

```text
OH NO!
SLIDE DOWN!
```

Animasi token turun.

---

# 12. Game Rules

Aturan dasar:

1. Semua player mulai di tile 0.
2. Player bergiliran roll dice.
3. Dice menghasilkan angka 1–6.
4. Token maju sesuai angka.
5. Jika mendarat di ladder, naik.
6. Jika mendarat di chute, turun.
7. Player pertama mencapai tile 100 menang.

---

# 13. Exact Finish Rule

Tambahkan setting:

```text
Exact Finish
```

Default:

```text
ON
```

Jika player berada di:

```text
97
```

dan roll:

```text
5
```

maka tidak bergerak karena melebihi 100.

Alternative setting:

```text
Bounce Back
```

Example:

```text
97 + 5
→ 100
→ 98
```

Tetapi default gunakan:

```text
Exact Finish
```

---

# 14. Dice

Dice menjadi elemen interaktif utama.

Buat 3D-like dice atau modern flat dice.

Button:

```text
ROLL DICE
```

Animasi:

```text
🎲 rolling...
```

Durasi:

```text
500–900ms
```

Hasil:

```text
You rolled 5!
```

Dice harus menghasilkan angka 1–6 secara fair.

---

# 15. Secure Dice

Untuk local dan bot mode:

gunakan:

```text
crypto.getRandomValues
```

jika tersedia.

Fallback:

```text
Math.random
```

Untuk online multiplayer:

dice result harus dihasilkan server-side.

Jangan percaya nilai dice dari client.

---

# 16. Game Flow

Flow:

```text
Player Turn
↓
Roll Dice
↓
Move Token
↓
Check Ladder
↓
Check Chute
↓
Check Winner
↓
Next Player
```

Jangan izinkan player roll lebih dari satu kali pada turn yang sama.

---

# 17. Optional Extra Turn Rule

Tambahkan optional setting:

```text
Roll 6 = Extra Turn
```

Default:

```text
OFF
```

Jika ON:

```text
Player rolls 6
↓
moves
↓
rolls again
```

Beri maximum safeguard:

```text
Maximum 3 consecutive extra rolls
```

agar game tidak terlalu lama.

---

# 18. Player Token

Setiap player memiliki token berbeda.

Contoh:

```text
🐼
🦊
🐸
🐯
🐧
🤖
```

Atau gunakan colored pawns:

```text
Red
Blue
Green
Yellow
Purple
Pink
```

Player dapat memilih avatar sebelum game.

---

# 19. Multiple Tokens on Same Tile

Jika beberapa player berada di tile yang sama:

jangan overlap penuh.

Gunakan layout kecil:

```text
● ●
 ●
```

atau sedikit offset.

Pastikan semua pemain tetap terlihat.

---

# 20. Token Movement Animation

Jangan langsung teleport token.

Token harus bergerak tile-per-tile.

Contoh:

```text
Tile 21
↓
22
↓
23
↓
24
```

Gunakan animasi singkat setiap tile.

Durasi:

```text
100–180ms per tile
```

Jangan terlalu lambat.

---

# 21. Ladder Animation

Jika naik:

```text
CLIMB!
```

Token bergerak dari:

```text
28 → 84
```

Gunakan motion path atau transition yang smooth.

Durasi:

```text
600–900ms
```

---

# 22. Slide Animation

Jika chute:

```text
SLIDE!
```

Token bergerak turun.

Gunakan animasi playful.

Contoh:

```text
87 → 36
```

---

# 23. Turn Indicator

Tampilkan:

```text
YOUR TURN
```

atau:

```text
Alex's Turn
```

Current player diberi:

- ring
- glow
- badge

Contoh:

```text
🎲 YOUR TURN
```

---

# 24. Player Panel

Desktop:

```text
🐼 You
Tile 38

🦊 Alex
Tile 42

🤖 Nova
Tile 17
```

Highlight player aktif.

Mobile gunakan card compact.

---

# 25. Game Log

Tambahkan event log.

Contoh:

```text
You rolled 5
You moved to 28
🪜 You climbed to 84!

Alex rolled 3
Alex moved to 54
⬇ Alex slid to 34
```

Gunakan auto-scroll.

---

# 26. Play vs Bot

Mode:

```text
Play vs Bot
```

Pilih:

```text
2 Players
3 Players
4 Players
```

Contoh:

```text
You
Bot Nova
Bot Pixel
Bot Luna
```

---

# 27. Bot Logic

Karena Ular Tangga sebagian besar berbasis chance, bot tidak membutuhkan AI kompleks.

Bot harus:

- roll dice pada gilirannya
- menunggu delay ringan
- memainkan move valid
- mengikuti semua rule

Bot tidak boleh memanipulasi hasil dice.

---

# 28. Bot Personality

Tambahkan personality hanya untuk visual.

Contoh:

```text
Nova
Pixel
Luna
Bolt
```

Reactions:

```text
Nice roll!
Oh no!
So close!
Let's go!
```

Optional.

---

# 29. Local Multiplayer

Local mode:

```text
2–6 players
```

Semua bermain pada perangkat yang sama.

Flow:

```text
Player 1
Roll
↓
Move
↓
Player 2
Roll
```

Tidak perlu hide information karena semua state publik.

---

# 30. Online Multiplayer

Online flow:

```text
Play Online
↓
Create Room
OR
Join Room
```

Create Room:

```text
Player Name
Max Players
Bots
Game Rules
```

Settings:

```text
Players: 2–6
Exact Finish: ON/OFF
Roll 6 Extra Turn: ON/OFF
```

---

# 31. Room Code

Generate room code.

Example:

```text
CLIMB-X7P9
```

atau:

```text
X7P9KQ
```

Lobby:

```text
ROOM CODE

X7P9KQ

[Copy Code]

[Copy Invite Link]
```

---

# 32. Multiplayer Lobby

Example:

```text
RAINBOW ROOM

1. 🐼 You       READY
2. 🦊 Alex      READY
3. 🤖 Nova      BOT
4. Waiting...

Exact Finish: ON
Extra Turn on 6: OFF

[START GAME]
```

---

# 33. Host Controls

Host dapat:

```text
Start Game
Add Bot
Remove Bot
Kick Player
Change Game Rules
```

Minimum:

```text
2 players
```

---

# 34. Ready System

Gunakan:

```text
Ready
Not Ready
```

Default:

```text
Require everyone ready
ON
```

Bots selalu ready.

---

# 35. Guest Player

Login tidak wajib.

Generate:

```text
Guest4821
```

Simpan:

```text
localStorage
```

Player dapat edit:

```text
Display Name
Avatar
```

---

# 36. Online Game Authority

Online multiplayer harus server-authoritative.

Client mengirim:

```ts
{
  roomId,
  playerId,
  action: "roll"
}
```

Server:

```text
verify player
↓
verify turn
↓
generate dice
↓
calculate destination
↓
apply ladder/chute
↓
check winner
↓
update game state
↓
broadcast result
```

Jangan izinkan client menentukan hasil dice atau destination.

---

# 37. Game State

Contoh:

```ts
type GameStatus =
  | "waiting"
  | "playing"
  | "finished";

type Player = {
  id: string;
  name: string;
  avatar: string;

  position: number;

  isBot: boolean;
  connected: boolean;
};

type GameState = {
  roomId: string;

  status: GameStatus;

  players: Player[];

  currentPlayerIndex: number;

  winnerId?: string;

  turnNumber: number;

  lastDiceRoll?: number;

  version: number;
};
```

---

# 38. Database

Jika Supabase:

## rooms

```text
id
room_code
host_id
status
max_players
settings
current_player_index
winner_id
version
created_at
updated_at
```

## players

```text
id
room_id
user_id
name
avatar
position
seat
is_bot
ready
connected
created_at
```

## turns

Optional:

```text
id
room_id
player_id
dice_result
start_position
end_position
special_action
created_at
```

---

# 39. Realtime Sync

Sinkronkan:

```text
player join
player leave
ready
game start
dice result
token position
ladder/chute event
current turn
winner
```

---

# 40. Race Condition

Gunakan:

```text
gameVersion
```

Client action:

```ts
{
  actionId: crypto.randomUUID(),
  expectedVersion: 18,
  action: "roll"
}
```

Server reject stale state.

---

# 41. Idempotency

Setiap roll harus memiliki:

```text
actionId
```

Jika request duplikat masuk, jangan roll dua kali.

---

# 42. Disconnect Handling

Jika player disconnect:

```text
Alex disconnected
```

Gunakan grace period:

```text
60 seconds
```

Optional setting:

```text
Replace disconnected player with bot
```

Default:

```text
ON
```

---

# 43. Reconnection

Saat player kembali:

restore:

```text
player identity
seat
position
current game
turn status
```

Tampilkan:

```text
Reconnected
```

---

# 44. Turn Timer

Optional:

```text
Turn Timer
```

Choices:

```text
15 sec
30 sec
Unlimited
```

Default:

```text
30 sec
```

Jika timeout online:

server dapat auto-roll.

Setting:

```text
Auto Roll on Timeout
```

Default:

```text
ON
```

---

# 45. Winner

Jika player mencapai:

```text
100
```

tampilkan:

```text
🎉 YOU WIN!
```

atau:

```text
🏆 ALEX WINS!
```

Tambahkan confetti.

Buttons:

```text
Play Again
Rematch
Back Home
```

---

# 46. Final Standings

Jika multiplayer:

```text
1st 🐼 You
2nd 🦊 Alex
3rd 🤖 Nova
4th 🐸 Pixel
```

Jika game langsung selesai ketika first player menang, rank pemain lain berdasarkan posisi saat itu.

---

# 47. Rematch

Online:

```text
Request Rematch
```

Jika semua human player setuju:

```text
reset positions
new starting player
start new game
```

Pertahankan room dan players.

---

# 48. Optional Board Themes

Tambahkan themes:

```text
Rainbow
Candy
Space
Jungle
Ocean
```

Board logic sama.

Yang berubah hanya visual.

---

# 49. Rainbow Theme

Default theme:

```text
Rainbow
```

Visual:

- colorful tiles
- clouds
- stars
- soft gradient

---

# 50. Jungle Theme

Optional:

```text
Jungle
```

Ladders dapat divisualisasikan seperti:

```text
vines / ladders
```

Chutes:

```text
water slides / vines
```

Tetap gunakan mapping game yang sama.

---

# 51. Space Theme

Optional:

```text
Space
```

Ladder dapat menjadi:

```text
rocket boost
```

Chute dapat menjadi:

```text
wormhole
```

Namun aturan tetap sama.

---

# 52. Sound

Tambahkan sound:

```text
dice roll
token movement
ladder climb
slide
turn notification
win
```

Sediakan:

```text
Sound ON/OFF
```

---

# 53. Music

Optional.

Default:

```text
OFF
```

Jika ON gunakan background music ringan original/royalty-free.

---

# 54. Animation Settings

Settings:

```text
Animations ON/OFF
Reduced Motion
```

Jika Reduced Motion aktif:

gunakan instant transition atau fade sederhana.

---

# 55. Accessibility

Pastikan:

- keyboard accessible
- dice button bisa diaktifkan keyboard
- aria-label
- focus state
- color contrast
- tidak mengandalkan warna saja
- reduced motion
- minimum touch target 44px

---

# 56. Tile Accessibility

Nomor tile harus selalu terlihat.

Jangan menggunakan warna atau illustration yang membuat nomor sulit dibaca.

Gunakan:

```text
high contrast text
```

---

# 57. Responsive Desktop

Desktop layout:

```text
---------------------------------------

Players        Game Board       Game Log

               [10 x 10]

               Roll Dice

---------------------------------------
```

Board harus menjadi elemen terbesar.

---

# 58. Responsive Mobile

Mobile:

```text
Current Player

Game Board

Dice

Players

Game Log
```

Gunakan collapsible Game Log.

Board harus tetap square:

```css
aspect-ratio: 1 / 1;
```

Jangan ada page-level horizontal scrolling.

---

# 59. Board Rendering

Gunakan CSS Grid:

```css
grid-template-columns: repeat(10, 1fr);
grid-template-rows: repeat(10, 1fr);
```

Pastikan zig-zag numbering benar.

Pisahkan data coordinate dari visual DOM index.

---

# 60. Chute/Ladder Drawing

Gunakan:

```text
SVG overlay
```

di atas board.

SVG harus responsive terhadap board size.

Gunakan:

```text
viewBox
```

dan posisi berdasarkan normalized coordinates.

Jangan hardcode pixel positions untuk satu ukuran layar saja.

---

# 61. Ladder SVG

Gunakan:

- 2 rails
- several steps

atau illustration simple.

Pastikan:

```text
pointer-events: none
```

agar tidak mengganggu tile interaction.

---

# 62. Chute SVG

Buat bentuk:

```text
curved slide
```

menggunakan SVG path.

Jangan meniru ilustrasi ular tertentu jika branding original adalah tujuan.

---

# 63. Current Position Indicator

Player panel:

```text
🐼 You
Position 84
```

Jika sedang di ladder:

```text
🪜 Climbed!
```

Jika chute:

```text
⬇ Slid Down
```

---

# 64. Game Event Overlay

Ketika ladder:

```text
🪜 AWESOME!
CLIMB TO 84!
```

Ketika slide:

```text
😱 OH NO!
SLIDE TO 34!
```

Tampilkan singkat.

---

# 65. Dice History

Optional:

```text
Recent Rolls

You: 5
Alex: 2
Nova: 6
You: 3
```

Useful untuk transparansi multiplayer.

---

# 66. Settings

Tambahkan:

```text
Sound
Music
Animations
Reduced Motion
Board Theme
Turn Timer
Exact Finish
Extra Turn on 6
```

Game-specific settings hanya host yang dapat ubah sebelum online match dimulai.

---

# 67. Error Handling

Tangani:

```text
Room not found
Room full
Game already started
Not your turn
Already rolled
Connection lost
Unable to start game
Unable to sync game
Invalid game state
```

Gunakan toast.

---

# 68. Loading States

Tampilkan:

```text
Creating room...
```

```text
Joining room...
```

```text
Waiting for players...
```

```text
Starting game...
```

```text
Rolling dice...
```

Jangan biarkan layar blank.

---

# 69. Offline Support

Buat PWA jika memungkinkan.

Offline modes:

```text
Play vs Bots
Local Multiplayer
```

Online mode memerlukan internet.

Tampilkan:

```text
Offline Mode
```

Jika koneksi kembali:

```text
Back Online
```

---

# 70. State Management

Gunakan hooks terlebih dahulu.

Jika perlu:

```text
Zustand
```

Pisahkan:

```text
Game State
UI State
Multiplayer State
Settings State
```

---

# 71. Game Engine Functions

Gunakan pure functions.

Contoh:

```ts
rollDice()
calculateNextPosition()
applyBoardEvent()
getNextPlayer()
checkWinner()
```

Lebih detail:

```ts
function calculateNextPosition(
  current: number,
  roll: number,
  exactFinish: boolean
): number
```

---

# 72. Board Configuration

Jangan hardcode game rule langsung di UI.

Gunakan:

```ts
const BOARD_SIZE = 100;

const ladders: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
};

const chutes: Record<number, number> = {
  17: 7,
  54: 34,
  87: 36,
  99: 78,
};
```

Buat config file.

---

# 73. Testing

Gunakan:

```text
Vitest
```

Test minimal:

```text
dice returns 1–6
normal movement
exact finish
ladder movement
chute movement
winner detection
turn rotation
extra turn rule
```

---

# 74. Multiplayer Tests

Test:

```text
wrong player cannot roll
same player cannot roll twice
server generates dice
duplicate action rejected
stale version rejected
winner state prevents additional turns
```

---

# 75. Security

Online:

- server authoritative dice
- player authorization
- room membership validation
- turn validation
- idempotent actions
- rate limiting jika diperlukan

Jangan expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

ke client.

---

# 76. Environment Variables

Buat:

```text
.env.example
```

Isi:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Service role hanya server-side.

---

# 77. SEO

Metadata:

```text
Title:
Climb & Slide — Play Ular Tangga Online

Description:
Play a colorful snakes-and-ladders inspired board game with friends or bots online and offline.
```

Tambahkan:

- favicon
- OpenGraph
- theme color

---

# 78. PWA

Jika memungkinkan:

```text
manifest.webmanifest
service worker
offline fallback
app icons
```

Display:

```text
standalone
```

---

# 79. Performance

Optimalkan:

- SVG overlay
- token animations
- realtime subscriptions
- mobile rendering

Jangan rerender seluruh board secara tidak perlu pada setiap animation step jika dapat dihindari.

---

# 80. Routes

Minimal:

```text
/
```

Homepage.

```text
/bot
```

Play vs Bots.

```text
/local
```

Local Multiplayer.

```text
/online
```

Create / Join Room.

```text
/room/[roomId]
```

Online game.

```text
/settings
```

Settings.

---

# 81. Homepage Feature Section

Tambahkan:

```text
Why Climb & Slide?
```

Cards:

```text
Online Multiplayer
Smart Bots
Offline Ready
Colorful Boards
Mobile Friendly
```

---

# 82. Game Result Screen

Victory:

```text
🎉
YOU REACHED THE TOP!
```

Subtitle:

```text
Amazing climb!
```

Stats:

```text
Turns: 18
Ladders Climbed: 3
Slides Hit: 2
Highest Roll: 6
```

Buttons:

```text
Play Again
Rematch
Home
```

---

# 83. Match Stats

Track:

```text
turns
dice rolls
ladders used
chutes hit
largest climb
largest slide
```

Optional:

```text
average dice roll
```

---

# 84. Celebration

Saat menang:

- confetti
- token bounce
- trophy
- short victory sound

Respect:

```text
Reduced Motion
```

---

# 85. README

Buat README:

```text
Project Overview
Tech Stack
Installation
Supabase Setup
Database Schema
Environment Variables
Development
Testing
Production Build
Vercel Deployment
```

Commands:

```bash
npm install
npm run dev
npm run test
npm run build
```

---

# 86. Deployment

Project harus:

```text
push GitHub
↓
import Vercel
↓
set environment variables
↓
deploy
```

Tidak boleh membutuhkan persistent custom server.

---

# 87. Implementation Priority

Kerjakan dalam urutan:

```text
1. Board coordinate system
2. Game rules
3. Dice
4. Player movement
5. Ladder logic
6. Chute logic
7. Winner detection
8. Board UI
9. Token animation
10. Local multiplayer
11. Bot mode
12. Online room
13. Server-authoritative dice
14. Realtime sync
15. Reconnection
16. Mobile optimization
17. PWA/offline
18. Sound
19. Themes
20. Final polish
```

Jangan mulai dari animasi kompleks sebelum core game engine benar.

---

# 88. Quality Checklist

Pastikan:

```text
100 tiles displayed correctly
zig-zag numbering correct
dice works
players move correctly
ladders work
chutes work
exact finish works
winner works
turn order works
bots work
local multiplayer works
online rooms work
server-generated dice works
reconnect works
mobile responsive
no horizontal overflow
offline bot works
production build works
```

---

# 89. Definition of Done

Game dianggap selesai jika user dapat:

```text
Open app
↓
Choose game mode
↓
Choose players
↓
Start match
↓
Roll dice
↓
Move token
↓
Climb ladders
↓
Slide down chutes
↓
Reach tile 100
↓
See winner screen
↓
Play again
```

Untuk online:

```text
Player A creates room
↓
Shares room code
↓
Player B joins
↓
Both see same board
↓
Server generates dice
↓
Moves synchronize
↓
Turns stay synchronized
↓
Winner detected correctly
↓
Rematch works
```

Aplikasi harus terasa seperti **casual multiplayer board game yang benar-benar playable**, bukan sekadar UI showcase.

Jika ada keputusan teknis yang belum dijelaskan, pilih solusi yang:

```text
simple
robust
maintainable
family-friendly
mobile-first
Vercel-compatible
```

Prioritaskan:

```text
game correctness
fair dice
smooth movement
multiplayer synchronization
mobile usability
```

dibanding dekorasi visual.

Untuk game Ular Tangga ini, bagian teknis yang paling penting adalah **mapping tile zig-zag**, **SVG ladder/chute yang responsif**, dan **dice server-authoritative untuk multiplayer online** supaya hasil lemparan tidak bisa dimanipulasi dari client.