import { useEffect, useState } from "react";
import AppImages from "core/constants/AppImages";
import "../styles/loginandregister.css";

const carouselImages = AppImages.HowToPlay;

export default function HowToPlay() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bottom">
      <div className="footer">
        <div className="section-container">
          {/* Section 1 */}
          <div className="section panel">
            <img
              src={AppImages.Question}
              alt="Undo"
              className=""
              style={{
                position: "absolute",
                top: "18px",
                left: "18px",
                width: "60px",
                height: "40px",
                filter: "drop-shadow(3px 3px 0 rgba(0, 0, 0, .25))",
              }}
            />
            <h2
              className=""
              style={{
                margin: "0",
                marginBottom: "20px",
                width: "100%",
                textAlign: "center",
              }}
            >
              How to Play
            </h2>
            <p className="">
              Doodle Game is a free online multiplayer drawing and guessing
              game, inspired by Pictionary.
            </p>
            <p>In each round, one player draws a
              word they’ve chosen while the others try to guess it as quickly as
              possible to earn points. The game continues for several rounds,
              and the player with the highest score at the end is declared the
              winner. </p>
              <p>Get ready to draw, guess, and have fun!</p>
          </div>

          {/* Section 2 */}
          <div className="section panel">
            <img
              src={AppImages.Tutorial}
              alt="Undo"
              className="w-9 h-9 mr-2"
              style={{
                position: "absolute",
                top: "18px",
                left: "18px",
                width: "32px",
                height: "40px",
                filter: "drop-shadow(3px 3px 0 rgba(0, 0, 0, .25))",
              }}
            />
            <h2
              className=""
              style={{
                margin: "0",
                marginBottom: "20px",
                width: "100%",
                textAlign: "center",
              }}
            >
              Step-by-step
            </h2>
            <div
              className=""
              style={{
                position: "relative",
                width: "100%",
              }}
            >
              <img
                src={carouselImages[currentImage]}
                alt={`Step ${currentImage + 1}`}
                style={{ width: "100%", height: "auto" }}
                className=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
