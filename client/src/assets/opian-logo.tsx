interface OpianLogoProps {
  className?: string;
}

export default function OpianLogo({ className = "h-12 w-auto" }: OpianLogoProps) {
  return (
    <svg
      viewBox="0 0 800 300"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer blue circle */}
      <circle
        cx="150"
        cy="150"
        r="130"
        fill="#0B3C78"
        stroke="#fff"
        strokeWidth="20"
      />
      {/* Inner green circle */}
      <circle
        cx="150"
        cy="150"
        r="80"
        fill="#2E7D32"
      />
      {/* Center white circle */}
      <circle
        cx="150"
        cy="150"
        r="40"
        fill="#fff"
      />
      {/* OPIAN text */}
      <text
        x="300"
        y="120"
        fontFamily="Inter, sans-serif"
        fontSize="80"
        fontWeight="700"
        fill="#0B3C78"
      >
        OPIAN
      </text>
      {/* CORE text */}
      <text
        x="300"
        y="200"
        fontFamily="Inter, sans-serif"
        fontSize="40"
        fontWeight="400"
        fill="#333"
      >
        CORE
      </text>
      {/* TM symbol */}
      <text
        x="720"
        y="80"
        fontFamily="Inter, sans-serif"
        fontSize="24"
        fontWeight="400"
        fill="#333"
      >
        TM
      </text>
    </svg>
  );
}
