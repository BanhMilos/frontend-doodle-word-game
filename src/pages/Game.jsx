import { useEffect, useRef, useState } from "react";
import useStore from "../store";
import "../styles/room.css";
import socket from "../utils/socket";
import AppImages from "core/constants/AppImages";
import DrawingBoard from "components/DrawingBoard";
import LoadingSpinner from "components/LoadingIndicator";
import WordSelect from "components/WordSelect";

export default function Game() {
  const [loading, setLoading] = useState(true);
  const { playerName } = useStore();
  const messagesEndRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isChooseWord, setIsChooseWord] = useState(false);
  const [msg, setMsg] = useState("");
  const [canChat, setCanChat] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [isGameStart, setIsGameStart] = useState(false);
  const [disableTool, setDisableTool] = useState(true);
  const [settings, setSettings] = useState({
    roomName: "",
    players: 8,
    language: "English",
    drawTime: 60,
    rounds: 1,
    turns: 3,
    wordCount: 3,
    hints: 2,
    words: [],
    guessingWord: "",
    drawingPlayer: "",
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateRoom = () => {
    setLoading(true);

    socket.emit("createRoom", {
      username: playerName,
      roomName: settings.roomName,
      occupancy: settings.players,
      maxRound: settings.rounds,
      turnsPerRound: settings.turns,
      wordsCount: settings.wordCount,
      drawTime: settings.drawTime,
      hints: settings.hints,
    });

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleStartGame = () => {
    console.log("LOG : handleStartGame");
    socket.emit("startTurn", {
      roomId: currentRoomId,
    });
  };

  const handleChooseWord = (word) => {
    setIsChooseWord(false);
    console.log(
      `LOG : handleChooseWord ${currentRoomId} ${word} ${playerName}`
    );
    socket.emit("startGuessing", {
      roomId: currentRoomId,
      word: word,
      username: playerName,
      drawTime: settings.drawTime,
    });
  };

  useEffect(() => {
    socket.on("approveJoin", (data) => {
      console.log(`LOG ; approve : ${players.length} ${JSON.stringify(data)}`);
      setCurrentRoomId(data.roomId);
      setPlayers((prev) => [
        ...prev,
        {
          id: data.username,
          username: data.username,
          avatar: data.avatar,
          score: 0,
        },
      ]);
      console.log(`LOG ; approve player : ${players.length} ${data.username}`);
    });

    const handleGetRoomData = (data) => {
      console.log(`LOG : getRoomData called ${JSON.stringify(data)}`);
      setCurrentRoomId(data.roomId);
      setPlayers(
        data.existingPlayers.map((player) => ({
          id: player.username,
          username: player.username,
          avatar: player.avatar,
          score: player.score,
        }))
      );
      setLoading(false);
    };

    socket.on("getRoomData", handleGetRoomData);
    socket.on("chatMessage", (data) => setMessages((prev) => [...prev, data]));
    socket.on("startTurn", (data) => {
      setIsGameStart(true);
      handleSettingChange("drawingPlayer", data.username);
      setDisableTool(playerName !== data.username);
      console.log(`LOG : ${data.username} ${playerName}`);
      console.log(`LOG : ${data.username === playerName}`);
      console.log(`LOG : disableTool ${disableTool}`);
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Round ${data.round} turn ${data.turn} started`,
        },
      ]);
      setCanChat(true);
      if (data.username === playerName)
        socket.emit("chooseWord", {
          username: playerName,
          wordsCount: settings.wordCount,
          roomId: currentRoomId,
        });
    });
    socket.on("chooseWord", (data) => {
      if (data.username === playerName) {
        handleSettingChange("words", data.words);
        setIsChooseWord(true);
      }
      console.log(`LOG : chooseWord ${JSON.stringify(data)}`);
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `${data.username} are choosing words`,
        },
      ]);
    });
    socket.on("startGuessing", (data) => {
      console.log(
        `LOG : startGuessing ${playerName} ${data.username} ${data.word}`
      );
      handleSettingChange("guessingWord", data.word);
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Start guessing the word chosen by ${data.username}`,
        },
      ]);
    });
    socket.on("drawTime", (data) => {
      setTimer(data.drawTime);
    });
    socket.on("guessingTimeOver", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Guessing time over, the word was ${data.word}`,
        },
      ]);
    });
    socket.on("guessedCorrectly", (data) => {
      console.log(`LOG : guessedCorrectly ${JSON.stringify(data)}`);
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.username === data.username
            ? { ...player, score: data.score }
            : player
        )
      );
    });
    socket.on("gameOver", (data) => {
      handleSettingChange("words", []);
      handleSettingChange("guessingWord", "");
      handleSettingChange("drawingPlayer", "");
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Game over!!!!!!!!!`,
        },
      ]);
    });
    socket.on("leaderboard", (data) => {
      console.log(JSON.stringify(data));
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: data
            ? "🏆 Leaderboard:\n" +
              Object.entries(data)
                .sort((a, b) => b[1] - a[1])
                .map(
                  ([username, score], index) =>
                    `${index + 1}. ${username}: ${score}`
                )
                .join("\n")
            : "🏆 Leaderboard chưa có dữ liệu.",
        },
      ]);
    });
    socket.emit("getRoomData", { username: playerName });
    return () => {
      socket.off("approveJoin");
      socket.off("chatMessage");
      socket.off("getRoomData");
      socket.off("startTurn");
      socket.off("chooseWord");
      socket.off("startGuessing");
      socket.off("drawTime");
      socket.off("guessingTimeOver");
      socket.off("gameOver");
      socket.off("leaderboard");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!msg) return;
    if (msg.trim() === settings.guessingWord) {
      if (canChat) {
        console.log("LOG : client called guessedCorrectly");
        socket.emit("guessedCorrectly", {
          username: playerName,
          roomId: currentRoomId,
          message: msg,
          timer: timer,
        });
        setCanChat(false);
        setMsg("");
      }
      return;
    }
    socket.emit("chatMessage", {
      username: playerName,
      message: msg,
      roomId: currentRoomId,
    });
    setMsg("");
  };

  return (
    <div id="game-room">
      {loading && <LoadingSpinner />}
      {isChooseWord && (
        <WordSelect
          data={settings.words}
          onSelect={(word) => handleChooseWord(word)}
        />
      )}
      <div id="game-wrapper">
        <div id="game-logo">
          <img src={AppImages.Logo} alt="Logo" />
          <div style={{ width: "728px", height: "90px" }} />
        </div>
        <div id="game-bar">
          <div id="game-clock">
            <span className="timer">{timer}</span>
          </div>
          <div id="game-round">
            <div className="text">Round 1 of 3</div>
          </div>
          <div id="game-word">
            <div className="description">
              {!settings.guessingWord
                ? "Waiting"
                : playerName === settings.drawingPlayer
                ? settings.guessingWord
                : `${settings.guessingWord.length} letters`}
            </div>
            {/*<span className="word-hint">____asdasd__</span>*/}
          </div>
        </div>
        <div id="game-players">
          <div className="players-list">
            {players.map((p, index) => (
              <div
                key={p.id}
                className={`player ${
                  p.username === playerName ? "current-player" : ""
                }`}
              >
                <span className="player-rank">#{index + 1}</span>
                <span className="player-avatar">{p.avatar}</span>
                <span className="player-name">
                  {p.username}
                  {p.username === playerName && " (You)"}
                </span>
                <span className="player-score">{p.score ?? 0}</span>
                <span
                  className={`status ${
                    p.username === "Ayush Sharma" ? "drawing" : "guessed"
                  }`}
                ></span>
              </div>
            ))}
          </div>
        </div>
        <div id="game-players-footer"></div>
        <div id="game-canvas">
          <DrawingBoard
            disableTool={disableTool}
            socket={socket}
            roomId={currentRoomId}
            username={playerName}
          />
          <div
            className={`overlay ${isGameStart ? "hidden" : ""}`}
            style={{ display: isGameStart ? "none" : "block" }}
          ></div>
          <div
            className={`overlay-content ${isGameStart ? "hidden" : ""}`}
            style={{ top: "0%", display: isGameStart ? "none" : "block" }}
          >
            <div className="room show">
              <div className="settings-form">
                <div className="key">
                  <img src={AppImages.Name} />
                  <span data-translate="text">Roomname :</span>
                </div>
                <div className="value">
                  <input
                    type="text"
                    value={settings.roomName}
                    onChange={(e) =>
                      handleSettingChange("roomName", e.target.value)
                    }
                  />
                </div>
                <div className="key">
                  <img src={AppImages.Player} />
                  <span data-translate="text">Players</span>
                </div>
                <div className="value">
                  <select
                    value={settings.players}
                    onChange={(e) =>
                      handleSettingChange("players", parseInt(e.target.value))
                    }
                  >
                    {[...Array(15).keys()].map((i) => (
                      <option key={i + 2} value={i + 2}>
                        {i + 2}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="key">
                  <img src={AppImages.Language} />
                  <label>Language</label>
                </div>
                <div className="value">
                  <select
                    value={settings.language}
                    onChange={(e) =>
                      handleSettingChange("language", e.target.value)
                    }
                  >
                    <option value="English">English</option>
                    <option value="Vietnamese">Vietnamese</option>
                  </select>
                </div>
                <div className="key">
                  <img src={AppImages.DrawTime} />
                  <label>Draw time</label>
                </div>
                <div className="value">
                  <select
                    value={settings.drawTime}
                    onChange={(e) =>
                      handleSettingChange("drawTime", parseInt(e.target.value))
                    }
                  >
                    {[30, 60, 80, 100, 120].map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="key">
                  <img src={AppImages.Round} />
                  <label>Rounds</label>
                </div>
                <div className="value">
                  <select
                    value={settings.rounds}
                    onChange={(e) =>
                      handleSettingChange("rounds", parseInt(e.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((round) => (
                      <option key={round} value={round}>
                        {round}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="key">
                  <img src={AppImages.WordCount} />
                  <label>Word Count</label>
                </div>
                <div className="value">
                  <select
                    value={settings.wordCount}
                    onChange={(e) =>
                      handleSettingChange("wordCount", parseInt(e.target.value))
                    }
                  >
                    {[1, 2, 3, 4].map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="key">
                  <img src={AppImages.Hints} />
                  <label>Hints</label>
                </div>
                <div className="value">
                  <select
                    value={settings.hints}
                    onChange={(e) =>
                      handleSettingChange("hints", parseInt(e.target.value))
                    }
                  >
                    {[0, 1, 2, 3].map((hint) => (
                      <option key={hint} value={hint}>
                        {hint}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="settings-buttons">
                <button onClick={handleCreateRoom}>Create</button>
                <button
                  onClick={handleStartGame}
                  disabled={players.length >= 2 ? false : true}
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
        <div id="game-chat">
          <div className="chat-content">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-message ${
                  m.username === playerName ? "highlight" : ""
                }`}
              >
                <span className="message-username">{m.username}</span>:{" "}
                {m.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <input
            className="chat-input"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                sendMessage();
              }
            }}
            placeholder="Type your guess..."
          />
        </div>
      </div>
    </div>
  );
}
