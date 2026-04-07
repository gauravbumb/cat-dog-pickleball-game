import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

const LANGUAGES = [
  {
    lang: "Hindi",
    native: "हिंदी",
    text: "desiprompt.dev एक AI प्रॉम्प्ट लाइब्रेरी है",
    sub: "भारतीय भाषाओं में AI prompts का खजाना",
    bg: "#FF6B35",
    accent: "#FFD700",
  },
  {
    lang: "Bengali",
    native: "বাংলা",
    text: "desiprompt.dev একটি AI prompt লাইব্রেরি",
    sub: "ভারতীয় ভাষায় AI prompts-এর ভাণ্ডার",
    bg: "#2E86AB",
    accent: "#F6AE2D",
  },
  {
    lang: "Tamil",
    native: "தமிழ்",
    text: "desiprompt.dev ஒரு AI prompt நூலகம்",
    sub: "இந்திய மொழிகளில் AI promptகளின் களஞ்சியம்",
    bg: "#A23B72",
    accent: "#F18F01",
  },
  {
    lang: "Telugu",
    native: "తెలుగు",
    text: "desiprompt.dev ఒక AI prompt లైబ్రరీ",
    sub: "భారతీయ భాషలలో AI prompts నిధి",
    bg: "#1B4332",
    accent: "#95D5B2",
  },
  {
    lang: "Kannada",
    native: "ಕನ್ನಡ",
    text: "desiprompt.dev ಒಂದು AI prompt ಲೈಬ್ರರಿ",
    sub: "ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ AI prompts ಭಂಡಾರ",
    bg: "#6A0572",
    accent: "#FFB703",
  },
  {
    lang: "Malayalam",
    native: "മലയാളം",
    text: "desiprompt.dev ഒരു AI prompt ലൈബ്രറി ആണ്",
    sub: "ഭാരതീയ ഭാഷകളിൽ AI prompts ശേഖരം",
    bg: "#003049",
    accent: "#FCBF49",
  },
  {
    lang: "Marathi",
    native: "मराठी",
    text: "desiprompt.dev एक AI प्रॉम्प्ट लायब्ररी आहे",
    sub: "भारतीय भाषांमध्ये AI prompts चा खजिना",
    bg: "#7B2D8B",
    accent: "#FF9F1C",
  },
  {
    lang: "Gujarati",
    native: "ગુજરાતી",
    text: "desiprompt.dev એક AI prompt લાઇબ્રેરી છે",
    sub: "ભારતીય ભાષાઓમાં AI prompts નો ખજાનો",
    bg: "#C1440E",
    accent: "#F2C14E",
  },
];

const FRAMES_PER_LANG = 90; // 3 seconds at 30fps
const INTRO_FRAMES = 60; // 2 second intro
const OUTRO_FRAMES = 60; // 2 second outro

// AI Avatar SVG component
const AIAvatar: React.FC<{ scale: number; accentColor: string }> = ({
  scale,
  accentColor,
}) => {
  return (
    <svg
      width={200 * scale}
      height={200 * scale}
      viewBox="0 0 200 200"
      fill="none"
    >
      {/* Outer glow ring */}
      <circle cx="100" cy="100" r="95" fill="white" opacity="0.1" />
      <circle
        cx="100"
        cy="100"
        r="90"
        stroke={accentColor}
        strokeWidth="3"
        fill="white"
        opacity="0.95"
      />

      {/* Head */}
      <ellipse cx="100" cy="85" rx="42" ry="48" fill="#FFDDB4" />

      {/* Hair */}
      <ellipse cx="100" cy="52" rx="42" ry="20" fill="#2C1810" />
      <rect x="58" y="52" width="84" height="18" fill="#2C1810" />

      {/* Face features */}
      {/* Eyes */}
      <ellipse cx="84" cy="82" rx="7" ry="8" fill="white" />
      <ellipse cx="116" cy="82" rx="7" ry="8" fill="white" />
      <circle cx="86" cy="83" r="4" fill="#1A1A2E" />
      <circle cx="118" cy="83" r="4" fill="#1A1A2E" />
      {/* Eye shine */}
      <circle cx="88" cy="81" r="1.5" fill="white" />
      <circle cx="120" cy="81" r="1.5" fill="white" />

      {/* Nose */}
      <ellipse cx="100" cy="96" rx="4" ry="3" fill="#E8A87C" />

      {/* Smile */}
      <path
        d="M 88 107 Q 100 118 112 107"
        stroke="#C0392B"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Body / Kurta */}
      <path
        d="M 68 130 Q 60 145 55 175 L 145 175 Q 140 145 132 130 Q 120 125 100 125 Q 80 125 68 130 Z"
        fill={accentColor}
      />
      {/* Kurta collar */}
      <path
        d="M 90 125 L 100 140 L 110 125"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />

      {/* Neck */}
      <rect x="92" y="118" width="16" height="12" rx="4" fill="#FFDDB4" />

      {/* AI circuit overlay on forehead */}
      <circle cx="100" cy="65" r="8" fill={accentColor} opacity="0.8" />
      <text
        x="100"
        y="69"
        textAnchor="middle"
        fontSize="9"
        fill="white"
        fontWeight="bold"
      >
        AI
      </text>

      {/* Small decorative dots */}
      <circle cx="60" cy="90" r="2" fill={accentColor} opacity="0.6" />
      <circle cx="140" cy="90" r="2" fill={accentColor} opacity="0.6" />
    </svg>
  );
};

