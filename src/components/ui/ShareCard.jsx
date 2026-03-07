import React, { useRef, useCallback, useState, useEffect } from "react";
import { getNextRace, getDaysUntil } from "../../data/f1-calendar-2026";

const CARD_WIDTH = 600;
const CARD_HEIGHT = 340;
const DPR = 2;

const ShareCard = ({ quizTitle, score, totalQuestions, answers, correctAnswers, username, rank }) => {
  const nextRace = getNextRace();
  const canvasRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    canvas.width = CARD_WIDTH * DPR;
    canvas.height = CARD_HEIGHT * DPR;
    const ctx = canvas.getContext("2d");
    ctx.scale(DPR, DPR);

    // Background
    ctx.fillStyle = "#0C0C12";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Subtle radial glow behind score area (right side)
    const glow = ctx.createRadialGradient(460, 140, 0, 460, 140, 220);
    glow.addColorStop(0, "rgba(232, 56, 56, 0.07)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Red accent line top
    ctx.fillStyle = "#E83838";
    ctx.fillRect(0, 0, CARD_WIDTH, 3);

    // Border
    ctx.strokeStyle = "rgba(40, 40, 47, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, CARD_WIDTH - 1, CARD_HEIGHT - 1);

    // ── RIGHT SIDE: Big score ──
    ctx.fillStyle = "#EDEDF0";
    ctx.font = "700 120px 'JetBrains Mono', 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${score}`, CARD_WIDTH - 36, 160);

    // "/total" smaller, muted, below score
    ctx.fillStyle = "#7A7A94";
    ctx.font = "500 32px 'JetBrains Mono', 'Courier New', monospace";
    ctx.fillText(`/ ${totalQuestions}`, CARD_WIDTH - 36, 198);

    ctx.textAlign = "left"; // reset

    // ── LEFT SIDE: Details ──

    // Branding
    ctx.fillStyle = "#7A7A94";
    ctx.font = "600 10px 'Outfit', 'Inter', sans-serif";
    ctx.fillText("WE-CHECK.ING", 28, 30);

    // Quiz title
    ctx.fillStyle = "#EDEDF0";
    ctx.font = "700 22px 'Outfit', 'Inter', sans-serif";
    // Truncate title if too long to prevent overlap with score
    let title = quizTitle;
    const maxTitleWidth = 320;
    while (ctx.measureText(title).width > maxTitleWidth && title.length > 3) {
      title = title.slice(0, -1);
    }
    if (title !== quizTitle) title += "…";
    ctx.fillText(title, 28, 62);

    // Username + rank
    ctx.fillStyle = "#9090A8";
    ctx.font = "500 14px 'Outfit', 'Inter', sans-serif";
    const userLine = rank ? `${username}  ·  #${rank}` : username;
    ctx.fillText(userLine, 28, 88);

    // Prediction grid — colored squares
    const gridY = 112;
    const squareSize = 24;
    const gap = 5;
    const questionKeys = Object.keys(answers).sort();
    const maxPerRow = Math.floor((maxTitleWidth) / (squareSize + gap));

    questionKeys.forEach((key, i) => {
      const idx = parseInt(key.replace("q", "")) - 1;
      const userAnswer = answers[key];
      const correct = correctAnswers?.[idx];
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const x = 28 + col * (squareSize + gap);
      const y = gridY + row * (squareSize + gap);

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.roundRect(x, y + 1, squareSize, squareSize, 4);
      ctx.fill();

      // Color
      if (!correct) {
        ctx.fillStyle = "#28282F";
      } else if (userAnswer === correct) {
        ctx.fillStyle = "#2DD55B";
      } else {
        ctx.fillStyle = "#E83838";
      }
      ctx.beginPath();
      ctx.roundRect(x, y, squareSize, squareSize, 4);
      ctx.fill();

      // Highlight
      if (correct) {
        const hl = ctx.createLinearGradient(x, y, x, y + squareSize);
        hl.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        hl.addColorStop(0.5, "transparent");
        ctx.fillStyle = hl;
        ctx.beginPath();
        ctx.roundRect(x, y, squareSize, squareSize, 4);
        ctx.fill();
      }
    });

    // ── BOTTOM BAR ──
    const barH = nextRace ? 66 : 42;
    const barY = CARD_HEIGHT - barH;
    ctx.fillStyle = "#1A1A24";
    ctx.fillRect(0, barY, CARD_WIDTH, barH);
    ctx.fillStyle = "#28282F";
    ctx.fillRect(0, barY, CARD_WIDTH, 1);

    // Tagline + URL row
    ctx.fillStyle = "#7A7A94";
    ctx.font = "italic 400 12px 'Outfit', 'Inter', sans-serif";
    ctx.fillText("The F1 quiz where nobody knows the answer", 28, barY + 22);

    ctx.fillStyle = "#E83838";
    ctx.font = "700 12px 'Outfit', 'Inter', sans-serif";
    const urlText = "we-check.ing";
    const urlWidth = ctx.measureText(urlText).width;
    ctx.fillText(urlText, CARD_WIDTH - 28 - urlWidth, barY + 22);

    // Next GP row
    if (nextRace) {
      const days = getDaysUntil(nextRace.date);
      const gpText = `Next up: ${nextRace.name} · ${days} day${days === 1 ? "" : "s"} away`;
      ctx.fillStyle = "#9090A8";
      ctx.font = "500 11px 'Outfit', 'Inter', sans-serif";
      ctx.fillText(gpText, 28, barY + 48);

      ctx.fillStyle = "#EDEDF0";
      ctx.font = "600 11px 'Outfit', 'Inter', sans-serif";
      const ctaText = "Think you can beat this? →";
      const ctaWidth = ctx.measureText(ctaText).width;
      ctx.fillText(ctaText, CARD_WIDTH - 28 - ctaWidth, barY + 48);
    }

    return canvas;
  }, [quizTitle, score, totalQuestions, answers, correctAnswers, username, rank, nextRace]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = generateImage();
    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [generateImage]);

  const handleDownload = () => {
    const canvas = generateImage();
    const dataUrl = canvas.toDataURL("image/png");
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // iOS Safari blocks async window.open — use synchronous data URL
      const win = window.open();
      if (win) {
        win.document.write(
          `<html><head><title>Save Image</title><meta name="viewport" content="width=device-width"></head>` +
          `<body style="margin:0;display:flex;justify-content:center;background:#000">` +
          `<img src="${dataUrl}" style="max-width:100%;height:auto" />` +
          `</body></html>`
        );
        win.document.close();
      }
    } else {
      const link = document.createElement("a");
      link.download = `we-check-ing-${quizTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleShare = async () => {
    const canvas = generateImage();
    const shareText = `I scored ${score}/${totalQuestions} on the ${quizTitle} quiz! Can you beat me?`;
    const shareUrl = "https://we-check.ing";

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "result.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          text: shareText,
          url: shareUrl,
          files: [file],
        });
        return;
      }
    } catch (err) {
      if (err.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="share-card">
      <canvas
        ref={canvasRef}
        width={CARD_WIDTH * DPR}
        height={CARD_HEIGHT * DPR}
        style={{ display: "none" }}
      />
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Share card preview"
          className="share-card-preview"
        />
      )}
      <div className="share-card-actions">
        <button className="btn btn-secondary share-card-desktop-only" onClick={handleDownload}>
          Save Image
        </button>
        <button className="btn" onClick={handleShare}>
          Broadcast
        </button>
      </div>
    </div>
  );
};

export default ShareCard;
