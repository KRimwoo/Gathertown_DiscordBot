const { Client, Intents, IntentsBitField } = require("discord.js");
const { Game } = require("@gathertown/gather-game-client");
global.WebSocket = require("isomorphic-ws");

// Discord 봇 토큰과 채널 ID
const {
  GATHER_API,
  SPACE_ID,
  DISCORD_TOKEN,
} = require("./config.json");

// Discord 클라이언트 생성
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// Gather Town 게임 객체 생성
const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: GATHER_API }));

client.once("ready", () => {
  console.log("Discord bot is ready!");

  // 게임 서버에 연결
  game.connect();

  // 디스코드 클라이언트가 준비되면 Gather Town 이벤트 구독
  game.subscribeToConnection((connected) => {
    console.log("connected?", connected);
  });

  game.subscribeToEvent("playerJoins", (data, context) => {
    const playerId = context.playerId;

    // 일정 시간 지연 후 플레이어 이름을 가져옴
    setTimeout(async () => {
      const player = game.players[playerId];
      const userName = player?.name || playerId;

      console.log(`${userName} has joined the space!`);

      // 디스코드 채널에 메시지 전송
      try {
        client.guilds.cache.forEach((guild) => {
          guild.channels.cache.forEach((channel) => {
            if (channel.isTextBased()) {
              channel.send(`${userName}님이 참여하셨습니다.`);
            }
          });
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }, 1000); // 1초 지연
  });
});

// /players 커맨드 처리
client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase() === "/players") {
    const playerCount = Object.keys(game.players).length;
    console.log("Player count:", playerCount);
    if (playerCount === 0) {
      return message.channel.send("현재 참여자가 없습니다.");
    }
    else {
      let playerList = `현재 ${playerCount}명 (`;
      Object.values(game.players).forEach((player) => {
        playerList += `${player.name}, `;
      });
      playerList = playerList.slice(0, -2) + ")이 참여 중입니다.";
      return message.channel.send(playerList);
    }
  }
});

client.login(DISCORD_TOKEN);
