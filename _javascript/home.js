import { basic, initSidebar, initTopbar } from './modules/layouts';
import { initLikes, initLocaleDatetime, loadImg } from './modules/components';

loadImg();
initLikes();
initLocaleDatetime();
initSidebar();
initTopbar();
basic();
