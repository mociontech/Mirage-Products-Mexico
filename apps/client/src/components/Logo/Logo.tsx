import mirageLogo from '../../assets/images/mirage-logo.svg';

interface LogoProps {
  width?: number;
}

export function Logo({ width = 300 }: LogoProps) {
  return <img src={mirageLogo} alt="Mirage" width={width} />;
}
