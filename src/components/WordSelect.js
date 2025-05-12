import React, { useState } from "react";

const WordSelect = ({ data = [], onSelect }) => {
  const [selectedWord, setSelectedWord] = useState(null);

  const handleSelect = (word) => {
    setSelectedWord(word);
    onSelect?.(word); // Notify parent
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 8,
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      {data.map((word, index) => (
        <button
          key={index}
          onClick={() => handleSelect(word)}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "2px solid",
            borderColor: selectedWord === word ? "#007bff" : "#ccc",
            backgroundColor: selectedWord === word ? "#007bff" : "#f0f0f0",
            color: selectedWord === word ? "#fff" : "#000",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {word}
        </button>
      ))}
    </div>
  );
};

export default WordSelect;
