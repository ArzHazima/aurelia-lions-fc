// Entry point: loads the global styles and starts the router
import './styles/main.css';
import { startRouter } from './router.js';

startRouter(document.getElementById('app'));
