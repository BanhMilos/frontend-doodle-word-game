import { useCallback, useEffect, useRef, useState } from "react";
import useStore from "../store";
import "../styles/room.css";
import socket from "../utils/socket";
import AppImages from "core/constants/AppImages";
import DrawingBoard from "components/DrawingBoard";
import LoadingSpinner from "components/LoadingIndicator";
import WordSelect from "components/WordSelect";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from;

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

  const handleSettingChange = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = async () => {
    if (currentRoomId) {
      await navigator.clipboard.writeText(currentRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateRoom = async () => {
    if (currentRoomId) {
      socket.emit("updateRoom", {
        roomId: currentRoomId,
        username: playerName,
        roomName: settings.roomName,
        occupancy: settings.players,
        maxRound: settings.rounds,
        turnsPerRound: settings.turns,
        wordsCount: settings.wordCount,
        drawTime: settings.drawTime,
        hints: settings.hints,
      });
    }
    console.log(`LOG : handleUpdateRoom ${currentRoomId}`);
  };

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const handleCreateRoom = useCallback(() => {
    console.log("LOG : handleCreateRoom");
    setLoading(true);
    socket.emit("createRoom", {
      username: playerName,
      roomName: settingsRef.current.roomName,
      occupancy: settingsRef.current.players,
      maxRound: settingsRef.current.rounds,
      turnsPerRound: settingsRef.current.turns,
      wordsCount: settingsRef.current.wordCount,
      drawTime: settingsRef.current.drawTime,
      hints: settingsRef.current.hints,
    });
    setTimeout(() => setLoading(false), 1000);
  }, [playerName]);

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
    if (!playerName) {
      navigate("/");
    }
  }, [playerName, navigate]);

  useEffect(() => {
    console.log(`LOG : useEffect createRoom ${from}`);
    if (from === "createRoom") handleCreateRoom();
  }, [from, handleCreateRoom]);

  useEffect(() => {
    console.log(`LOG : useEffect play ${from} ${playerName}`);
    if (from === "play") socket.emit("getRoomData", { username: playerName });
  }, [from, playerName]);

  useEffect(() => {
    console.log("LOG : useEffect socket");
    socket.on("approveJoin", (data) => {
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

    socket.on("getRoomData", (data) => {
      setCurrentRoomId(data.roomId);
      setPlayers(
        data.existingPlayers.map((player) => ({
          id: player.username,
          username: player.username,
          avatar: player.avatar,
          score: player.score,
        }))
      );
      console.log(`LOG : getRoomData called ${JSON.stringify(data)}`);
      console.log(
        `LOG : getRoomData players ${data.existingPlayers.length} ${players.length}`
      );
      setLoading(false);
    });

    socket.on("chatMessage", (data) => setMessages((prev) => [...prev, data]));

    socket.on("startTurn", (data) => {
      setIsGameStart(true);
      handleSettingChange("drawingPlayer", data.username);
      setDisableTool(playerName !== data.username);
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Round ${data.round} turn ${data.turn} started`,
        },
      ]);
      setCanChat(true);
      if (data.username === playerName) {
        socket.emit("chooseWord", {
          username: playerName,
          wordsCount: settings.wordCount,
          roomId: currentRoomId,
        });
      }
    });

    socket.on("chooseWord", (data) => {
      if (data.username === playerName) {
        handleSettingChange("words", data.words);
        setIsChooseWord(true);
      }
      setMessages((prev) => [
        ...prev,
        { username: "System", message: `${data.username} is choosing a word` },
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

    socket.on("drawTime", (data) => setTimer(data.drawTime));

    socket.on("guessingTimeOver", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Guessing time over. The word was: ${data.word}`,
        },
      ]);
    });

    socket.on("guessedCorrectly", (data) => {
      setPlayers((prev) =>
        prev.map((player) =>
          player.username === data.username
            ? { ...player, score: data.score }
            : player
        )
      );
    });

    socket.on("gameOver", () => {
      handleSettingChange("words", []);
      handleSettingChange("guessingWord", "");
      handleSettingChange("drawingPlayer", "");
      setMessages((prev) => [
        ...prev,
        { username: "System", message: `Game over!` },
      ]);
    });

    socket.on("leaderboard", (data) => {
      const leaderboard = data
        ? "\ud83c\udfc6 Leaderboard:\n" +
          Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .map((entry, i) => `${i + 1}. ${entry[0]}: ${entry[1]}`)
            .join("\n")
        : "\ud83c\udfc6 Leaderboard has no data.";
      setMessages((prev) => [
        ...prev,
        { username: "System", message: leaderboard },
      ]);
    });

    //socket.emit("getRoomData", { username: playerName });

    return () => {
      socket.off("approveJoin");
      socket.off("chatMessage");
      socket.off("getRoomData");
      socket.off("startTurn");
      socket.off("chooseWord");
      socket.off("startGuessing");
      socket.off("drawTime");
      socket.off("guessingTimeOver");
      socket.off("guessedCorrectly");
      socket.off("gameOver");
      socket.off("leaderboard");
    };
  }, [
    currentRoomId,
    disableTool,
    handleSettingChange,
    playerName,
    settings.wordCount,
    players.length,
  ]);

  const playerNameRef = useRef(playerName);
  const roomIdRef = useRef(currentRoomId);

  useEffect(() => {
    playerNameRef.current = playerName;
    roomIdRef.current = currentRoomId;
  }, [playerName, currentRoomId]);

  useEffect(() => {
    return () => {
      console.log(`leave room ${playerNameRef.current} ${roomIdRef.current}`);
      socket.emit(`leaveRoom`, {
        username: playerNameRef.current,
        roomId: roomIdRef.current,
      });
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
              </div>
            ))}
          </div>
        </div>
        <div id="game-players-footer"></div>
        <div id="game-chat-input-mobile">
          <div className="chat-form">
            <input
            className="chat-input-mobile"
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
                  <img src={AppImages.Name} alt="" />
                  <span data-translate="text">RoomId :</span>
                </div>
                <div
                  className="value"
                  style={{ position: "relative", display: "inline-block" }}
                >
                  {copied && (
                    <span
                      style={{
                        position: "absolute",
                        left: "-60px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "12px",
                        color: "white",
                      }}
                    >
                      Copied!
                    </span>
                  )}
                  <input
                    type="text"
                    readOnly
                    value={currentRoomId || ""}
                    onClick={handleCopy}
                    style={{
                      cursor: currentRoomId ? "pointer" : "not-allowed",
                    }}
                  />
                </div>
                <div className="key">
                  <img src={AppImages.Player} alt="" />
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
                  <img src={AppImages.Language} alt="" />
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
                  <img src={AppImages.DrawTime} alt="" />
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
                  <img src={AppImages.Round} alt="" />
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
                  <img src={AppImages.WordCount} alt="" />
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
                  <img src={AppImages.Hints} alt="" />
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
                <button onClick={handleUpdateRoom} disabled={
                    players.length < 1 || playerName !== players[0].username
                  }>Update</button>
                <button
                  onClick={handleStartGame}
                  disabled={
                    players.length < 2 || playerName !== players[0].username
                  }
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
