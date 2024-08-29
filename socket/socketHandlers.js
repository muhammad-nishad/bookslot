import Room from "../models/Room.js";

const questions = [
  { question: "What is 2 + 2?", answer: "4" },
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "Who wrote 'To Kill a Mockingbird'?", answer: "Harper Lee" },
  {
    question: "What is the largest planet in our solar system?",
    answer: "Jupiter",
  },
  { question: "What is the chemical symbol for gold?", answer: "Au" },
  { question: "How many continents are there on Earth?", answer: "7" },
  { question: "What year did the Titanic sink?", answer: "1912" },
  { question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci" },
  {
    question: "What is the hardest natural substance on Earth?",
    answer: "Diamond",
  },
  {
    question: "What is the smallest country in the world by land area?",
    answer: "Vatican City",
  },
];
const setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("getAvailableRooms", async () => {
      try {
        const rooms = await Room.find({ status: 'available', deleted: false });
        socket.emit("availableRooms", rooms);
      } catch (error) {
        socket.emit("message", { text: "Error fetching available rooms." });
      }
    });

    socket.on("findRoom", async (data) => {
      const { userId } = data;
      try {
        let room = await Room.findOne({ status: 'available', deleted: false });
        const existingRoom = await Room.findOne({ users: userId, deleted: false });
        if (existingRoom) {
          socket.emit("message", { text: "You are already in a room." });
          return;
        }
        if (!room) {
          console.log("Creating a new room");
          room = new Room({ users: [userId], status: "available" });
          await room.save();
          socket.emit("message", { text: "New room created. Waiting for another player." });
          console.log(`Created a new room ${room._id.toString()}`);
        } else {
          room.users.push(userId);
          if (room.users.length === 2) {
            room.status = "full";
          }
          await room.save();
          socket.join(room._id.toString());
          io.to(room._id.toString()).emit("message", { text: `User ${userId} has joined the room.` });
        }
      } catch (error) {
        socket.emit("message", { text: "Error finding or creating room." });
      }
    });

    socket.on("startGame", async (roomId) => {
      try {
        const room = await Room.findOne({ _id: roomId, deleted: false });
        if (!room || room.status !== "full") {
          socket.emit("message", { text: "Room is not ready or doesn't exist." });
          return;
        }

        room.status = "in-progress";
        await room.save();

        const roomSockets = io.sockets.adapter.rooms.get(roomId) || new Set();
        const users = Array.from(roomSockets).slice(0, 2);
        if (users.length < 2) {
          socket.emit("message", { text: "Not enough players to start the game." });
          return;
        }

        let scores = {};
        let questionCount = 0;
        const maxQuestions = 5;
        const gameDuration = 50000;
        const startTime = Date.now();
        const gameTimer = setInterval(async () => {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime >= gameDuration || questionCount >= maxQuestions) {
            clearInterval(gameTimer);
            await endGame(roomId, scores);
          }
        }, 1000);

        users.forEach((user) => {
          const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
          io.to(user).emit("question", randomQuestion);
        });

        socket.on("answer", (data) => {
          const { userId, questionIndex, answer } = data;

          if (!questions[questionIndex] || !userId) {
            socket.emit("message", { text: "Invalid answer data received." });
            return;
          }

          if (!scores[userId]) scores[userId] = 0;
          if (questions[questionIndex].answer === answer) {
            scores[userId] += 10;
          }

          questionCount++;
        });

        socket.on("disconnect", async () => {
          clearInterval(gameTimer);
          try {
            const userRooms = await Room.find({ users: socket.id, deleted: false });
            for (const userRoom of userRooms) {
              userRoom.users = userRoom.users.filter(userId => userId !== socket.id);
              if (userRoom.users.length === 0) {
                userRoom.status = "available";
              }
              await userRoom.save();
              io.to(userRoom._id.toString()).emit("message", { text: `User ${socket.id} has left the room.` });
            }
          } catch (error) {
            console.error("Error handling disconnect:", error);
          }
          console.log(`User disconnected: ${socket.id}`);
        });
      } catch (error) {
        socket.emit("message", { text: "Error starting the game." });
      }
    });
  });
};

const endGame = async (roomId, scores) => {
  clearInterval(gameTimer); 
  io.to(roomId).emit('gameOver', { scores });
  await Room.findByIdAndUpdate(roomId, { deleted: true });
};

export default setupSocketHandlers;
