import { useState } from 'react';
import iconArrowRight from '../../../../assets/images/icon-arrow-right.svg';
import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { IdInput } from '../../../../components/IdInput/IdInput';
import { Logo } from '../../../../components/Logo/Logo';
import { Modal } from '../../../../components/Modal';
import modalStyles from '../../../../components/Modal/Modal.module.css';
import { TextField } from '../../../../components/TextField/TextField';
import { checkEmailUsedRemotely, hasEmailPlayedLocally, rememberUsedEmail } from '../../../../services/idService';
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
 *
 * Antes de esto, esta pantalla no avisaba si el correo ya habia
 * participado - el insert final se rechazaba en silencio por el unique
 * constraint de Supabase, pero la persona nunca se enteraba de que no
 * conto. Ahora, igual que Memory Match/las apps de celular: primero un
 * chequeo local (hasEmailPlayedLocally, instantaneo, esta misma tablet), y
 * si pasa, uno real contra el sync-server (checkEmailUsedRemotely, con
 * timeout corto - nunca bloquea el registro si no hay internet).
 *
 * Las tres vistas estan posicionadas exactas a Figma (nodos 224:2764,
 * 224:3009, 224:3145 - design canvas 1920x1200; ScaleViewport escala todo el
 * canvas de forma uniforme, asi que los px literales de Figma sirven como
 * coordenadas absolutas sin ninguna conversion de unidad). El teclado en
 * pantalla que muestra 224:3009 es solo referencia visual de Figma: los
 * inputs ya son numericos nativos (ver IdInput.tsx), no se replica un
 * teclado a mano - decision previa, documentada ahi mismo.
 */
export function Register({ onComplete }: RegisterProps) {
  const [view, setView] = useState<RegisterView>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(AREAS[0]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [showAdvertencia, setShowAdvertencia] = useState(false);

  const skip = () => onComplete(EMPTY_SESSION);

  const submitForm = async () => {
    if (checking) return;
    const trimmedEmail = email.trim();

    if (hasEmailPlayedLocally(trimmedEmail)) {
      setShowAdvertencia(true);
      return;
    }

    setChecking(true);
    const usedRemotely = await checkEmailUsedRemotely(trimmedEmail);
    setChecking(false);
    if (usedRemotely) {
      rememberUsedEmail(trimmedEmail);
      setShowAdvertencia(true);
      return;
    }

    setGeneratedCode(generateParticipantCode());
    setView('codeDisplay');
  };

  if (view === 'codeEntry') {
    return (
      <BrandFrame>
        <div className={`${styles.logo} enterFromTop`}>
          <Logo width={496} />
        </div>
        <h1 className={`${styles.titleCode} enterFromLeft delay1`}>CÓDIGO ID</h1>
        <div className={`${styles.idInputBox} enterFromBottom delay2`}>
          <IdInput
            value={enteredCode}
            onChange={setEnteredCode}
            onComplete={(code) => onComplete({ name: null, email: null, code })}
          />
        </div>
        <button type="button" className={`${styles.textLinkUnder} enterFade delay3`} onClick={() => setView('form')}>
          ir a Registro
        </button>
        <button type="button" className={`${styles.skipLink} enterFade delay4`} onClick={skip}>
          <span>Continua</span>
          <span>sin registro</span>
        </button>
      </BrandFrame>
    );
  }

  if (view === 'codeDisplay') {
    return (
      <BrandFrame>
        <div className={`${styles.logo} enterFromTop`}>
          <Logo width={496} />
        </div>
        <h1 className={`${styles.titleCode} enterFromLeft delay1`}>CÓDIGO ID</h1>
        <div className={`${styles.idInputBox} enterScale delay2`}>
          <IdInput value={generatedCode} onChange={() => {}} readOnly />
        </div>
        <div className={`${styles.finishButtonBox} enterFromBottom delay3`}>
          <Button className={styles.finishButton} onClick={() => onComplete({ name: name || null, email: email || null, code: generatedCode })}>
            Finalizar
          </Button>
        </div>
        <button type="button" className={`${styles.textLinkBelowButton} enterFade delay4`} onClick={() => setView('form')}>
          ir a Registro
        </button>
      </BrandFrame>
    );
  }

  return (
    <BrandFrame>
      <div className={`${styles.logo} enterFromTop`}>
        <Logo width={496} />
      </div>
      <h1 className={`${styles.titleForm} enterFromLeft delay1`}>REGISTRO</h1>
      <form
        className={`${styles.form} enterFromBottom delay2`}
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm();
        }}
      >
        <div className={`${styles.fieldBox} ${styles.nameField}`}>
          <TextField placeholder="Nombre" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className={`${styles.fieldBox} ${styles.emailField}`}>
          <TextField
            placeholder="Correo electronico"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className={`${styles.fieldBox} ${styles.companyField}`}>
          <TextField placeholder="Empresa" value={company} onChange={(event) => setCompany(event.target.value)} />
        </div>
        <div className={`${styles.fieldBox} ${styles.phoneField}`}>
          <TextField
            placeholder="Celular"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className={`${styles.fieldBox} ${styles.areaField}`}>
          <select className={styles.areaSelect} value={area} onChange={(event) => setArea(event.target.value)}>
            {AREAS.map((areaOption) => (
              <option key={areaOption} value={areaOption}>
                {areaOption}
              </option>
            ))}
          </select>
          <svg className={styles.areaSelectArrow} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className={styles.buttonBox}>
          <Button className={styles.ctaButton} type="submit" disabled={checking}>
            {checking ? 'Verificando...' : 'Comenzar'}
          </Button>
        </div>
      </form>
      <button type="button" className={`${styles.textLinkUnder} enterFade delay3`} onClick={() => setView('codeEntry')}>
        ó ingresa tu ID
      </button>
      <button type="button" className={`${styles.skipButton} enterFade delay4`} onClick={skip}>
        <span className={styles.skipButtonLabel}>
          <span>Continua</span>
          <span>sin registro</span>
        </span>
        <span className={styles.skipButtonArrow} aria-hidden="true">
          <img src={iconArrowRight} alt="" className={styles.skipButtonArrowIcon} />
        </span>
      </button>

      <Modal open={showAdvertencia} onClose={() => setShowAdvertencia(false)}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2L1 21h22L12 2z"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 9v5" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1" fill="var(--color-primary)" />
        </svg>
        <p className={modalStyles.text}>Parece que ya participaste en esta experiencia. ¡Gracias!</p>
      </Modal>
    </BrandFrame>
  );
}
