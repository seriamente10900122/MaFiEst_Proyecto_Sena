import '../styles/auth.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import loginService from '../services/login';
import asesoriasService from '../services/asesorias';
import LandingNavbar from '../components/LandingNavbar';

const Login = ({ user, setUser }) => {
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [message, setMessage] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleLogin = async (event) => {
		event.preventDefault();
		setLoading(true);
		setMessage(null);

		try {
			const userData = await loginService.login({ username, password });
			if (userData.token) {
			asesoriasService.setToken(userData.token)
			}
			window.localStorage.setItem('loggedMafiestUser', JSON.stringify(userData));
			setUser(userData);
			setMessage({ type: true, message: '¡Login exitoso!' });
			setUsername('');
			setPassword('');
			navigate('/');
		} catch (error) {
			setMessage({ type: false, message: 'Usuario o contraseña incorrectos.' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<LandingNavbar user={user} setUser={setUser} />
			<div className="auth-content">
				<div className="auth-header">
					<h2 className="auth-title">Iniciar Sesión</h2>
					<p className="auth-subtitle">Accede a tu cuenta para continuar</p>
				</div>
				<div className="auth-form-container">
					{message && (
						<div style={{
							padding: '12px',
							borderRadius: '8px',
							marginBottom: '16px',
							background: message.type ? '#f0fdf4' : '#fef2f2',
							color: message.type ? '#166534' : '#991b1b',
							border: `1px solid ${message.type ? '#bbf7d0' : '#fecaca'}`,
						}}>
							{message.message}
						</div>
					)}
					<form onSubmit={handleLogin}>
						<div className="form-group">
							<label className="form-label">Usuario</label>
							<input
								type="text"
								value={username}
								name="Username"
								className="form-input"
								placeholder="Ingresa tu nombre de usuario"
								onChange={({ target }) => setUsername(target.value)}
								disabled={loading}
								required
							/>
						</div>
						<div className="form-group">
							<label className="form-label">Contraseña</label>
								<div style={{ position: 'relative' }}>
									<input
										type={showPassword ? "text" : "password"}
										value={password}
										name="Password"
										className="form-input"
										placeholder="Ingresa tu contraseña"
										onChange={({ target }) => setPassword(target.value)}
										disabled={loading}
										required
									/>
									<button
										type="button"
										style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1em' }}
										onClick={() => setShowPassword((prev) => !prev)}
										tabIndex={-1}
									>
										{showPassword ? '🙈' : '👁️'}
									</button>
								</div>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="submit-button"
						>
							{loading ? 'Cargando...' : 'Iniciar Sesión'}
						</button>

						<Link to="/registro" className="auth-switch-link">
							¿No tienes cuenta? Regístrate aquí
						</Link>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;