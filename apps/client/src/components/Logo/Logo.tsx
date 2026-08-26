import mirageLogo from '../../assets/images/mirage-logo.svg';

interface LogoProps {
  width?: number;
  onClick?: () => void;
}

export function Logo({ width = 300, onClick }: LogoProps) {
  return <img src={mirageLogo} alt="Mirage" width={width} onClick={onClick} />;
}
