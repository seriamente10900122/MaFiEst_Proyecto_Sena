import React from 'react';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import '../styles/navbar.css';
import '../styles/landing.css';

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const LandingPage = ({ user, setUser }) => {
  return (
    <div className="landing-container">
      <LandingNavbar user={user} setUser={setUser} />
      
      <section className="hero-section">
        <div className="floating-shapes">
          {[
            '∑', 'π', '∫', '√', 'Δ', '×', '÷', '±', '∞', 'θ', 'α', 'β', 
            '∂', 'μ', 'σ', 'λ', 'φ', 'Ω', '∈', '∀', '∃', '∇', '≠', '≤', '≥',
            'y = mx + b', 'E = mc²', 'x²', '(a+b)²', 'sin θ', 'cos θ', 'tan θ',
            'f(x)', 'dy/dx', 'lim x→∞', '∮', 'det(A)', '∏', '∐', 'ℝ', 'ℕ', 'ℤ',
            'ax² + bx + c = 0', 'e^x', 'f(πx) = πx − logₙ(f(πx))', 'log(x)', '∛', '∜', '∑(n=1 to ∞)',
            '∫f(x)dx', 'P(A∩B)', '|x|', '[a,b]', '{x∈ℝ}', '⇒', '⇔', '∠', '△',
            '⊥', '∥', '∝', '∼', '≈', '≡', '∎', '∴', '∵', '⊕', '⊗', '⊆', '⊇',
            'sin²(θ) + cos²(θ) = 1', 'eiπ + 1 = 0', 'f′(x)', 'f″(x)', '∂f/∂x'
          ].map((symbol, i) => (
            <div
              key={i}
              className="math-symbol"
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                color: 'rgba(255, 255, 255, 0.2)',
                fontSize: `${Math.random() * 32 + 20}px`,
                fontFamily: "'Computer Modern', 'Latin Modern Math', math, serif",
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDuration: `${Math.random() * 15 + 20}s`,
                animationDelay: `${Math.random() * 5}s`,
                textShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
              }}
            >
              {symbol}
            </div>
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Aprende Matemáticas de Forma Fácil y Divertida</h1>
            <p className="hero-subtitle">
              Domina las matemáticas con tutores expertos, recursos interactivos y un sistema
              de aprendizaje personalizado, la matemática es más fácil con nosotros y pasará a ser tu 
              mejor aliado ¡Animate con MaFiEst!
            </p>
            <div className="hero-buttons">
              {!user ? (
                <>
                  <Link to="/login" className="hero-button primary-button" onClick={scrollToTop}>
                    Empieza Ahora
                  </Link>
                  <Link to="/sobre-nosotros" className="hero-button secondary-button" onClick={scrollToTop}>
                    Conoce Más
                  </Link>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">¿Por qué elegir MaFiEst?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">�‍🏫</div>
            <h3 className="feature-title">Tutores Expertos</h3>
            <p className="feature-description">
              Aprende con profesionales altamente calificados y apasionados 
              por las matemáticas, que te guiarán paso a paso.
            </p>
            <ul className="feature-list">
              <li>Profesores con amplia experiencia</li>
              <li>Atención personalizada</li>
              <li>Metodología probada</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Aprendizaje Adaptativo</h3>
            <p className="feature-description">
              Sistema de aprendizaje que se adapta a tu ritmo y estilo, con contenido
              personalizado según tu nivel y objetivos.
            </p>
            <ul className="feature-list">
              <li>Contenido a tu medida</li>
              <li>Seguimiento continuo</li>
              <li>Retroalimentación</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3 className="feature-title">Recursos Interactivos</h3>
            <p className="feature-description">
              Accede a una amplia biblioteca de recursos digitales y herramientas
              interactivas diseñadas para facilitar tu aprendizaje.
            </p>
            <ul className="feature-list">
              <li>Ejercicios prácticos</li>
              <li>Videos explicativos</li>
              <li>Material descargable</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌟</div>
            <h3 className="feature-title">Resultados Garantizados</h3>
            <p className="feature-description">
              Nuestro método ha ayudado a muchos estudiantes a mejorar sus
              calificaciones y comprensión matemática.
            </p>
            <ul className="feature-list">
              <li>Mejora continua</li>
              <li>Éxito académico</li>
              <li>Confianza matemática</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">2+</div>
            <div className="stat-label">Estudiantes Activos</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Tutores Expertos</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">300+</div>
            <div className="stat-label">Videos Educativos</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">20+</div>
            <div className="stat-label">Biblioteca de Recursos</div>
          </div>
        </div>
      </section>

      <section className="benefits-section">
        <h2 className="section-title">Beneficios de Estudiar con Nosotros</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3>Aprendizaje Personalizado</h3>
            <p>Contenido adaptado a tu grupo, ritmo y nivel de aprendizaje.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💡</div>
            <h3>Clases Pregrabadas</h3>
            <p>Interactúa con las actividades y grabaciones de tu docente y grupo.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🖥️</div>
            <h3>Acceso 24/7</h3>
            <p>Estudia cuando y donde quieras.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Listo para Empezar tu Viaje Matemático?</h2>
          <p>Únete a nuestra comunidad y descubre una nueva forma de aprender matemáticas</p>
          <div className="cta-buttons">
            <Link to="/registro" className="cta-button primary" onClick={scrollToTop}>Comienza Gratis</Link>
            <Link to="/contactanos" className="cta-button secondary" onClick={scrollToTop}>Contáctanos</Link>
          </div>
        </div>
        <div className="math-decoration">
          {['∑', 'π', '∫', '√', 'Δ'].map((symbol, i) => (
            <span key={i} className="floating-symbol" style={{
              animationDelay: `${i * 0.5}s`
            }}>{symbol}</span>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">MaFiEst</h3>
            <p className="footer-description">
              Transformando la educación matemática a través de la tecnología y la innovación.
            </p>
            <div className="social-links">
              <a href="https://www.facebook.com/profile.php?id=61583043553669" className="social-link">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://x.com/MaFiEst_" className="social-link">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://www.instagram.com/mafiest_/" className="social-link">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://www.youtube.com/@MaFiEst-j2e" className="social-link">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Enlaces Rápidos</h4>
            <ul className="footer-links">
              <li><Link to="/sobre-nosotros" onClick={scrollToTop}>Sobre Nosotros</Link></li>
              <li><Link to="/contactanos" onClick={scrollToTop}>Contacto</Link></li>
              <li><Link to="/login" onClick={scrollToTop}>Iniciar Sesión</Link></li>
              <li><Link to="/registro" onClick={scrollToTop}>Registrarse</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>¿Por qué MaFiEst?</h4>
            <ul className="footer-links">
              <li>Tutores Expertos</li>
              <li>Aprendizaje Personalizado</li>
              <li>Recursos Interactivos</li>
              <li>Resultados Garantizados</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contacto</h4>
            <ul className="contact-info">
              <li><i className="fas fa-envelope"></i> info@mafiest.com</li>
              <li><i className="fas fa-phone"></i> 3225485730</li>
              <li><i className="fas fa-map-marker-alt"></i> Cali, Colombia</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom" style={{ 
          textAlign: "center",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem"
        }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} MaFiEst. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;