import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(userName, password, rememberMe)
      navigate('/orders', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-subtle) px-4">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-(--color-text-base) tracking-tight">
            glori82
          </h1>
          <p className="text-sm text-(--color-text-muted) mt-1">
            Admin Panel
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-(--color-border-base) shadow-sm p-8 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-(--color-text-base)">
              Welcome back
            </h2>
            <p className="text-sm text-(--color-text-muted) mt-0.5">
              Sign in to your account
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-(--color-danger) bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-(--color-danger) shrink-0" />
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-(--color-text-base)">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" strokeWidth={2} />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-(--color-border-base) rounded-lg outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-(--color-text-base)">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" strokeWidth={2} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-(--color-border-base) rounded-lg outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text-subtle) transition-colors"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" strokeWidth={2} />
                  : <Eye className="w-4 h-4" strokeWidth={2} />
                }
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-(--color-primary)"
            />
            <span className="text-sm text-(--color-text-subtle)">Remember me for 60 days</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-(--color-primary) hover:bg-(--color-primary-hover) rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
