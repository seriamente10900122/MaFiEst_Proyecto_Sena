import LandingNavbar from "../components/LandingNavbar";
import Navbar from "../components/Navbar";
import '../styles/sobrenosotros.css';

const SobreNosotros = ({ user, setUser }) => (
  <div className="about-container">
    {user ? <Navbar user={user} setUser={setUser} /> : <LandingNavbar user={user} setUser={setUser} />}
    <div className="about-content">
      <h1 className="about-title">Sobre Nosotros</h1>
      <div className="about-card">
        <p className="about-intro">
          Bienvenidos a <span className="highlight-text">Mafiest</span>, un espacio donde los jóvenes de grados superiores descubren cómo las matemáticas pueden transformar su futuro.
        </p>
        <div className="about-section">
          <div className="div">
          <h2>Fundadores de MaFiEst:</h2>
          <ul className="about-list">
            <li>Juan Manuel Estupiñan Medina</li>
            <li>Juan Camilo Bermudez Vidal</li>
            <li>Santiago Rojas Londoño</li>
            <li>Michael Adrian Ruiz Cuellar</li>            
          </ul>          
          </div>
          <ul className="about-list">
          <p className="about-section-title">Nos enfocamos en que cada estudiante logre mejorar grandes habilidades, como pueden ser:</p>
            <li>El pensamiento lógico</li>
            <li>Una mayor perseverancia</li>
            <li>Un mejor manejo en la tecnología</li>
          </ul>
        </div>
        <p className="about-text">
          Con nuestro acompañamiento, los estudiantes de los grados superiores podrán aprender y descubrir lo emocionante que es aprender y aplicar matemáticas.
        </p>
        <p className="about-text">
          ¡Queremos que se sientan motivados y seguros para enfrentar los retos del mundo digital!
        </p>
      </div>
    </div>
  </div>
);

export default SobreNosotros;