import { useState } from 'react'
import '../styles/SidePanel.css'

export default function SidePanel({ isOpen, onToggle }) {
  const [elementType, setElementType] = useState('wall')
  const [profile, setProfile] = useState('')
  const [expandedSection, setExpandedSection] = useState('element')

  const elementTypes = [
    { value: 'wall', label: 'Pared', icon: 'wall' },
    { value: 'slab', label: 'Losa', icon: 'slab' },
    { value: 'truss', label: 'Cercha', icon: 'truss' },
    { value: 'beam', label: 'Viga', icon: 'beam' },
    { value: 'column', label: 'Columna', icon: 'column' },
    { value: 'aligner', label: 'Alineador', icon: 'aligner' },
    { value: 'hrs', label: 'HRS', icon: 'hrs' },
  ]

  const profiles = {
    'IRAM-IAS-U500': ['CU 89x40x0.95', 'CU 100x40x0.95', 'CU 150x40x0.95', 'CU 200x44x1.24'],
    'Stud and Track': ['CU 89x40x0.95', 'CU 100x40x0.95', 'CU 150x40x1.24'],
    'Euro': ['CU 90x43x1.5', 'CU 150x43x1.5', 'CU 200x43x2.0'],
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="side-panel-overlay" onClick={onToggle} />}

      {/* Panel */}
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>

        {/* Content */}
        <div className="side-panel-content">

          {/* Sección: Tipo de Elemento */}
          <div className="panel-section">
            <button
              className={`section-header ${expandedSection === 'element' ? 'expanded' : ''}`}
              onClick={() => setExpandedSection(expandedSection === 'element' ? '' : 'element')}
            >
              <IconSection type="element" /> Elemento
              <span className="chevron">›</span>
            </button>
            {expandedSection === 'element' && (
              <div className="section-content">
                {elementTypes.map(type => (
                  <button
                    key={type.value}
                    className={`element-btn ${elementType === type.value ? 'active' : ''}`}
                    onClick={() => setElementType(type.value)}
                  >
                    <IconElement type={type.icon} />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sección: Perfil */}
          <div className="panel-section">
            <button
              className={`section-header ${expandedSection === 'profile' ? 'expanded' : ''}`}
              onClick={() => setExpandedSection(expandedSection === 'profile' ? '' : 'profile')}
            >
              <IconSection type="profile" /> Perfil CU/CC
              <span className="chevron">›</span>
            </button>
            {expandedSection === 'profile' && (
              <div className="section-content">
                {Object.entries(profiles).map(([standard, profs]) => (
                  <div key={standard} className="profile-group">
                    <div className="profile-standard">{standard}</div>
                    {profs.map(prof => (
                      <button
                        key={prof}
                        className={`profile-btn ${profile === prof ? 'active' : ''}`}
                        onClick={() => setProfile(prof)}
                      >
                        {prof}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección: Propiedades */}
          <div className="panel-section">
            <button
              className={`section-header ${expandedSection === 'props' ? 'expanded' : ''}`}
              onClick={() => setExpandedSection(expandedSection === 'props' ? '' : 'props')}
            >
              <IconSection type="props" /> Propiedades
              <span className="chevron">›</span>
            </button>
            {expandedSection === 'props' && (
              <div className="section-content">
                <div className="prop-group">
                  <label>Largo (mm)</label>
                  <input type="number" placeholder="5000" />
                </div>
                <div className="prop-group">
                  <label>Alto (mm)</label>
                  <input type="number" placeholder="2400" />
                </div>
                <div className="prop-group">
                  <label>Ángulo (°)</label>
                  <input type="number" placeholder="0" />
                </div>
              </div>
            )}
          </div>

          {/* Sección: Avanzado */}
          <div className="panel-section">
            <button
              className={`section-header ${expandedSection === 'advanced' ? 'expanded' : ''}`}
              onClick={() => setExpandedSection(expandedSection === 'advanced' ? '' : 'advanced')}
            >
              <IconSection type="advanced" /> Avanzado
              <span className="chevron">›</span>
            </button>
            {expandedSection === 'advanced' && (
              <div className="section-content">
                <div className="checkbox-group">
                  <input type="checkbox" id="btb" />
                  <label htmlFor="btb">Back-to-Back (BTB)</label>
                </div>
                <div className="checkbox-group">
                  <input type="checkbox" id="blocking" />
                  <label htmlFor="blocking">Blocking</label>
                </div>
                <div className="checkbox-group">
                  <input type="checkbox" id="stiffener" />
                  <label htmlFor="stiffener">Stiffener</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="side-panel-footer">
          <button className="btn-primary">Aplicar</button>
          <button className="btn-secondary">Limpiar</button>
        </div>
      </div>
    </>
  )
}

function IconElement({ type }) {
  const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }

  const icons = {
    wall: <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>,
    slab: <svg {...iconProps}><rect x="4" y="6" width="16" height="10" rx="1"/><line x1="4" y1="10" x2="20" y2="10"/></svg>,
    opening: <svg {...iconProps}><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M 9 8 L 15 8 L 15 12 L 9 12 Z"/></svg>,
    truss: <svg {...iconProps}><line x1="4" y1="20" x2="20" y2="20"/><line x1="12" y1="4" x2="4" y2="20"/><line x1="12" y1="4" x2="20" y2="20"/></svg>,
    beam: <svg {...iconProps}><line x1="3" y1="12" x2="21" y2="12" strokeWidth="4"/></svg>,
    column: <svg {...iconProps}><line x1="12" y1="3" x2="12" y2="21" strokeWidth="4"/></svg>,
    aligner: <svg {...iconProps}><line x1="3" y1="12" x2="21" y2="12"/><path d="M 12 7 L 12 17 M 8 12 L 16 12"/></svg>,
    hrs: <svg {...iconProps}><circle cx="12" cy="12" r="9"/><path d="M 12 7 L 12 17 M 7 12 L 17 12" strokeLinecap="round"/></svg>,
  }

  return <span className="element-icon">{icons[type] || icons.wall}</span>
}

function IconSection({ type }) {
  const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }

  const icons = {
    element: <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/></svg>,
    profile: <svg {...iconProps}><rect x="4" y="3" width="16" height="18" rx="1"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>,
    props: <svg {...iconProps}><circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    advanced: <svg {...iconProps}><path d="M 12 3 L 20 7 L 20 17 L 12 21 L 4 17 L 4 7 Z"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>,
  }

  return <span className="section-icon">{icons[type] || icons.element}</span>
}
