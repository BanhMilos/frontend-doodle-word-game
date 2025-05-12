import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle } from "react-konva";
import AppColors from "core/constants/AppColors";
import AppImages from "core/constants/AppImages";

const DrawingBoard = ({ disableTool, showTooltip, socket, roomId, username }) => {
  const [lines, setLines] = useState([]);
  const [color, setColor] = useState("black");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isCursorInside, setIsCursorInside] = useState(false);
  const isDrawing = useRef(false);
  const numColumn = Math.ceil(AppColors.colors.length / 2);

  const clearBoard = () => {
    setLines([]);
  };

  const undoLastLine = () => {
    setLines(lines.slice(0, -1));
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();

    isDrawing.current = true;
    setLines([
      ...lines,
      {
        points: [pos.x, pos.y],
        stroke: color,
        strokeWidth: 2,
      },
    ]);
    socket.emit("drawing", {
      roomId: roomId,
      username: username,
      drawingData: lines,
    });
  };

  // Handle mouse move event for drawing
  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setMousePos(point);

    if (!isDrawing.current) return;

    const lastLine = lines[lines.length - 1];
    const newPoints = lastLine.points.concat([point.x, point.y]);

    const updatedLine = {
      ...lastLine,
      points: newPoints,
    };

    const updatedLines = [...lines.slice(0, -1), updatedLine];
    setLines(updatedLines);
    socket.emit("drawing", {
      roomId: roomId,
      username: username,
      drawingData: lines,
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const tooltipStyles = showTooltip
    ? { display: "block", position: "absolute", top: "10px", left: "10px" }
    : { display: "none" };

  useEffect(() => {
    socket.on("clearCanvas", () => {
      setLines([]);
    });
    socket.on("drawing", (data) => {
      if (username === data.from) return;
      setLines(data.drawingData);
    });
    return () => {
      socket.off("drawing");
      socket.off("clearCanvas");
    };
  });

  const handleColorTooltip = (color) => {
    return `Current color: ${color}`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "white",
      }}
    >
      <div style={tooltipStyles}>
        <span>{handleColorTooltip(color)}</span>
      </div>

      <Stage
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onMouseEnter={() => setIsCursorInside(true)}
        onMouseLeave={() => setIsCursorInside(false)}
        style={{
          border: "1px solid #ccc",
          cursor: isCursorInside ? "none" : "default",
        }}
      >
        <Layer>
          <Rect width={800} height={600} fill="white" />
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          ))}

          {/* Cursor Circle */}
          {isCursorInside && (
            <Circle
              x={mousePos.x}
              y={mousePos.y}
              radius={5}
              fill={color}
              stroke="black"
              strokeWidth={1}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      <div
        style={{
          display: disableTool ? "none" : "flex",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${numColumn}, 24px)`,
          }}
        >
          {AppColors.colors.map((c, i) => {
            return (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: c,
                  border: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  outline: "none",
                }}
                title={c}
              />
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            right: 0,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={undoLastLine}
            title="Undo"
            style={{
              width: 48,
              height: 48,
              backgroundColor: "white",
              color: "white",
              fontWeight: "bold",
              fontSize: 14,
              border: "none",
              borderRadius: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={AppImages.Undo}
              alt="Undo"
              style={{ width: 36, height: 36 }}
            />
          </button>

          <button
            onClick={clearBoard}
            title="Clear Board"
            style={{
              width: 48,
              height: 48,
              backgroundColor: "white",
              color: "white",
              fontWeight: "bold",
              fontSize: 14,
              border: "none",
              borderRadius: 2,
              cursor: "pointer",
            }}
          >
            <img
              src={AppImages.Clear}
              alt="Clear"
              style={{ width: 40, height: 40 }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingBoard;
