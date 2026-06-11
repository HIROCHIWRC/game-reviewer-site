import { useState, useRef } from 'react';
import { FormInput } from '../components/FormInput';
import { YellowButton } from '../components/YellowButton';
import { SegmentedControl } from '../components/SegmentedControl';

export function AuthScreen({ onLogin, onRegister, error, loading }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef(null);

  const handleSubmit = () => {
    if (mode === 'login') onLogin(username, password);
    else onRegister(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-2">
          Game Reviewer
        </h1>
        <p className="text-slate-500 text-sm">Твой личный рейтинг игр</p>
      </header>

      <div className="w-full max-w-sm bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
        <SegmentedControl
          options={[
            { value: 'login', label: 'Войти' },
            { value: 'register', label: 'Регистрация' },
          ]}
          value={mode}
          onChange={setMode}
        />

        <div className="space-y-4 mt-8">
          <FormInput
            label="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Например, gamer2000"
            onEnter={() => passwordRef.current?.focus()}
          />
          <FormInput
            ref={passwordRef}
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            onEnter={handleSubmit}
          />
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <YellowButton
            text={loading ? '⏳ Загрузка...' : mode === 'login' ? '🚀 Войти' : '✨ Создать аккаунт'}
            onClick={handleSubmit}
            className="w-full max-w-[320px]"
            height={52}
            fontSize={15}
          />
        </div>
      </div>
    </div>
  );
}