// נקודת הכניסה של האתר: טוען את העיצוב ומפעיל את הנתב (router)
import './styles/main.css';
import { startRouter } from './router.js';

startRouter(document.getElementById('app'));