// Animated language slide
const LanguageSlide: React.FC<{ langData: (typeof LANGUAGES)[0]; index: number }> = ({
  langData,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const exitProgress = spring({
    frame: frame - (FRAMES_PER_LANG - 20),
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const slideX = interpolate(enterProgress, [0, 1], [120, 0]);
  const exitX = interpolate(exitProgress, [0, 1], [0, -120]);
  const opacity = interpolate(
    exitProgress,
    [0, 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const avatarScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const textY = interpolate(enterProgress, [0, 1], [40, 0]);
  const textOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing glow for the avatar
  const pulse = Math.sin(frame * 0.15) * 0.5 + 0.5;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${langData.bg} 0%, ${langData.bg}CC 100%)`,
        transform: `translateX(${slideX + exitX}px)`,
        opacity,
      }}
    >
      {/* Background decorative pattern */}
      <AbsoluteFill style={{ opacity: 0.08 }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 300 + i * 80,
              height: 300 + i * 80,
              borderRadius: "50%",
              border: `2px solid ${langData.accent}`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </AbsoluteFill>

      {/* Language number badge */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 50,
          padding: "8px 24px",
          border: `2px solid ${langData.accent}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            color: langData.accent,
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          {index + 1} / 8
        </span>
      </div>

      {/* Language name top-right */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 60,
          textAlign: "right",
        }}
      >
        <div
          style={{
            color: langData.accent,
            fontSize: 36,
            fontWeight: 900,
            fontFamily: "sans-serif",
          }}
        >
          {langData.native}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 22,
            fontFamily: "sans-serif",
          }}
        >
          {langData.lang}
        </div>
      </div>

      {/* Main content layout */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          paddingTop: 40,
        }}
      >
        {/* Left: Avatar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Glow behind avatar */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: langData.accent,
                opacity: 0.15 + pulse * 0.1,
                filter: "blur(30px)",
                transform: `scale(${0.9 + avatarScale * 0.2})`,
              }}
            />
            <div
              style={{
                transform: `scale(${avatarScale})`,
              }}
            >
              <AIAvatar scale={1} accentColor={langData.accent} />
            </div>
          </div>

          {/* desiprompt.dev label */}
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 12,
              padding: "10px 24px",
              border: `2px solid ${langData.accent}`,
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              desiprompt.dev
            </span>
          </div>
        </div>

        {/* Right: Text */}
        <div
          style={{
            flex: 1,
            maxWidth: 800,
            display: "flex",
            flexDirection: "column",
            gap: 30,
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
          }}
        >
          {/* Main message */}
          <div
            style={{
              color: "white",
              fontSize: 52,
              fontWeight: 800,
              fontFamily: "sans-serif",
              lineHeight: 1.3,
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {langData.text}
          </div>

          {/* Subtitle */}
          <div
            style={{
              color: langData.accent,
              fontSize: 32,
              fontWeight: 500,
              fontFamily: "sans-serif",
              lineHeight: 1.4,
              opacity: 0.9,
            }}
          >
            {langData.sub}
          </div>

          {/* Decorative divider */}
          <div
            style={{
              height: 3,
              width: interpolate(frame, [10, 40], [0, 400], {
                extrapolateRight: "clamp",
              }),
              background: `linear-gradient(to right, ${langData.accent}, transparent)`,
              borderRadius: 2,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Bottom wave decoration */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: langData.accent,
        }}
      />
    </AbsoluteFill>
  );
};

