import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import {
  HiOutlineArrowRightOnRectangle, HiOutlineLockOpen, HiOutlineLockClosed,
  HiOutlineUserPlus, HiOutlineEnvelope,
} from 'react-icons/hi2'

export default function AuthModal({ onClose }) {
  // modes: login | register | verify-register | forgot | verify-reset
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '' })
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.email, form.password)
      onClose()
      if (user.role === 'admin' || user.role === 'staff') navigate('/admin')
      else navigate('/cabinet')
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSendCode(e) {
    e.preventDefault()
    if (!form.first_name || !form.last_name) { setError('Укажите имя и фамилию'); return }
    if (form.password.length < 6) { setError('Пароль должен содержать не менее 6 символов'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.sendCode(form.email, 'register')
      setSuccess(`Код отправлен на ${form.email}`)
      setMode('verify-register')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка отправки кода')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.verifyRegister({
        email: form.email,
        code,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || undefined,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      onClose()
      navigate('/cabinet')
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный или истёкший код')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotSendCode(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.sendCode(form.email, 'reset')
      setSuccess(`Код отправлен на ${form.email}`)
      setMode('verify-reset')
    } catch (err) {
      setError(err.response?.data?.detail || 'Пользователь не найден')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyReset(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return }
    if (newPassword.length < 6) { setError('Пароль должен содержать не менее 6 символов'); return }
    setLoading(true)
    try {
      const { data } = await authApi.verifyReset(form.email, code, newPassword)
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      onClose()
      navigate('/cabinet')
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный или истёкший код')
    } finally {
      setLoading(false)
    }
  }

  async function resendCode(type) {
    setError('')
    setSuccess('')
    try {
      await authApi.sendCode(form.email, type)
      setSuccess('Новый код отправлен')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка отправки')
    }
  }

  function goLogin() { setMode('login'); setError(''); setSuccess(''); setCode('') }

  const TITLES = {
    login:           <><HiOutlineArrowRightOnRectangle size={18} /> Вход в аккаунт</>,
    register:        <><HiOutlineUserPlus size={18} /> Регистрация</>,
    'verify-register': <><HiOutlineEnvelope size={18} /> Подтверждение email</>,
    forgot:          <><HiOutlineLockOpen size={18} /> Восстановление пароля</>,
    'verify-reset':  <><HiOutlineLockClosed size={18} /> Новый пароль</>,
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{TITLES[mode]}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* ── Login ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={change} required />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Пароль</label>
                <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
                  Забыли пароль?
                </button>
              </div>
              <input className="form-control" name="password" type="password" placeholder="••••••••" value={form.password} onChange={change} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Загрузка...' : 'Войти'}
            </button>
          </form>
        )}

        {/* ── Register: fill form ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSendCode}>
            <div className="grid-2">
              <div className="form-group">
                <label>Имя</label>
                <input className="form-control" name="first_name" placeholder="Алексей" value={form.first_name} onChange={change} required />
              </div>
              <div className="form-group">
                <label>Фамилия</label>
                <input className="form-control" name="last_name" placeholder="Иванов" value={form.last_name} onChange={change} required />
              </div>
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input className="form-control" name="phone" placeholder="+7 (999) 123-45-67" value={form.phone} onChange={change} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={change} required />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input className="form-control" name="password" type="password" placeholder="••••••••" value={form.password} onChange={change} required minLength={6} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Отправка кода...' : 'Получить код на email'}
            </button>
          </form>
        )}

        {/* ── Register: enter code ── */}
        {mode === 'verify-register' && (
          <form onSubmit={handleVerifyRegister}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Введите 6-значный код, который мы отправили на <strong>{form.email}</strong>
            </p>
            <div className="form-group">
              <label>Код подтверждения</label>
              <input
                className="form-control"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' }}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || code.length !== 6}>
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Не пришло письмо?{' '}
              <button type="button" onClick={() => resendCode('register')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                Отправить снова
              </button>
            </p>
          </form>
        )}

        {/* ── Forgot: enter email ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSendCode}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Введите email вашего аккаунта — мы отправим код для сброса пароля.
            </p>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={change} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Отправка кода...' : 'Получить код на email'}
            </button>
          </form>
        )}

        {/* ── Reset: enter code + new password ── */}
        {mode === 'verify-reset' && (
          <form onSubmit={handleVerifyReset}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Введите код из письма на <strong>{form.email}</strong> и придумайте новый пароль.
            </p>
            <div className="form-group">
              <label>Код из письма</label>
              <input
                className="form-control"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' }}
                required
              />
            </div>
            <div className="form-group">
              <label>Новый пароль</label>
              <input className="form-control" type="password" placeholder="••••••••" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError('') }} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Повторите пароль</label>
              <input className="form-control" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }} required minLength={6} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || code.length !== 6}>
              {loading ? 'Сохранение...' : 'Установить новый пароль'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Не пришло письмо?{' '}
              <button type="button" onClick={() => resendCode('reset')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                Отправить снова
              </button>
            </p>
          </form>
        )}

        {/* ── Bottom link ── */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {(mode === 'forgot' || mode === 'verify-reset' || mode === 'verify-register') ? (
            <>
              Вспомнили данные?{' '}
              <button onClick={goLogin} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
                Войти
              </button>
            </>
          ) : (
            <>
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
