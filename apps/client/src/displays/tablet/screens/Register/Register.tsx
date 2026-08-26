import { useState } from 'react';
import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { IdInput } from '../../../../components/IdInput/IdInput';
import { Logo } from '../../../../components/Logo/Logo';
import { TextField } from '../../../../components/TextField/TextField';
import { EMPTY_SESSION, generateParticipantCode, type TabletSession } from '../../session';
import styles from './Register.module.css';

const AREAS = ['Ventas', 'Mercadotecnia', 'Adquisiciones', 'Operaciones', 'Finanzas'];

interface RegisterProps {
  onComplete: (session: TabletSession) => void;
}

type RegisterView = 'form' | 'codeEntry' | 'codeDisplay';

/**
 * Registro con dos caminos, igual que en la experiencia de memory match: se
 * registran y les damos un codigo para guardar, o si ya tienen codigo lo
 * ingresan directamente. La validacion real del codigo contra un backend
 * llega en la Fase 7 (outbox/data hub); por ahora un codigo de 6 digitos
 * bien formado alcanza para identificar la sesion.
 */
export function Register({ onComplete }: RegisterProps) {
  const [view, setView] = useState<RegisterView>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [area, setArea] = useState(AREAS[0]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');

  const skip = () => onComplete(EMPTY_SESSION);

  const submitForm = () => {
    setGeneratedCode(generateParticipantCode());
    setView('codeDisplay');
  };

  if (view === 'codeEntry') {
    return (
      <BrandFrame>
        <div className={styles.center}>
          <Logo width={300} />
          <h1 className={styles.title}>CODIGO ID</h1>
          <IdInput value={enteredCode} onChange={setEnteredCode} onComplete={(code) => onComplete({ name: null, code })} />
          <div className={styles.linkRow}>
            <button type="button" className={styles.textLink} onClick={() => setView('form')}>
              ir a Registro
            </button>
            <Button variant="secondary" onClick={skip}>
              Continua sin registro
            </Button>
          </div>
        </div>
      </BrandFrame>
    );
  }

  if (view === 'codeDisplay') {
    return (
      <BrandFrame>
        <div className={styles.center}>
          <Logo width={300} />
          <h1 className={styles.title}>CODIGO ID</h1>
          <p className={styles.helpText}>Guarda este codigo: la proxima vez lo ingresas y saltas el registro.</p>
          <IdInput value={generatedCode} onChange={() => {}} readOnly />
          <div className={styles.submitRow}>
            <Button onClick={() => onComplete({ name: name || null, code: generatedCode })}>Finalizar</Button>
          </div>
        </div>
      </BrandFrame>
    );
  }

  return (
    <BrandFrame>
      <div className={styles.center}>
        <Logo width={300} />
        <h1 className={styles.title}>REGISTRO</h1>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            submitForm();
          }}
        >
          <TextField placeholder="Nombre" value={name} onChange={(event) => setName(event.target.value)} required />
          <TextField
            placeholder="Correo electronico"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField placeholder="Empresa" value={company} onChange={(event) => setCompany(event.target.value)} />
          <select value={area} onChange={(event) => setArea(event.target.value)}>
            {AREAS.map((areaOption) => (
              <option key={areaOption} value={areaOption}>
                {areaOption}
              </option>
            ))}
          </select>
          <div className={styles.submitRow}>
            <Button type="submit">Comenzar</Button>
          </div>
        </form>
        <div className={styles.linkRow}>
          <button type="button" className={styles.textLink} onClick={() => setView('codeEntry')}>
            o ingresa tu ID
          </button>
          <Button variant="secondary" onClick={skip}>
            Continua sin registro
          </Button>
        </div>
      </div>
    </BrandFrame>
  );
}