// Intro slide
const IntroSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const opacity = interpolate(frame, [40, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = Math.sin(frame * 0.2) * 0.03 + 1;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Decorative circles */}
      {[300, 500, 700, 900].map((size, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            border: `1px solid rgba(255, 215, 0, ${0.15 - i * 0.03})`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      <div style={{ transform: `scale(${scale * pulse})`, textAlign: "center" }}>
        <div
          style={{
            color: "#FFD700",
            fontSize: 32,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: 6,
            marginBottom: 20,
            opacity: 0.8,
          }}
        >
          INTRODUCING
        </div>
        <div
          style={{
            color: "white",
            fontSize: 96,
            fontWeight: 900,
            fontFamily: "monospace",
            letterSpacing: 2,
            textShadow: "0 0 60px rgba(255, 215, 0, 0.5)",
          }}
        >
          desiprompt.dev
        </div>
        <div
          style={{
            color: "#FFD700",
            fontSize: 40,
            fontWeight: 600,
            fontFamily: "sans-serif",
            marginTop: 16,
            letterSpacing: 4,
          }}
        >
          AI Prompt Library in 8 Indian Languages
        </div>
      </div>

      {/* Bottom language flags strip */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          display: "flex",
          gap: 20,
          opacity: interpolate(frame, [20, 40], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {LANGUAGES.map((l) => (
          <div
            key={l.lang}
            style={{
              background: l.bg,
              borderRadius: 8,
              padding: "6px 16px",
              color: l.accent,
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            {l.native}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Outro slide
const OutroSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "rgba(255, 215, 0, 0.08)",
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 80,
            fontWeight: 900,
            fontFamily: "monospace",
            textShadow: "0 0 60px rgba(255, 215, 0, 0.5)",
          }}
        >
          desiprompt.dev
        </div>
        <div
          style={{
            color: "#FFD700",
            fontSize: 38,
            fontWeight: 600,
            fontFamily: "sans-serif",
            letterSpacing: 2,
          }}
        >
          Your AI Prompt Library for Bharat
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 900,
            marginTop: 10,
          }}
        >
          {LANGUAGES.map((l) => (
            <div
              key={l.lang}
              style={{
                background: l.bg,
                borderRadius: 10,
                padding: "8px 20px",
                color: l.accent,
                fontSize: 22,
                fontWeight: 800,
                fontFamily: "sans-serif",
                border: `1px solid ${l.accent}44`,
              }}
            >
              {l.native}
            </div>
          ))}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 26,
            fontFamily: "sans-serif",
            marginTop: 10,
          }}
        >
          हिंदी • বাংলা • தமிழ் • తెలుగు • ಕನ್ನಡ • മലയാളം • मराठी • ગુજરાતી
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const DesiPromptVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <IntroSlide />
      </Sequence>

      {/* Language slides */}
      {LANGUAGES.map((langData, index) => (
        <Sequence
          key={langData.lang}
          from={INTRO_FRAMES + index * FRAMES_PER_LANG}
          durationInFrames={FRAMES_PER_LANG}
        >
          <LanguageSlide langData={langData} index={index} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence
        from={INTRO_FRAMES + LANGUAGES.length * FRAMES_PER_LANG}
        durationInFrames={OUTRO_FRAMES}
      >
        <OutroSlide />
      </Sequence>
    </AbsoluteFill>
  );
};

export const DESI_PROMPT_DURATION =
  INTRO_FRAMES + LANGUAGES.length * FRAMES_PER_LANG + OUTRO_FRAMES;
