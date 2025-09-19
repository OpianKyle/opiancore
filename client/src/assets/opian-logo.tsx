import logoImage from './opian-core-logo.png';

interface OpianLogoProps {
  className?: string;
}

export default function OpianLogo({ className = "h-12 w-auto" }: OpianLogoProps) {
  return (
    <img
      src={logoImage}
      alt="Opian Core"
      className={className}
    />
  );
}
