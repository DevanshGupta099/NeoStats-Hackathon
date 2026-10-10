import * as THREE from 'three';

export const TOKENS = {
  colors: {
    void: '#060709',
    basalt: '#0E1013',
    graphite: '#171A1F',
    steel: '#2A2F37',
    bone: '#ECE8DF',
    ash: '#9AA0A8',
    plasma: '#B8FF2C',
    ember: '#FF5A1F',
    ice: '#5CE1E6',
    amber: '#FFB020',
    crimson: '#FF2E4D',
  },
  roles: {
    ADMIN: '#FF5A1F', // ember
    PROJECT_MANAGER: '#B8FF2C', // plasma
    TEAM_MEMBER: '#5CE1E6', // ice
    VIEWER: '#9AA0A8', // ash
  },
  statuses: {
    BACKLOG: '#9AA0A8', // ash
    TODO: '#2A2F37', // steel
    IN_PROGRESS: '#B8FF2C', // plasma
    IN_REVIEW: '#FFB020', // amber
    DONE: '#5CE1E6', // ice
  },
  fonts: {
    display: '/fonts/big-shoulders-display-latin-900-normal.woff',
    displayBold: '/fonts/big-shoulders-display-latin-800-normal.woff',
    hud: '/fonts/chakra-petch-latin-600-normal.woff',
    hudBold: '/fonts/chakra-petch-latin-700-normal.woff',
    mono: '/fonts/jetbrains-mono-latin-400-normal.woff',
    body: '/fonts/barlow-semi-condensed-latin-400-normal.woff',
    oxanium: '/fonts/oxanium-latin-600-normal.woff',
  },
} as const;

// Three.js Shader Color Bridge
export const THREE_TOKENS = {
  void: new THREE.Color(TOKENS.colors.void),
  basalt: new THREE.Color(TOKENS.colors.basalt),
  steel: new THREE.Color(TOKENS.colors.steel),
  plasma: new THREE.Color(TOKENS.colors.plasma),
  ember: new THREE.Color(TOKENS.colors.ember),
  ice: new THREE.Color(TOKENS.colors.ice),
  amber: new THREE.Color(TOKENS.colors.amber),
  crimson: new THREE.Color(TOKENS.colors.crimson),
};
